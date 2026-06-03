import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { incomeGross, incomeTaxAmount } from "@/features/income/amounts";
import { sum } from "@/lib/utils";
import { useConvertToBase } from "@/hooks/useConvertToBase";
import { useMonthExpenses, useMonthIncomes } from "@/hooks/useData";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useSettings } from "@/stores/useSettings";
import { useFormatMoney, useMonthLabel, useT } from "@/i18n";

interface MonthlySummaryProps {
  month?: Date;
  className?: string;
}

export function MonthlySummary({
  month = new Date(),
  className,
}: MonthlySummaryProps) {
  const t = useT();
  const formatMoney = useFormatMoney();
  const monthLabel = useMonthLabel();
  const currency = useSettings((s) => s.settings.currency);
  const expenses = useMonthExpenses(month);
  const incomes = useMonthIncomes(month);
  const walletBalance = useWalletBalance();
  const { convertToBase } = useConvertToBase();

  const stats = useMemo(() => {
    const gross = sum(
      incomes.map((i) => convertToBase(incomeGross(i), i.currency)),
    );
    const tax = sum(
      incomes.map((i) => convertToBase(incomeTaxAmount(i), i.currency)),
    );
    const net = gross - tax;
    const spent = sum(
      expenses.map((e) => convertToBase(e.amount, e.currency)),
    );
    const monthBalance = net - spent;
    return { gross, tax, net, spent, monthBalance };
  }, [incomes, expenses, convertToBase]);

  const headline =
    walletBalance !== null ? walletBalance : stats.monthBalance;
  const headlineLabel =
    walletBalance !== null
      ? t("wallet.on_hand")
      : t("monthly.remaining");

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {monthLabel(month)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {walletBalance !== null
              ? t("wallet.baseline_active")
              : t("monthly.net_after_tax")}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-3xl font-bold tracking-tight num">
            {formatMoney(headline, currency)}
          </div>
          <div className="text-xs text-muted-foreground">{headlineLabel}</div>
        </div>
        {walletBalance !== null && (
          <div className="mt-1 text-xs text-muted-foreground num">
            {t("wallet.month_flow", {
              amount: formatMoney(stats.monthBalance, currency),
            })}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Row
            icon={
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            }
            label={t("monthly.income_net")}
            value={formatMoney(stats.net, currency)}
          />
          <Row
            icon={
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            }
            label={t("monthly.spent")}
            value={formatMoney(stats.spent, currency)}
          />
          {stats.tax > 0 && (
            <Row
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Wallet className="h-4 w-4" />
                </div>
              }
              label={t("monthly.tax_reserved")}
              value={formatMoney(stats.tax, currency)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="num text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
