import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Save, Tag } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AmountInput } from "@/components/shared/AmountInput";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { CategorySelector } from "@/components/shared/CategorySelector";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { Icon } from "@/components/ui/icon";
import { useUi } from "@/stores/useUi";
import { useSettings } from "@/stores/useSettings";
import { useCategoryMap, useExpenses, usePresets } from "@/hooks/useData";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { createExpense } from "./service";
import { createPreset } from "@/features/presets/service";
import { isoDate, isoToTimestamp } from "@/lib/date";
import { useFormatMoney, useT } from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Currency } from "@/types";

type Step = "amount" | "category";

export function AddExpenseSheet() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const categoryName = useCategoryName();
  const open = useUi((s) => s.addExpenseOpen);
  const payload = useUi((s) => s.addExpensePayload);
  const close = useUi((s) => s.closeAddExpense);
  const defaultCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();

  const presets = usePresets();
  const recentExpenses = useExpenses(8);
  const categoryMap = useCategoryMap();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState<string>(isoDate(new Date()));
  const [savePreset, setSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    if (open) {
      const preset = payload?.preset;
      setStep("amount");
      setAmount(preset ? String(preset.amount) : payload?.prefilledAmount?.toString() ?? "");
      setCurrency(preset?.currency ?? defaultCurrency);
      setCategoryId(preset?.categoryId ?? null);
      setSubcategoryId(preset?.subcategoryId ?? null);
      setNote(preset?.note ?? "");
      setTag("");
      setTags([]);
      setDate(isoDate(new Date()));
      setSavePreset(false);
      setPresetName(preset?.name ?? "");
    }
  }, [open, payload, defaultCurrency]);

  const recentCategoryIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of recentExpenses) {
      const key = e.subcategoryId ?? e.categoryId;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
      if (out.length >= 6) break;
    }
    return out;
  }, [recentExpenses]);

  const selectedCategory = categoryId ? categoryMap.get(categoryId) : null;
  const selectedSubcategory = subcategoryId
    ? categoryMap.get(subcategoryId)
    : null;

  const canSubmit =
    parseFloat(amount.replace(",", ".")) > 0 && !!categoryId;

  const convertedPreview = useMemo(() => {
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      currency === defaultCurrency
    ) {
      return null;
    }
    return convertToBase(numericAmount, currency);
  }, [amount, currency, defaultCurrency, convertToBase]);

  const addTag = () => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTag("");
  };

  const submit = async () => {
    if (!categoryId) return;
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    await createExpense({
      amount: numericAmount,
      currency,
      categoryId,
      subcategoryId,
      tags,
      note,
      date: isoToTimestamp(date),
      subscriptionId: null,
      presetId: payload?.preset?.id ?? null,
    });

    if (savePreset && presetName.trim()) {
      await createPreset({
        name: presetName.trim(),
        amount: numericAmount,
        currency,
        categoryId,
        subcategoryId,
        icon:
          selectedSubcategory?.icon ?? selectedCategory?.icon ?? "Tag",
        color: selectedSubcategory?.color ?? selectedCategory?.color,
        note,
      });
    }

    toast.success(t("add_expense.toast_added"), {
      description: `${formatMoney(numericAmount, currency)} · ${
        categoryName(selectedSubcategory ?? selectedCategory ?? null)
      }`,
      duration: 2000,
    });
    close();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? null : close())}
      title={t("add_expense.title")}
      description={t("add_expense.description")}
      maxHeight="92dvh"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-end">
          <CurrencySelector value={currency} onValueChange={setCurrency} />
        </div>

        <div className="rounded-2xl bg-muted/40 px-4 py-6">
          <AmountInput
            value={amount}
            onValueChange={setAmount}
            currency={currency}
            autoFocus
          />
          {convertedPreview !== null && (
            <p className="mt-3 text-center text-sm text-muted-foreground num">
              {t("add_expense.converted_hint", {
                amount: formatMoney(convertedPreview, defaultCurrency),
              })}
            </p>
          )}
        </div>

        {step === "amount" && (
          <>
            {presets.length > 0 && (
              <Section title={t("add_expense.quick_presets")}>
                <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 snap-x">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAmount(String(p.amount));
                        setCurrency(p.currency);
                        setCategoryId(p.categoryId);
                        setSubcategoryId(p.subcategoryId);
                        setNote(p.note);
                      }}
                      className="snap-start group flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 tap hover:bg-secondary/60"
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${p.color ?? "#71717A"}26`,
                          color: p.color ?? "#71717A",
                        }}
                      >
                        <Icon name={p.icon} className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground num">
                        {formatMoney(p.amount, p.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {recentCategoryIds.length > 0 && (
              <Section title={t("add_expense.recent")}>
                <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                  {recentCategoryIds.map((id) => {
                    const c = categoryMap.get(id);
                    if (!c) return null;
                    const active =
                      categoryId === c.id || subcategoryId === c.id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          if (c.parentId) {
                            setCategoryId(c.parentId);
                            setSubcategoryId(c.id);
                          } else {
                            setCategoryId(c.id);
                            setSubcategoryId(null);
                          }
                        }}
                        className={cn(
                          "shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tap",
                          active
                            ? "border-foreground bg-foreground/[0.06]"
                            : "border-border bg-card hover:bg-secondary/60",
                        )}
                      >
                        <CategoryBadge category={c} size="sm" />
                        {categoryName(c)}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            <Section title={t("common.category")}>
              <button
                type="button"
                onClick={() => setStep("category")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3 text-left tap hover:bg-secondary/40",
                  !selectedCategory && "text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <CategoryBadge
                    category={selectedSubcategory ?? selectedCategory}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {selectedSubcategory
                        ? categoryName(selectedSubcategory)
                        : selectedCategory
                        ? categoryName(selectedCategory)
                        : t("add_expense.pick_category")}
                    </span>
                    {selectedSubcategory && selectedCategory && (
                      <span className="text-xs text-muted-foreground">
                        {categoryName(selectedCategory)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("common.change")}
                </span>
              </button>
            </Section>

            <Section title={t("add_expense.details")} className="space-y-3">
              <Input
                placeholder={t("common.note_optional")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t("common.add_tag")}
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addTag}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {t("common.add")}
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tagItem) => (
                      <button
                        key={tagItem}
                        type="button"
                        onClick={() =>
                          setTags((prev) => prev.filter((x) => x !== tagItem))
                        }
                        className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground hover:bg-subtle tap"
                      >
                        #{tagItem} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section
              title={t("add_expense.save_as_preset")}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={savePreset ? "default" : "outline"}
                  onClick={() => {
                    setSavePreset((v) => !v);
                    if (!savePreset && !presetName) {
                      setPresetName(
                        selectedSubcategory
                          ? categoryName(selectedSubcategory)
                          : selectedCategory
                          ? categoryName(selectedCategory)
                          : "",
                      );
                    }
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savePreset
                    ? t("add_expense.will_save")
                    : t("add_expense.save_preset")}
                </Button>
                {savePreset && (
                  <Input
                    placeholder={t("add_expense.preset_name")}
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                )}
              </div>
            </Section>
          </>
        )}

        {step === "category" && (
          <Section title={t("add_expense.choose_category")}>
            <CategorySelector
              value={
                categoryId
                  ? { categoryId, subcategoryId: subcategoryId }
                  : null
              }
              onChange={(v) => {
                setCategoryId(v.categoryId);
                setSubcategoryId(v.subcategoryId);
              }}
            />
            <Separator className="my-4" />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setStep("amount")}
            >
              {t("common.done")}
            </Button>
          </Section>
        )}

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="sticky bottom-0 -mx-5 -mb-4 bg-elevated px-5 py-3 border-t border-border"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={close}
              type="button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={!canSubmit}
              onClick={submit}
            >
              <Check className="h-4 w-4" />
              {t("add_expense.add_button")}
            </Button>
          </div>
        </motion.div>
      </div>
    </BottomSheet>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{title}</Label>
      {children}
    </div>
  );
}
