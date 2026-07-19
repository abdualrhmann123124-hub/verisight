"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "warning" | "danger";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

/** Caller-facing shape. `tone` defaults to "info"; the stored item always
 *  has one resolved. Intersecting `Omit<ToastItem, "id">` with an optional
 *  `tone` would not have made it optional — the required member wins. */
export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the toast queue. Throws rather than silently no-op-ing, so a
 *  missing provider surfaces in development instead of swallowing feedback
 *  the user was supposed to receive. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE_CONFIG: Record<
  ToastTone,
  { icon: typeof Info; className: string; role: "status" | "alert" }
> = {
  // Advisory messages use `status` (polite) so they wait for a pause in
  // screen-reader output. Failures use `alert` (assertive) and interrupt —
  // the distinction is what keeps assertive announcements meaningful.
  info: { icon: Info, className: "text-accent", role: "status" },
  success: { icon: CheckCircle2, className: "text-success", role: "status" },
  warning: { icon: TriangleAlert, className: "text-warning", role: "status" },
  danger: { icon: AlertCircle, className: "text-danger", role: "alert" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((input) => {
    setToasts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tone: input.tone ?? "info",
        title: input.title,
        ...(input.description !== undefined && { description: input.description }),
      },
    ]);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}

        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const { icon: Icon, className, role } = TONE_CONFIG[item.tone];
            return (
              <ToastPrimitive.Root
                key={item.id}
                asChild
                forceMount
                type={role === "alert" ? "foreground" : "background"}
                onOpenChange={(open) => {
                  if (!open) dismiss(item.id);
                }}
              >
                <motion.li
                  layout
                  initial={{ opacity: 0, x: 24, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    x: 16,
                    scale: 0.97,
                    transition: { duration: 0.15 },
                  }}
                  transition={SPRING_UI}
                  className={cn(
                    "pointer-events-auto flex w-full items-start gap-3",
                    "rounded-lg border border-line bg-surface-overlay p-4 shadow-lg",
                  )}
                >
                  <Icon
                    className={cn("mt-0.5 size-4.5 shrink-0", className)}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <ToastPrimitive.Title className="text-body-sm font-medium text-ink">
                      {item.title}
                    </ToastPrimitive.Title>
                    {item.description && (
                      <ToastPrimitive.Description className="text-caption text-ink-muted">
                        {item.description}
                      </ToastPrimitive.Description>
                    )}
                  </div>
                  <ToastPrimitive.Close
                    aria-label="Dismiss notification"
                    className={cn(
                      "grid size-6 shrink-0 cursor-pointer place-items-center rounded-md",
                      "text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    )}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </ToastPrimitive.Close>
                </motion.li>
              </ToastPrimitive.Root>
            );
          })}
        </AnimatePresence>

        <ToastPrimitive.Viewport
          className={cn(
            "pointer-events-none fixed z-50 flex list-none flex-col gap-2 outline-none",
            // Bottom on mobile (within thumb reach), top-right on desktop
            // (clear of the primary content column).
            "right-0 bottom-0 left-0 m-0 w-full p-4",
            "sm:top-0 sm:bottom-auto sm:left-auto sm:w-96",
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
