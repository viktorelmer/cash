import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BottomSheet,
} from "@/components/ui/bottom-sheet";
import { ExpenseCard } from "@/components/shared/ExpenseCard";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import {
  useCategoryMap,
  useExpenses,
  useTopLevelCategories,
} from "@/hooks/useData";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useUi } from "@/stores/useUi";
import { useSettings } from "@/stores/useSettings";
import {
  useFormatDate,
  useFormatMoney,
  useSmartDateLabel,
  useT,
} from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { groupBy, sum, cn } from "@/lib/utils";
import { deleteExpense } from "@/features/expenses/service";
import type { Expense } from "@/types";
import { toast } from "sonner";

export function ExpensesPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const smartDateLabel = useSmartDateLabel();
  const categoryName = useCategoryName();
  const expenses = useExpenses();
  const categoryMap = useCategoryMap();
  const topCategories = useTopLevelCategories();
  const currency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const openAdd = useUi((s) => s.openAddExpense);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (activeCategory && e.categoryId !== activeCategory) return false;
      if (!q) return true;
      const cat = categoryMap.get(e.categoryId)?.name?.toLowerCase() ?? "";
      const sub = e.subcategoryId
        ? categoryMap.get(e.subcategoryId)?.name?.toLowerCase() ?? ""
        : "";
      return (
        e.note.toLowerCase().includes(q) ||
        cat.includes(q) ||
        sub.includes(q) ||
        e.tags.some((tagItem) => tagItem.toLowerCase().includes(q))
      );
    });
  }, [expenses, categoryMap, query, activeCategory]);

  const grouped = useMemo(() => {
    const byDay = groupBy(filtered, (e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime().toString();
    });
    return Object.entries(byDay)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([key, items]) => ({
        date: Number(key),
        items,
        total: sum(
          items.map((i) => convertToBase(i.amount, i.currency)),
        ),
      }));
  }, [filtered, convertToBase]);

  const totalSpent = useMemo(
    () => sum(filtered.map((e) => convertToBase(e.amount, e.currency))),
    [filtered, convertToBase],
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("expenses.title")}
        description={t("expenses.summary", {
          count: filtered.length,
          amount: formatMoney(totalSpent, currency),
        })}
        action={
          <Button onClick={() => openAdd()} size="sm">
            {t("common.add")}
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("expenses.search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <FilterChip
            label={t("expenses.filter_all")}
            active={!activeCategory}
            onClick={() => setActiveCategory(null)}
          />
          {topCategories.map((c) => (
            <FilterChip
              key={c.id}
              label={categoryName(c)}
              icon={c.icon}
              color={c.color}
              active={activeCategory === c.id}
              onClick={() =>
                setActiveCategory((cur) => (cur === c.id ? null : c.id))
              }
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={t("expenses.empty_title")}
          description={t("expenses.empty_description")}
          action={
            <Button onClick={() => openAdd()}>
              {t("common.add_expense")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {smartDateLabel(g.date)}
                </span>
                <span className="num text-xs text-muted-foreground">
                  {formatMoney(g.total, currency)}
                </span>
              </div>
              <Card>
                <CardContent className="p-2">
                  {g.items.map((e, i) => {
                    const cat = categoryMap.get(e.categoryId);
                    const sub = e.subcategoryId
                      ? categoryMap.get(e.subcategoryId)
                      : null;
                    return (
                      <div key={e.id}>
                        <ExpenseCard
                          expense={e}
                          category={cat}
                          subcategory={sub}
                          onClick={() => setDetail(e)}
                        />
                        {i < g.items.length - 1 && (
                          <Separator className="my-0.5" />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      <BottomSheet
        open={!!detail}
        onOpenChange={(o) => (o ? null : setDetail(null))}
        title={t("expenses.expense_details")}
      >
        {detail && (
          <ExpenseDetail
            expense={detail}
            onClose={() => setDetail(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tap",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {icon && (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-md"
          style={{
            color: active ? "#fff" : color ?? "#71717A",
          }}
        >
          <Icon name={icon} className="h-3 w-3" />
        </span>
      )}
      {label}
    </button>
  );
}

function ExpenseDetail({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const formatLocalized = useFormatDate();
  const categoryName = useCategoryName();
  const categoryMap = useCategoryMap();
  const cat = categoryMap.get(expense.categoryId) ?? null;
  const sub = expense.subcategoryId
    ? categoryMap.get(expense.subcategoryId) ?? null
    : null;

  const handleDelete = async () => {
    await deleteExpense(expense.id);
    toast(t("add_expense.toast_deleted"));
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <CategoryBadge category={sub ?? cat} size="lg" />
          <div>
            <div className="text-sm text-muted-foreground">
              {sub
                ? `${categoryName(cat)} · ${categoryName(sub)}`
                : categoryName(cat)}
            </div>
            <div className="text-2xl font-semibold tracking-tight num">
              −{formatMoney(expense.amount, expense.currency)}
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <Row
            label={t("expenses.row_label_date")}
            value={formatLocalized(new Date(expense.date), "EEEE, MMMM d, yyyy")}
          />
          <Row label={t("expenses.row_label_note")} value={expense.note || "—"} />
          {expense.tags.length > 0 && (
            <Row
              label={t("expenses.row_label_tags")}
              value={
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {expense.tags.map((tagItem) => (
                    <Badge key={tagItem} variant="outline">
                      #{tagItem}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          {t("expenses.delete_expense")}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );
}
