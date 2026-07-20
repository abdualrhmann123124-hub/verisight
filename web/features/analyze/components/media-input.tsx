"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileVideo,
  Link2,
  Loader2,
  ShieldQuestion,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ClipboardEvent,
} from "react";

import { fill, useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { DURATION, EASE_OUT_EXPO, SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  analysableUrl,
  checkMediaFile,
  checkMediaUrl,
  FILE_ACCEPT,
  formatBytes,
  type UrlCheck,
  type ValidationMessages,
} from "@/features/analyze/lib/media-source";
import { setPendingFile } from "@/features/analyze/lib/pending-file";

/** Maps a fetch-media failure code onto the reader's language. */
function fetchFailureMessage(reason: unknown, v: ValidationMessages): string {
  switch (reason) {
    case "invalid-url":
      return v.urlMalformed;
    case "blocked-host":
      return v.fetchBlocked;
    case "not-an-image":
      return v.fetchNotImage;
    case "too-large":
      return v.fetchTooLarge;
    default:
      return v.fetchUnreachable;
  }
}

// A real, stable public image (Wikimedia Commons), so "try an example"
// exercises the actual fetch-and-analyze path instead of dead-ending.
const EXAMPLE_URL = "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg";

interface SelectedFile {
  name: string;
  size: number;
  kind: "image" | "video";
  previewUrl: string;
  /** Kept so the chosen file can be handed to the workspace on analyze. */
  source: File;
}

/**
 * The landing page's input surface: pick a file, drop one, or paste a link.
 *
 * Analysis itself happens in the workspace at `/analyze`, which owns the
 * preflight pipeline and the engine call. This component hands the file over
 * and navigates rather than re-implementing that flow, so there is one
 * analysis path rather than two that drift.
 *
 * Links are recognised but not analyzed — see `LINK_ANALYSIS_AVAILABLE`. The
 * field says so plainly instead of accepting a URL that leads nowhere.
 */
export function MediaInput() {
  const { t } = useLocale();
  const [url, setUrl] = useState("");
  const [check, setCheck] = useState<UrlCheck>({ status: "empty" });
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Drag events fire for every child element, so a boolean flag flickers.
  // Counting enter/leave pairs is what makes the highlight stable.
  const dragDepth = useRef(0);

  // Object URLs are a leak if not revoked; the browser holds the blob alive
  // for the document's lifetime otherwise.
  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(file.previewUrl);
    };
  }, [file]);

  const acceptFile = useCallback(
    (candidate: File) => {
      const result = checkMediaFile(candidate, t.validation);
      if (result.status === "error") {
        setFileError(result.message);
        setFile(null);
        return;
      }
      setFileError(null);
      setUrl("");
      setCheck({ status: "empty" });
      setFile((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return {
          name: candidate.name,
          size: candidate.size,
          kind: result.kind,
          previewUrl: URL.createObjectURL(candidate),
          source: candidate,
        };
      });
    },
    [t],
  );

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setCheck(checkMediaUrl(value, t.validation));
      if (value) {
        setFileError(null);
        setFile((previous) => {
          if (previous) URL.revokeObjectURL(previous.previewUrl);
          return null;
        });
      }
    },
    [t],
  );

  // Pasting an image straight from the clipboard is a real workflow —
  // screenshots never touch the filesystem.
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const item = Array.from(event.clipboardData.files)[0];
      if (item) {
        event.preventDefault();
        acceptFile(item);
      }
    },
    [acceptFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const dropped = event.dataTransfer.files[0];
      if (dropped) acceptFile(dropped);
    },
    [acceptFile],
  );

  const handleFilePick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0];
      if (picked) acceptFile(picked);
      // Reset so picking the same file twice still fires a change event.
      event.target.value = "";
    },
    [acceptFile],
  );

  const clearFile = useCallback(() => {
    setFile((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return null;
    });
    setFileError(null);
  }, []);

  // A picked file, a direct image link, or a YouTube cover image can all be
  // analyzed. The button stays disabled for everything else — enabling it for
  // a post page would promise something the fetch cannot deliver.
  const remoteUrl = analysableUrl(check);
  const canAnalyze = Boolean(file) || Boolean(remoteUrl);

  const handleAnalyze = useCallback(async () => {
    setNotice(null);

    // Hand the file to the workspace, which owns the preflight pipeline and
    // the engine call. Duplicating that here would mean two implementations
    // of the same flow drifting apart.
    if (file) {
      setPending(true);
      setPendingFile(file.source);
      router.push("/analyze");
      return;
    }

    // A link is analysed by fetching the bytes server-side and continuing as
    // if they had been uploaded — one pipeline, whatever the input.
    if (!remoteUrl) return;
    setPending(true);
    try {
      const response = await fetch("/api/fetch-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: remoteUrl }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          reason?: string;
        } | null;
        setNotice(fetchFailureMessage(payload?.reason, t.validation));
        setPending(false);
        return;
      }

      const blob = await response.blob();
      const encoded = response.headers.get("X-Media-Filename");
      const name = encoded ? decodeURIComponent(encoded) : "remote-image.jpg";
      setPendingFile(new File([blob], name, { type: blob.type }));
      router.push("/analyze");
    } catch {
      setNotice(t.validation.fetchUnreachable);
      setPending(false);
    }
  }, [file, remoteUrl, router, t]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "group relative rounded-2xl border p-2 transition-all duration-300",
          "ease-[var(--ease-out-expo)]",
          dragging
            ? "border-accent bg-accent-subtle shadow-glow"
            : "border-line bg-surface/70 shadow-lg hover:border-line-strong",
        )}
      >
        {/* Drop overlay */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99, transition: { duration: DURATION.fast } }}
              transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
              className={cn(
                "pointer-events-none absolute inset-0 z-20 grid place-items-center",
                "rounded-2xl border-2 border-dashed border-accent bg-canvas/85 backdrop-blur-sm",
              )}
            >
              <div className="flex flex-col items-center gap-2 text-accent">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload className="size-7" aria-hidden="true" />
                </motion.div>
                <p className="text-body-sm font-medium">{t.input.dropToLoad}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4",
              "h-14 bg-surface-inset transition-colors duration-200",
              "focus-within:bg-surface-raised",
            )}
          >
            <Link2
              className="size-5 shrink-0 text-ink-faint transition-colors group-focus-within:text-accent"
              aria-hidden="true"
            />
            <input
              id={inputId}
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onPaste={handlePaste}
              disabled={Boolean(file)}
              placeholder={t.input.urlPlaceholder}
              aria-label={t.input.urlLabel}
              aria-invalid={
                check.status === "invalid" ||
                check.status === "unsupported" ||
                check.status === "insecure"
              }
              aria-describedby={`${inputId}-status`}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none",
                "placeholder:text-ink-faint focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            {url && (
              <button
                type="button"
                onClick={() => handleUrlChange("")}
                aria-label={t.input.clearUrl}
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-overlay hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_ACCEPT}
              onChange={handleFilePick}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <Button
              variant="secondary"
              size="lg"
              className="h-14 flex-1 sm:flex-none"
              leadingIcon={<Upload />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t.input.upload}
            </Button>
            <Button
              size="lg"
              className="h-14 flex-1 sm:flex-none"
              disabled={!canAnalyze}
              loading={pending}
              loadingLabel={file ? t.input.checking : t.input.fetchingRemote}
              leadingIcon={<Sparkles />}
              onClick={handleAnalyze}
            >
              {t.input.analyze}
            </Button>
          </div>
        </div>

        {/* Selected file preview */}
        <AnimatePresence initial={false}>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_UI}
              className="overflow-hidden"
            >
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-surface-inset p-3">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-overlay">
                  {file.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileVideo className="size-5 text-support" aria-hidden="true" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-body-sm font-medium text-ink">
                    {file.name}
                  </p>
                  <p className="text-caption text-ink-faint">
                    {file.kind === "image" ? t.input.image : t.input.video} ·{" "}
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label={fill(t.input.removeFile, { name: file.name })}
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-overlay hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status line. `aria-live` announces validation as the user types,
          without moving focus away from the field. */}
      <div
        id={`${inputId}-status`}
        aria-live="polite"
        className="flex min-h-6 items-start gap-2 px-1"
      >
        <StatusLine
          check={check}
          fileError={fileError}
          fileName={file?.name ?? null}
          notice={notice}
          pending={pending}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <span className="inline-flex items-center gap-1.5 text-caption text-ink-faint">
          <FileImage className="size-3.5" aria-hidden="true" />
          {t.input.imageLimits}
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-ink-faint">
          <FileVideo className="size-3.5" aria-hidden="true" />
          {t.input.videoLimits}
        </span>
        <button
          type="button"
          onClick={() => handleUrlChange(EXAMPLE_URL)}
          className="rounded-sm text-caption text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t.input.tryExample}
        </button>
      </div>
    </div>
  );
}

function StatusLine({
  check,
  fileError,
  fileName,
  notice,
  pending,
}: {
  check: UrlCheck;
  fileError: string | null;
  fileName: string | null;
  notice: string | null;
  pending: boolean;
}) {
  const { t } = useLocale();

  if (pending) {
    return (
      <Message tone="muted" icon={<Loader2 className="animate-spin" />}>
        {t.input.checking}
      </Message>
    );
  }

  if (notice) {
    return (
      <Message tone="warning" icon={<ShieldQuestion />}>
        {notice}
      </Message>
    );
  }

  if (fileError) {
    return (
      <Message tone="danger" icon={<AlertCircle />}>
        {fileError}
      </Message>
    );
  }

  if (fileName) {
    return (
      <Message tone="success" icon={<CheckCircle2 />}>
        {t.input.readyToAnalyze}
      </Message>
    );
  }

  switch (check.status) {
    // A direct image link is genuinely analysable — the server fetches the
    // bytes and the normal pipeline takes over.
    case "image":
      return (
        <Message tone="success" icon={<Link2 />}>
          {fill(t.input.linkImageReady, { host: check.hostname })}
        </Message>
      );
    // YouTube: the cover image is fetchable, the video is not. Saying which
    // one will be inspected is the difference between a feature and a trick.
    case "thumbnail":
      return (
        <Message tone="success" icon={<Link2 />}>
          {fill(t.input.linkThumbnail, { platform: check.label })}
        </Message>
      );
    case "videoFile":
      return (
        <Message tone="warning" icon={<Link2 />}>
          {fill(t.input.linkVideoFile, { host: check.hostname })}
        </Message>
      );
    // A recognised post page is still not a fetchable one; the limitation is
    // stated in the same breath as the recognition.
    case "platform":
      return (
        <Message tone="warning" icon={<Link2 />}>
          {fill(t.input.linkRecognised, { platform: check.platform.label })}
        </Message>
      );
    case "insecure":
      return (
        <Message tone="warning" icon={<AlertCircle />}>
          {check.message}
        </Message>
      );
    case "invalid":
    case "unsupported":
      return (
        <Message tone="danger" icon={<AlertCircle />}>
          {check.message}
        </Message>
      );
    default:
      return null;
  }
}

const TONE_CLASS = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-ink-muted",
} as const;

function Message({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof TONE_CLASS;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
      className={cn(
        "flex items-start gap-2 text-caption",
        TONE_CLASS[tone],
        "[&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:shrink-0",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </motion.p>
  );
}
