import { useMemo, useState } from "react";
import {
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";
import { ConvertedMoney } from "@/components/shared/ConvertedMoney";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { CategorySelector } from "@/components/shared/CategorySelector";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useCategoryMap, useSubscriptions } from "@/hooks/useData";
import { useSettings } from "@/stores/useSettings";
import {
  createSubscription,
  deleteSubscription,
  logSubscriptionPayment,
  toggleSubscriptionActive,
  updateSubscription,
} from "@/features/subscriptions/service";
import {
  advanceRecurring,
  isoDate,
  isoToTimestamp,
  monthlyCostOf,
} from "@/lib/date";
import {
  useFormatMoney,
  useShortDateLabel,
  useT,
} from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { sum, cn } from "@/lib/utils";
import type {
  Currency,
  RecurrenceFrequency,
  Subscription,
} from "@/types";
import { toast } from "sonner";

const FREQUENCIES: RecurrenceFrequency[] = [
  "monthly",
  "yearly",
  "quarterly",
  "weekly",
  "biweekly",
];

export function SubscriptionsPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const subs = useSubscriptions();
  const categoryMap = useCategoryMap();
  const currency = useSettings((s) => s.settings.currency);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const shortDateLabel = useShortDateLabel();
  const { convertToBase } = useConvertToBase();

  const stats = useMemo(() => {
    const active = subs.filter((s) => s.active);
    const monthly = sum(
      active.map((s) =>
        convertToBase(monthlyCostOf(s.amount, s.frequency), s.currency),
      ),
    );
    return {
      monthly,
      yearly: monthly * 12,
      activeCount: active.length,
      totalCount: subs.length,
    };
  }, [subs, convertToBase]);

  const detailDescription = editing
    ? t("subscriptions.next_short", {
        date: shortDateLabel(editing.nextPaymentDate),
      })
    : "";

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("subscriptions.title")}
        description={t("subscriptions.description")}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label={t("subscriptions.monthly")}
              value={formatMoney(stats.monthly, currency)}
            />
            <Stat
              label={t("subscriptions.yearly")}
              value={formatMoney(stats.yearly, currency)}
            />
            <Stat
              label={t("subscriptions.active")}
              value={`${stats.activeCount}/${stats.totalCount}`}
            />
          </div>
        </CardContent>
      </Card>

      {subs.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={t("subscriptions.empty_title")}
          description={t("subscriptions.empty_description")}
          action={
            <Button onClick={() => setCreating(true)}>
              {t("subscriptions.add_button")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <SubscriptionCard
              key={s.id}
              subscription={s}
              category={categoryMap.get(s.categoryId)}
              onClick={() => setEditing(s)}
            />
          ))}
        </div>
      )}

      <BottomSheet
        open={creating}
        onOpenChange={(o) => (o ? null : setCreating(false))}
        title={t("subscriptions.new_title")}
        maxHeight="90dvh"
      >
        <SubscriptionForm
          mode="create"
          defaultCurrency={currency}
          onSubmit={async (draft) => {
            await createSubscription(draft);
            toast.success(t("subscriptions.toast_added"));
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!editing}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        title={editing?.name}
        description={detailDescription}
        maxHeight="92dvh"
      >
        {editing && (
          <SubscriptionDetail
            sub={editing}
            onClose={() => setEditing(null)}
            onChanged={(s) => setEditing(s)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold num">{value}</div>
    </div>
  );
}

interface SubscriptionDraft {
  name: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  frequency: RecurrenceFrequency;
  nextPaymentDate: number;
  startDate: number;
  active: boolean;
  note: string;
  icon: string;
  color: string;
}

function SubscriptionForm({
  mode,
  initial,
  defaultCurrency,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: Subscription;
  defaultCurrency: Currency;
  onSubmit: (draft: SubscriptionDraft) => Promise<void> | void;
  onCancel: () => void;
}) {
  const t = useT();
  const categoryMap = useCategoryMap();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount.toString() ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initial?.frequency ?? "monthly",
  );
  const [nextPayment, setNextPayment] = useState(
    isoDate(initial?.nextPaymentDate ?? Date.now()),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? "cat_subs_streaming",
  );
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? defaultCurrency,
  );

  const canSubmit = name && Number(amount) > 0 && categoryId;
  const finalCategory = subcategoryId ?? categoryId;
  const catRecord = finalCategory ? categoryMap.get(finalCategory) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <Label>{t("subscriptions.label_name")}</Label>
          <Input
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("subscriptions.placeholder_name")}
          />
        </div>
        <div>
          <Label>{t("subscriptions.label_amount")}</Label>
          <Input
            className="mt-2 w-28"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("subscriptions.placeholder_amount")}
          />
        </div>
      </div>

      <div>
        <Label>{t("common.currency")}</Label>
        <div className="mt-2">
          <CurrencySelector value={currency} onValueChange={setCurrency} />
        </div>
      </div>

      <div>
        <Label>{t("subscriptions.label_frequency")}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium tap",
                frequency === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card",
              )}
            >
              {t(`subscriptions.frequencies.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("subscriptions.label_next_payment")}</Label>
          <Input
            className="mt-2"
            type="date"
            value={nextPayment}
            onChange={(e) => setNextPayment(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("subscriptions.label_note")}</Label>
          <Input
            className="mt-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("subscriptions.placeholder_note")}
          />
        </div>
      </div>

      <div>
        <Label>{t("common.category")}</Label>
        <div className="mt-2">
          <CategorySelector
            value={categoryId ? { categoryId, subcategoryId } : null}
            onChange={(v) => {
              setCategoryId(v.categoryId);
              setSubcategoryId(v.subcategoryId);
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              name,
              amount: Number(amount),
              currency,
              categoryId: finalCategory ?? "cat_other",
              frequency,
              nextPaymentDate: isoToTimestamp(nextPayment),
              startDate: initial?.startDate ?? Date.now(),
              active: initial?.active ?? true,
              note,
              icon: catRecord?.icon ?? "Repeat",
              color: catRecord?.color ?? "#71717A",
            })
          }
        >
          {mode === "create" ? t("common.add") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}

function SubscriptionDetail({
  sub,
  onClose,
  onChanged,
}: {
  sub: Subscription;
  onClose: () => void;
  onChanged: (next: Subscription) => void;
}) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const shortDateLabel = useShortDateLabel();
  const categoryName = useCategoryName();
  const categoryMap = useCategoryMap();
  const { convertToBase } = useConvertToBase();
  const cat = categoryMap.get(sub.categoryId) ?? null;
  const [editing, setEditing] = useState(false);
  const currency = useSettings((s) => s.settings.currency);

  if (editing) {
    return (
      <SubscriptionForm
        mode="edit"
        initial={sub}
        defaultCurrency={currency}
        onSubmit={async (draft) => {
          await updateSubscription(sub.id, draft);
          onChanged({ ...sub, ...draft });
          setEditing(false);
          toast.success(t("subscriptions.toast_updated"));
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${sub.color ?? "#71717A"}26`,
            color: sub.color ?? "#71717A",
          }}
        >
          <Icon name={sub.icon ?? "Repeat"} className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">
            {cat ? categoryName(cat) : t("subscriptions.title")}
          </div>
          <div className="text-2xl font-semibold">
            <ConvertedMoney
              amount={sub.amount}
              currency={sub.currency}
              className="text-left"
              amountClassName="text-2xl font-semibold"
              convertedClassName="text-xs"
            />
            <span className="text-sm font-normal text-muted-foreground">
              {" / "}
              {t(`subscriptions.frequencies.${sub.frequency}`)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-4">
        <Info
          label={t("subscriptions.next")}
          value={shortDateLabel(sub.nextPaymentDate)}
        />
        <Info
          label={t("subscriptions.following")}
          value={shortDateLabel(
            advanceRecurring(new Date(sub.nextPaymentDate), sub.frequency),
          )}
        />
        <Info
          label={t("subscriptions.monthly_cost")}
          value={formatMoney(
            monthlyCostOf(sub.amount, sub.frequency),
            sub.currency,
          )}
          hint={
            sub.currency !== currency
              ? `≈ ${formatMoney(
                  convertToBase(
                    monthlyCostOf(sub.amount, sub.frequency),
                    sub.currency,
                  ),
                  currency,
                )}`
              : undefined
          }
        />
        <Info
          label={t("subscriptions.status")}
          value={sub.active ? t("common.active") : t("common.paused")}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await toggleSubscriptionActive(sub.id);
            onChanged({ ...sub, active: !sub.active });
            toast(
              sub.active
                ? t("subscriptions.toast_paused")
                : t("subscriptions.toast_resumed"),
            );
          }}
        >
          {sub.active ? (
            <>
              <PauseCircle className="h-4 w-4" />
              {t("subscriptions.pause")}
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              {t("subscriptions.resume")}
            </>
          )}
        </Button>
        <Button
          variant="default"
          onClick={async () => {
            await logSubscriptionPayment(sub.id);
            const next = advanceRecurring(
              new Date(sub.nextPaymentDate),
              sub.frequency,
            ).getTime();
            onChanged({ ...sub, nextPaymentDate: next });
            toast.success(t("subscriptions.toast_payment_logged"));
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("subscriptions.mark_paid")}
        </Button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setEditing(true)}
        >
          {t("common.edit")}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={async () => {
            await deleteSubscription(sub.id);
            toast(t("subscriptions.toast_removed"));
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" />
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium num">{value}</div>
      {hint && (
        <div className="text-[10px] text-muted-foreground num">{hint}</div>
      )}
    </div>
  );
}
