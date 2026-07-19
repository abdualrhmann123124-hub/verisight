"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { dialogVariants, overlayVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Radix mounts/unmounts content itself, which would cut the exit animation
   short. `forceMount` hands that control to AnimatePresence instead, so the
   open state has to be readable by the content subtree. */
const DialogOpenContext = createContext(false);

/**
 * Dialog root.
 *
 * Always drives the Radix primitive in controlled mode, mirroring the state
 * into context. Reading the `open` prop alone would leave uncontrolled
 * usage — the common `<DialogTrigger>` case — permanently closed, since
 * `open` is `undefined` there and the content is gated on it.
 */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isOpen = open ?? uncontrolled;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setUncontrolled(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
      <DialogOpenContext.Provider value={isOpen}>{children}</DialogOpenContext.Provider>
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  /** Hides the header text visually while keeping it for assistive tech.
   *  Radix requires a title regardless — a dialog without one is
   *  unnavigable by screen reader. */
  hideHeader?: boolean;
  showCloseButton?: boolean;
}

/**
 * Modal dialog.
 *
 * Radix handles the hard parts correctly: focus is trapped inside, restored
 * to the trigger on close, the page behind is inert, and Escape dismisses.
 * That is precisely why this wraps the primitive instead of reimplementing
 * it — hand-rolled modals nearly always leak focus.
 */
export function DialogContent({
  className,
  children,
  title,
  description,
  hideHeader = false,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const open = useContext(DialogOpenContext);

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
          </DialogPrimitive.Overlay>

          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg",
                "-translate-x-1/2 -translate-y-1/2",
                "rounded-xl border border-line bg-surface-overlay p-6 shadow-xl",
                // Long content scrolls inside the dialog rather than pushing
                // it off-screen on short viewports.
                "max-h-[calc(100dvh-4rem)] overflow-y-auto",
                className,
              )}
            >
              <div className={cn("flex flex-col gap-1.5", hideHeader && "sr-only")}>
                <DialogPrimitive.Title className="font-display text-h4 text-ink">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="text-body-sm text-ink-muted">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>

              {children && <div className={cn(!hideHeader && "mt-5")}>{children}</div>}

              {showCloseButton && (
                <DialogPrimitive.Close
                  aria-label="Close dialog"
                  className={cn(
                    "absolute top-4 right-4 grid size-8 cursor-pointer place-items-center",
                    "rounded-md text-ink-faint transition-colors duration-150",
                    "hover:bg-surface-raised hover:text-ink",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  )}
                >
                  <X className="size-4" aria-hidden="true" />
                </DialogPrimitive.Close>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
