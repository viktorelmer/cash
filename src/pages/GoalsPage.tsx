import { useMemo, useState } from "react";
import { Banknote, Plus, Trash2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { GoalCard } from "@/components/shared/GoalCard";
import { ConvertedMoney } from "@/components/shared/ConvertedMoney";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { useGoals } from "@/hooks/useData";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useSettings } from "@/stores/useSettings";
import {
  contributeToGoal,
  createGoal,
  deleteGoal,
  forecastGoal,
  updateGoal,
} from "@/features/goals/service";
import { useFormatMoney, useT } from "@/i18n";
import { isoDate, isoToTimestamp } from "@/lib/date";
import type { Currency, Goal, GoalKind } from "@/types";
import { toast } from "sonner";
import { cn, sum } from "@/lib/utils";

const KIND_TEMPLATES: Array<{
  kind: GoalKind;
  defaultName: string;
  icon: string;
  color: string;
}> = [
  {
    kind: "house",
    defaultName: "House",
    icon: "Home",
    color: "#10B981",
  },
  {
    kind: "renovation",
    defaultName: "Renovation",
    icon: "Hammer",
    color: "#8B5CF6",
  },
  {
    kind: "furniture",
    defaultName: "Furniture",
    icon: "Sofa",
    color: "#F59E0B",
  },
  {
    kind: "emergency",
    defaultName: "Emergency",
    icon: "ShieldCheck",
    color: "#0EA5E9",
  },
  { kind: "car", defaultName: "Car", icon: "CarFront", color: "#3B82F6" },
  { kind: "travel", defaultName: "Travel", icon: "Plane", color: "#EC4899" },
  { kind: "custom", defaultName: "Custom", icon: "Star", color: "#71717A" },
];

export function GoalsPage() {
  const t = useT();
  const formatMoney = useFormatMoney();
  const goals = useGoals();
  const currency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<Goal | null>(null);

  const totalTarget = sum(
    goals.map((g) => convertToBase(g.targetAmount, g.currency)),
  );
  const totalSaved = sum(
    goals.map((g) => convertToBase(g.savedAmount, g.currency)),
  );
  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  const detailDescription = useMemo(() => {
    if (!active) return undefined;
    return t("goals.of_target", {
      amount: `${formatMoney(active.savedAmount, active.currency)} / ${formatMoney(active.targetAmount, active.currency)}`,
    });
  }, [active, formatMoney, t]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("goals.title")}
        description={t("goals.description")}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("goals.total_saved")}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("goals.percent_of_goals", {
                percent: Math.round(overallProgress * 100),
              })}
            </span>
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight num">
            {formatMoney(totalSaved, currency)}
            <span className="text-muted-foreground text-base font-normal">
              {" / "}
              {formatMoney(totalTarget, currency)}
            </span>
          </div>
          <Progress
            value={overallProgress * 100}
            indicatorClassName="bg-foreground"
            className="mt-4 h-1.5"
          />
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={t("goals.empty_title")}
          description={t("goals.empty_description")}
          action={
            <Button onClick={() => setCreating(true)}>
              {t("goals.create_button")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onClick={() => setActive(g)} />
          ))}
        </div>
      )}

      <BottomSheet
        open={creating}
        onOpenChange={(o) => (o ? null : setCreating(false))}
        title={t("goals.new_title")}
        description={t("goals.new_description")}
        maxHeight="90dvh"
      >
        <GoalForm
          mode="create"
          defaultCurrency={currency}
          onSubmit={async (draft) => {
            await createGoal(draft);
            toast.success(t("goals.toast_created"));
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!active}
        onOpenChange={(o) => (o ? null : setActive(null))}
        title={active?.name}
        description={detailDescription}
        maxHeight="92dvh"
      >
        {active && (
          <GoalDetail
            goal={active}
            onClose={() => setActive(null)}
            onChanged={(next) => setActive(next)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

interface GoalFormDraft {
  name: string;
  kind: GoalKind;
  targetAmount: number;
  savedAmount: number;
  currency: Currency;
  deadline: number | null;
  monthlyContribution: number | null;
  icon: string;
  color: string;
  note: string;
}

function GoalForm({
  mode,
  initial,
  defaultCurrency,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: Goal;
  defaultCurrency: Currency;
  onSubmit: (draft: GoalFormDraft) => Promise<void> | void;
  onCancel: () => void;
}) {
  const t = useT();
  const [kind, setKind] = useState<GoalKind>(initial?.kind ?? "house");
  const tpl =
    KIND_TEMPLATES.find((tplItem) => tplItem.kind === kind) ??
    KIND_TEMPLATES[0];
  const localizedKindName = (k: GoalKind) => t(`goals.types.${k}`);
  const [name, setName] = useState(
    initial?.name ?? localizedKindName(kind),
  );
  const [target, setTarget] = useState(
    initial?.targetAmount?.toString() ?? "",
  );
  const [saved, setSaved] = useState(initial?.savedAmount?.toString() ?? "");
  const [deadline, setDeadline] = useState(
    initial?.deadline ? isoDate(initial.deadline) : "",
  );
  const [monthly, setMonthly] = useState(
    initial?.monthlyContribution?.toString() ?? "",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? defaultCurrency,
  );

  const canSubmit = name && parseFloat(target) > 0;

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("goals.label_type")}</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {KIND_TEMPLATES.map((tpl) => (
            <button
              key={tpl.kind}
              type="button"
              onClick={() => {
                setKind(tpl.kind);
                if (!initial) setName(localizedKindName(tpl.kind));
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 tap",
                kind === tpl.kind
                  ? "border-foreground bg-foreground/[0.04]"
                  : "border-border bg-card hover:bg-secondary/50",
              )}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${tpl.color}26`,
                  color: tpl.color,
                }}
              >
                <Icon name={tpl.icon} className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium">
                {localizedKindName(tpl.kind)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t("goals.label_name")}</Label>
        <Input
          className="mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("goals.placeholder_name")}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <Label>{t("goals.label_target")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={t("goals.placeholder_target")}
          />
        </div>
        <div>
          <Label>{t("common.currency")}</Label>
          <div className="mt-2">
            <CurrencySelector value={currency} onValueChange={setCurrency} />
          </div>
        </div>
      </div>

      <div>
        <Label>{t("goals.label_already_saved")}</Label>
        <Input
          className="mt-2"
          type="number"
          inputMode="decimal"
          value={saved}
          onChange={(e) => setSaved(e.target.value)}
          placeholder={t("goals.placeholder_saved")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("goals.label_deadline")}</Label>
          <Input
            className="mt-2"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("goals.label_monthly")}</Label>
          <Input
            className="mt-2"
            type="number"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder={t("goals.placeholder_monthly")}
          />
        </div>
      </div>

      <div>
        <Label>{t("goals.label_note")}</Label>
        <Textarea
          className="mt-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("goals.placeholder_note")}
        />
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
              kind,
              targetAmount: Number(target),
              savedAmount: Number(saved || 0),
              currency,
              deadline: deadline ? isoToTimestamp(deadline) : null,
              monthlyContribution: monthly ? Number(monthly) : null,
              icon: tpl.icon,
              color: tpl.color,
              note,
            })
          }
        >
          {mode === "create" ? t("common.create") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}

function GoalDetail({
  goal,
  onClose,
  onChanged,
}: {
  goal: Goal;
  onClose: () => void;
  onChanged: (next: Goal) => void;
}) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const defaultCurrency = useSettings((s) => s.settings.currency);
  const { convertToBase } = useConvertToBase();
  const [contribution, setContribution] = useState("");
  const [editing, setEditing] = useState(false);
  const forecast = forecastGoal(goal);

  if (editing) {
    return (
      <GoalForm
        mode="edit"
        initial={goal}
        defaultCurrency={defaultCurrency}
        onSubmit={async (draft) => {
          await updateGoal(goal.id, draft);
          toast.success(t("goals.toast_updated"));
          onChanged({ ...goal, ...draft });
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const handleContribute = async (amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    await contributeToGoal(goal.id, amount);
    onChanged({ ...goal, savedAmount: Math.max(0, goal.savedAmount + amount) });
    setContribution("");
    toast.success(
      amount > 0
        ? t("goals.toast_contribution_added")
        : t("goals.toast_contribution_removed"),
    );
  };

  let etaLabel: string | null = null;
  if (forecast.etaKind === "deadline" && forecast.monthsRemaining !== null) {
    etaLabel = t("goals.months_left", { count: forecast.monthsRemaining });
  } else if (
    forecast.etaKind === "by_monthly" &&
    forecast.monthsRemaining !== null
  ) {
    etaLabel = t("goals.months_to_finish", {
      count: forecast.monthsRemaining,
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-muted/40 p-4">
        <ConvertedMoney
          amount={goal.savedAmount}
          currency={goal.currency}
          className="text-left"
          amountClassName="text-3xl font-semibold"
          convertedClassName="text-xs"
        />
        <div className="mt-1 text-xs text-muted-foreground">
          {t("goals.of_target", {
            amount: formatMoney(goal.targetAmount, goal.currency),
          })}
          {goal.currency !== defaultCurrency && (
            <span className="num">
              {" "}
              (≈ {formatMoney(convertToBase(goal.targetAmount, goal.currency), defaultCurrency)})
            </span>
          )}
        </div>
        <Progress
          value={forecast.progress * 100}
          indicatorClassName="bg-foreground"
          className="mt-3 h-2"
        />
        {etaLabel && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {etaLabel}
            {forecast.monthlyRequired !== null && (
              <span>
                ·{" "}
                {t("goals.monthly_required", {
                  amount: formatMoney(
                    Math.round(forecast.monthlyRequired),
                    goal.currency,
                  ),
                })}
                {goal.currency !== defaultCurrency && (
                  <span className="num">
                    {" "}
                    (≈{" "}
                    {formatMoney(
                      convertToBase(
                        Math.round(forecast.monthlyRequired),
                        goal.currency,
                      ),
                      defaultCurrency,
                    )}
                    )
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("goals.quick_contribute")}</Label>
        <div className="flex flex-wrap gap-2">
          {[50, 100, 250, 500].map((amt) => (
            <Button
              key={amt}
              variant="outline"
              size="sm"
              onClick={() => handleContribute(amt)}
            >
              +{formatMoney(amt, goal.currency)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("goals.custom_amount")}
            type="number"
            inputMode="decimal"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
          />
          <Button
            onClick={() => handleContribute(Number(contribution))}
            disabled={!parseFloat(contribution)}
          >
            {t("common.add")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleContribute(-Math.abs(Number(contribution)))}
            disabled={!parseFloat(contribution)}
          >
            −
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
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
            await deleteGoal(goal.id);
            toast(t("goals.toast_deleted"));
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
