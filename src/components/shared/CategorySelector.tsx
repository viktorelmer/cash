import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useTopLevelCategories,
  useSubcategories,
  useCategoryMap,
} from "@/hooks/useData";
import { useT } from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import type { Category } from "@/types";

export interface CategorySelectorValue {
  categoryId: string;
  subcategoryId: string | null;
}

interface CategorySelectorProps {
  value: CategorySelectorValue | null;
  onChange: (value: CategorySelectorValue) => void;
  onCreateCategory?: () => void;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  onCreateCategory,
  className,
}: CategorySelectorProps) {
  const t = useT();
  const categoryName = useCategoryName();
  const topLevel = useTopLevelCategories();
  const categoryMap = useCategoryMap();
  const [drilledInto, setDrilledInto] = useState<string | null>(
    value?.subcategoryId ? value.categoryId : null,
  );
  const subcategories = useSubcategories(drilledInto);
  const [filter, setFilter] = useState("");

  const filteredTop = useMemo(() => {
    if (!filter) return topLevel;
    const q = filter.toLowerCase();
    return topLevel.filter((c) => categoryName(c).toLowerCase().includes(q));
  }, [topLevel, filter, categoryName]);

  const drilledCategory = drilledInto
    ? categoryMap.get(drilledInto) ?? null
    : null;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-3">
        {drilledInto ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDrilledInto(null)}
            aria-label={t("category_selector.back")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <Input
          placeholder={
            drilledInto
              ? t("category_selector.search_in", {
                  name: categoryName(drilledCategory),
                })
              : t("category_selector.search")
          }
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {drilledInto ? (
          <motion.div
            key="subs"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-3 gap-2"
          >
            <CategoryTile
              key="self"
              category={drilledCategory}
              label={t("category_selector.none")}
              active={
                value?.categoryId === drilledInto && !value?.subcategoryId
              }
              onClick={() =>
                onChange({ categoryId: drilledInto!, subcategoryId: null })
              }
            />
            {subcategories
              .filter((s) =>
                filter
                  ? categoryName(s).toLowerCase().includes(filter.toLowerCase())
                  : true,
              )
              .map((sub) => (
                <CategoryTile
                  key={sub.id}
                  category={sub}
                  active={value?.subcategoryId === sub.id}
                  onClick={() =>
                    onChange({
                      categoryId: drilledInto!,
                      subcategoryId: sub.id,
                    })
                  }
                />
              ))}
          </motion.div>
        ) : (
          <motion.div
            key="top"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-3 gap-2"
          >
            {filteredTop.map((cat) => (
              <CategoryTile
                key={cat.id}
                category={cat}
                active={value?.categoryId === cat.id && !value.subcategoryId}
                onClick={() => {
                  onChange({ categoryId: cat.id, subcategoryId: null });
                  setDrilledInto(cat.id);
                }}
              />
            ))}
            {onCreateCategory && (
              <button
                type="button"
                onClick={onCreateCategory}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-transparent p-3 text-muted-foreground hover:bg-secondary tap"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs">
                  {t("category_selector.new")}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryTile({
  category,
  label,
  active,
  onClick,
}: {
  category: Category | null;
  label?: string;
  active?: boolean;
  onClick: () => void;
}) {
  const categoryName = useCategoryName();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 tap transition-colors",
        active
          ? "border-foreground bg-foreground/[0.04]"
          : "border-border bg-card hover:bg-secondary/60",
      )}
    >
      <CategoryBadge category={category} size="md" />
      <span className="text-xs font-medium text-foreground truncate w-full text-center">
        {label ?? categoryName(category)}
      </span>
    </button>
  );
}
