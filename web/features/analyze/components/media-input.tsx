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

import { Button } from "@/components/ui/button";
import { DURATION, EASE_OUT_EXPO, SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  checkMediaFile,
  checkMediaUrl,
  FILE_ACCEPT,
  formatBytes,
  type UrlCheck,
} from "@/features/analyze/lib/media-source";

const EXAMPLE_URL = "https://images.example.com/press-photo-2024.jpg";

interface SelectedFile {
  name: string;
  size: number;
  kind: "image" | "video";
  previewUrl: string;
}

/**
 * The primary input surface: paste a URL, pick a file, or drop one.
 *
 * Phase 2 delivers the full input contract — validation, previews, and every
 * feedback state. The analyze action is intentionally not wired to a backend
 * yet (Phase 4 builds the engine); rather than fake a result, the button
 * reports honestly that analysis is not yet available. A convincing fake here
 * would be the one thing this product cannot afford.
 */
export function MediaInput() {
  const [url, setUrl] = useState("");
  const [check, setCheck] = useState<UrlCheck>({ status: "empty" });
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const acceptFile = useCallback((candidate: File) => {
    const result = checkMediaFile(candidate);
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
      };
    });
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setCheck(checkMediaUrl(value));
    if (value) {
      setFileError(null);
      setFile((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return null;
      });
    }
  }, []);

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

  const hasValidUrl = check.status === "platform" || check.status === "direct";
  const canAnalyze = Boolean(file) || hasValidUrl;

  const handleAnalyze = useCallback(() => {
    setPending(true);
    setNotice(null);
    // Deliberately honest: the analysis engine ships in Phase 4. Showing a
    // fabricated confidence score would undermine the product's entire premise.
    window.setTimeout(() => {
      setPending(false);
      setNotice(
        "Input accepted. The analysis engine is still in development — no result is available yet.",
      );
    }, 900);
  }, []);

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
                <p className="text-body-sm font-medium">Drop to load media</p>
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
              placeholder="Paste a public image or video link"
              aria-label="Media URL"
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
                aria-label="Clear URL"
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
              Upload
            </Button>
            <Button
              size="lg"
              className="h-14 flex-1 sm:flex-none"
              disabled={!canAnalyze}
              loading={pending}
              loadingLabel="Checking media"
              leadingIcon={<Sparkles />}
              onClick={handleAnalyze}
            >
              Analyze
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
                    {file.kind === "image" ? "Image" : "Video"} · {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label={`Remove ${file.name}`}
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
          PNG, JPG, WEBP up to 25 MB
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-ink-faint">
          <FileVideo className="size-3.5" aria-hidden="true" />
          MP4, MOV, WEBM up to 200 MB
        </span>
        <button
          type="button"
          onClick={() => handleUrlChange(EXAMPLE_URL)}
          className="rounded-sm text-caption text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Try an example link
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
  if (pending) {
    return (
      <Message tone="muted" icon={<Loader2 className="animate-spin" />}>
        Checking media…
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
        Ready to analyze.
      </Message>
    );
  }

  switch (check.status) {
    case "platform":
      return (
        <Message tone="success" icon={<CheckCircle2 />}>
          {check.platform.label} link detected.
          {"note" in check.platform && check.platform.note ? (
            <span className="text-ink-faint"> {check.platform.note}</span>
          ) : null}
        </Message>
      );
    case "direct":
      return (
        <Message tone="success" icon={<CheckCircle2 />}>
          Direct media link detected on {check.hostname}.
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
