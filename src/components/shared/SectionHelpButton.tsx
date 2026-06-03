import { useState } from "react";
import { CircleAlert, CircleHelp, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SectionHelpButtonProps {
  title: string;
  description: string;
  ariaLabel?: string;
  className?: string;
  /** `alert` shows an exclamation-style icon (default: question mark). */
  icon?: "help" | "alert";
}

const ICONS: Record<NonNullable<SectionHelpButtonProps["icon"]>, LucideIcon> = {
  help: CircleHelp,
  alert: CircleAlert,
};

export function SectionHelpButton({
  title,
  description,
  ariaLabel,
  className,
  icon = "help",
}: SectionHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[icon];

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel ?? title}
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 rounded-full p-1 text-muted-foreground/70 tap hover:bg-muted/60 hover:text-foreground transition-colors",
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="leading-relaxed whitespace-pre-line">
              {description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
