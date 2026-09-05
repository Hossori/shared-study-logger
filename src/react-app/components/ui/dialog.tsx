"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useVisualViewportFrame } from "@/components/useVisualViewportFrame";
import { XIcon } from "lucide-react";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fill-mode-forwards fixed inset-0 isolate z-50 bg-black/10 duration-200 supports-backdrop-filter:backdrop-blur-xs sm:duration-100",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  container,
  overlay,
  onFocusCapture,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  container?: DialogPrimitive.Portal.Props["container"];
  overlay?: DialogPrimitive.Backdrop.Props;
}) {
  const setViewportRef = useVisualViewportFrame();

  const handleFocusCapture: NonNullable<
    DialogPrimitive.Popup.Props["onFocusCapture"]
  > = (event) => {
    onFocusCapture?.(event);
    if (event.defaultPrevented) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    target.scrollIntoView({ block: "nearest" });
  };

  return (
    <DialogPortal container={container}>
      <DialogOverlay {...overlay} />
      <DialogPrimitive.Viewport
        ref={setViewportRef}
        data-slot="dialog-viewport"
        className="pointer-events-none fixed z-50 max-sm:inset-auto max-sm:top-[var(--vv-top,0px)] max-sm:left-[var(--vv-left,0px)] max-sm:h-[var(--vv-height,100dvh)] max-sm:w-[var(--vv-width,100%)] sm:inset-0"
      >
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fill-mode-forwards pointer-events-auto grid w-full min-w-0 gap-4 overflow-x-hidden overflow-y-auto p-4 pb-[max(1rem,calc(var(--safe-area-inset-bottom)-var(--keyboard-inset,0px)))] text-sm outline-none *:min-w-0",
            "max-sm:data-open:slide-in-from-bottom max-sm:data-closed:slide-out-to-bottom inset-x-0 bottom-0 rounded-t-2xl rounded-b-none shadow-lg duration-200 max-sm:absolute max-sm:max-h-[calc(100%-1rem-var(--safe-area-inset-top))]",
            "sm:data-open:zoom-in-95 sm:data-closed:zoom-out-95 sm:fixed sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-2rem-var(--safe-area-inset-top)-var(--safe-area-inset-bottom))] sm:max-w-[min(24rem,calc(100%-2rem-var(--safe-area-inset-left)-var(--safe-area-inset-right)))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:shadow-none sm:ring-1 sm:duration-100",
            className,
          )}
          {...props}
          onFocusCapture={handleFocusCapture}
        >
          <div
            aria-hidden
            data-slot="dialog-handle"
            className="bg-muted-foreground/40 absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full sm:hidden"
          />
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              render={
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2"
                  size="icon-sm"
                />
              }
            >
              <XIcon />
              <span className="sr-only">閉じる</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogButtonArea({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-button-area"
      className={cn(
        "-mx-4 -mb-4 flex flex-row gap-2 rounded-b-xl p-4",
        "max-sm:-mb-[max(1rem,calc(var(--safe-area-inset-bottom)-var(--keyboard-inset,0px)))] max-sm:rounded-none max-sm:pb-[max(1rem,calc(var(--safe-area-inset-bottom)-var(--keyboard-inset,0px)))]",
        "*:data-[slot=button]:min-w-0 *:data-[slot=button]:flex-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogButtonArea,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
