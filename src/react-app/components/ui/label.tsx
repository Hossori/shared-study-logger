import * as React from "react";

import { cn } from "@/lib/utils";

function Label({
  className,
  onPointerDown,
  onMouseDown,
  onClick,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) event.preventDefault();
      }}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (!event.defaultPrevented) event.preventDefault();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) event.preventDefault();
      }}
    />
  );
}

export { Label };
