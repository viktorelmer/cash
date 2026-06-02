import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, useT } from "@/i18n";
import type { Language } from "@/types";

interface LanguageSelectorProps {
  value: Language;
  onValueChange: (value: Language) => void;
  className?: string;
}

export function LanguageSelector({
  value,
  onValueChange,
  className,
}: LanguageSelectorProps) {
  const t = useT();

  return (
    <div className={cn("relative inline-flex max-w-full", className)}>
      <Globe
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 z-10 h-3 w-3 -translate-y-1/2 text-muted-foreground"
      />
      <select
        value={value}
        aria-label={t("settings.language")}
        onChange={(e) => onValueChange(e.target.value as Language)}
        className={cn(
          "tap h-10 max-w-full cursor-pointer appearance-none rounded-md bg-transparent pl-8 pr-7 text-xs font-medium text-foreground",
          "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "touch-manipulation",
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
