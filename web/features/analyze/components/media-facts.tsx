"use client";

import { Camera, Copy, Info, MapPin, Wrench } from "lucide-react";
import { useCallback, useState } from "react";

import { fill, useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDuration, type MediaFacts } from "@/features/analyze/lib/preflight";

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <dt className="shrink-0 text-caption text-ink-faint">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-body-sm text-ink",
          mono && "font-mono text-caption",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Facts extracted from the file itself.
 *
 * Everything shown here was measured, not inferred — dimensions come from
 * decoding, the hash from the raw bytes, the camera tags from the file's own
 * EXIF block.
 *
 * The metadata section is where users most often over-read the evidence, so
 * the copy is deliberately careful: missing EXIF is *weak* evidence, because
 * every major platform strips it on upload. Saying that plainly costs nothing
 * and prevents a confident wrong conclusion.
 */
export function MediaFactsPanel({ facts }: { facts: MediaFacts }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const copyHash = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(facts.sha256);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied; failing silently is fine here since
      // the full hash is visible and selectable on screen anyway.
    }
  }, [facts.sha256]);

  const resolution =
    facts.width && facts.height
      ? `${facts.width} × ${facts.height}`
      : t.facts.unavailable;

  return (
    <Card variant="surface" padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-display text-h4 text-ink">{t.facts.title}</h2>
        <Badge variant="neutral" size="sm">
          {t.facts.measured}
        </Badge>
      </div>

      <dl className="flex flex-col px-5 py-2">
        <Row label={t.facts.name} value={facts.name} />
        <Row label={t.facts.type} value={facts.mimeType} />
        <Row label={t.facts.size} value={facts.sizeLabel} />
        <Row label={t.facts.resolution} value={resolution} />
        {facts.durationSeconds !== undefined && (
          <Row label={t.facts.duration} value={formatDuration(facts.durationSeconds)} />
        )}
      </dl>

      <Separator />

      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-ink-faint">SHA-256</span>
          <button
            type="button"
            onClick={copyHash}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1",
              "text-caption text-ink-muted transition-colors",
              "hover:bg-surface-raised hover:text-ink",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            )}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            {copied ? t.facts.copied : t.facts.copy}
          </button>
        </div>
        <p className="mt-1.5 font-mono text-micro leading-relaxed break-all text-ink-muted">
          {facts.sha256}
        </p>
        <p className="mt-2 text-caption text-ink-faint">{t.facts.hashNote}</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-ink-faint">{t.facts.embeddedMetadata}</span>
          <Badge variant={facts.hasExif ? "success" : "warning"} size="sm" dot>
            {facts.hasExif
              ? fill(t.facts.tags, { count: facts.exifTagCount })
              : t.facts.noneFound}
          </Badge>
        </div>

        {facts.hasExif ? (
          <dl className="flex flex-col">
            {facts.cameraMake && (
              <Row
                label={t.facts.camera}
                value={[facts.cameraMake, facts.cameraModel].filter(Boolean).join(" ")}
              />
            )}
            {facts.software && <Row label={t.facts.software} value={facts.software} />}
            {facts.capturedAt && (
              <Row
                label={t.facts.captured}
                value={new Date(facts.capturedAt).toLocaleString()}
              />
            )}
          </dl>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {facts.cameraMake && (
            <Badge variant="success" size="sm" icon={<Camera />}>
              {t.facts.cameraSignature}
            </Badge>
          )}
          {facts.software && (
            <Badge variant="warning" size="sm" icon={<Wrench />}>
              {t.facts.editingSoftware}
            </Badge>
          )}
          {facts.hasGps && (
            <Badge variant="accent" size="sm" icon={<MapPin />}>
              {t.facts.locationPresent}
            </Badge>
          )}
        </div>

        {/* The single most misread signal in the whole product. */}
        <div className="flex gap-2 rounded-lg bg-surface-inset p-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
          <p className="text-caption text-ink-faint">
            {facts.hasExif ? t.facts.metadataPresentNote : t.facts.metadataAbsentNote}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Media preview.
 *
 * Sized by aspect ratio so the layout does not jump when the image finishes
 * decoding — the dimensions are already known from preflight, so there is no
 * reason to make the user watch a reflow.
 */
export function MediaPreview({
  facts,
  objectUrl,
}: {
  facts: MediaFacts;
  objectUrl: string;
}) {
  const { t } = useLocale();
  const ratio =
    facts.width && facts.height ? `${facts.width} / ${facts.height}` : "16 / 9";

  return (
    <Card variant="surface" padding="none" className="overflow-hidden">
      <div
        className="relative grid w-full place-items-center bg-surface-inset"
        style={{ aspectRatio: ratio, maxHeight: "60vh" }}
      >
        {facts.kind === "image" ? (
          // Intentionally not next/image: this is a client-side blob URL of a
          // user file, so there is nothing for the optimizer to fetch or cache.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={`Preview of ${facts.name}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            src={objectUrl}
            controls
            preload="metadata"
            aria-label={`Preview of ${facts.name}`}
            className="max-h-full max-w-full"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        <Tooltip content={t.facts.processedTooltip}>
          <span className="cursor-help text-caption text-ink-faint underline decoration-dotted underline-offset-4">
            {t.facts.processedLocally}
          </span>
        </Tooltip>
        <span className="tabular text-caption text-ink-faint">
          {facts.width} × {facts.height}
          {facts.durationSeconds !== undefined &&
            ` · ${formatDuration(facts.durationSeconds)}`}
        </span>
      </div>
    </Card>
  );
}
