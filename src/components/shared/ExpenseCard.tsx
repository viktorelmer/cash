import { CategoryBadge } from "./CategoryBadge";
import { useCategoryName } from "@/i18n/categories";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useFormatMoney, useT } from "@/i18n";
import { useSettings } from "@/stores/useSettings";
import { timeLabel } from "@/lib/date";
import type { Category, Expense } from "@/types";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: Expense;
  category?: Category | null;
  subcategory?: Category | null;
  onClick?: () => void;
  className?: string;
}

export function ExpenseCard({
  expense,
  category,
  subcategory,
  onClick,
  className,
}: ExpenseCardProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const categoryName = useCategoryName();
  const baseCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const showConverted = expense.currency !== baseCurrency;
  const converted = showConverted
    ? convertToBase(expense.amount, expense.currency)
    : null;
  const title = subcategory
    ? categoryName(subcategory)
    : category
    ? categoryName(category)
    : t("category.uncategorized");
  const subtitle =
    expense.note ||
    (subcategory && category ? categoryName(category) : null) ||
    timeLabel(expense.date);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left tap hover:bg-secondary/60 transition-colors",
        className,
      )}
    >
      <CategoryBadge category={subcategory ?? category} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
          <div className="text-right">
            <span className="num text-sm font-semibold tabular-nums">
              −{formatMoney(expense.amount, expense.currency)}
            </span>
            {converted !== null && (
              <div className="text-[10px] text-muted-foreground num">
                ≈ {formatMoney(converted, baseCurrency)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {timeLabel(expense.date)}
          </span>
        </div>
      </div>
    </button>
  );
}
