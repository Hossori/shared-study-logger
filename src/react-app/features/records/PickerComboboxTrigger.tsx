/**
 * コンボボックス風の開閉トリガー（時刻・学習時間ピッカー共通）。
 */
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PickerComboboxTriggerProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: string;
  className?: string;
  "aria-label": string;
  "aria-controls": string;
  "aria-haspopup"?: "listbox" | "dialog";
}

export default function PickerComboboxTrigger({
  id,
  open,
  onOpenChange,
  children,
  className,
  "aria-label": ariaLabel,
  "aria-controls": ariaControls,
  "aria-haspopup": ariaHasPopup,
}: PickerComboboxTriggerProps) {
  return (
    <Button
      type="button"
      id={id}
      variant="outline"
      aria-expanded={open}
      aria-haspopup={ariaHasPopup}
      aria-controls={open ? ariaControls : undefined}
      aria-label={`${ariaLabel} ${children}`}
      onClick={() => onOpenChange(!open)}
      className={cn("w-full justify-between font-normal", className)}
    >
      <span className="tabular-nums">{children}</span>
      <ChevronDownIcon
        data-icon="inline-end"
        className={cn(open && "rotate-180")}
      />
    </Button>
  );
}
