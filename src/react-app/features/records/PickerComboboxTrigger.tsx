/**
 * コンボボックス風の開閉トリガー（日付・時刻・学習時間ピッカー共通）。
 */
import { ChevronDownIcon, type LucideIcon } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PickerComboboxTriggerProps extends Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children"
> {
  id: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: string;
  icon?: LucideIcon;
  "aria-label": string;
  "aria-controls": string;
  "aria-haspopup"?: "listbox" | "dialog";
}

const PickerComboboxTrigger = forwardRef<
  HTMLButtonElement,
  PickerComboboxTriggerProps
>(function PickerComboboxTrigger(
  {
    id,
    open,
    onOpenChange,
    children,
    icon: Icon = ChevronDownIcon,
    className,
    "aria-label": ariaLabel,
    "aria-controls": ariaControls,
    "aria-haspopup": ariaHasPopup,
    onClick,
    ...rest
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      type="button"
      id={id}
      variant="outline"
      aria-expanded={open}
      aria-haspopup={ariaHasPopup}
      aria-controls={open ? ariaControls : undefined}
      aria-label={`${ariaLabel} ${children}`}
      onClick={(event) => {
        onClick?.(event);
        if (onOpenChange) {
          onOpenChange(!open);
        }
      }}
      className={cn("w-full justify-between py-1 font-normal", className)}
      {...rest}
    >
      <span className="tabular-nums">{children}</span>
      <Icon
        data-icon="inline-end"
        className={cn(open && Icon === ChevronDownIcon && "rotate-180")}
      />
    </Button>
  );
});

export default PickerComboboxTrigger;
