import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import type { Currency } from "@/types";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "EUR", label: "EUR · €" },
  { value: "USD", label: "USD · $" },
  { value: "GBP", label: "GBP · £" },
  { value: "PLN", label: "PLN · zł" },
  { value: "CHF", label: "CHF" },
  { value: "SEK", label: "SEK · kr" },
  { value: "NOK", label: "NOK · kr" },
  { value: "BYN", label: "BYN · Б" },
];

interface CurrencySelectorProps {
  value: Currency;
  onValueChange: (value: Currency) => void;
  className?: string;
}

export function CurrencySelector({
  value,
  onValueChange,
  className,
}: CurrencySelectorProps) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("text-xs font-medium", className)}
        >
          {value}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("common.currency")}</DropdownMenuLabel>
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.value}
            onClick={() => onValueChange(c.value)}
          >
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
