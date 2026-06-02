import { endOfMonth, startOfMonth } from "@/lib/date";
import { sum } from "@/lib/utils";
import type { Expense, Subscription } from "@/types";
import type { ToBaseCurrency } from "@/features/analytics/computations";

/** Active subscriptions with a payment date still in the current month. */
export function upcomingSubscriptionsTotal(
  subs: Subscription[],
  toBase: ToBaseCurrency,
  reference = new Date(),
): number {
  const monthStart = startOfMonth(reference).getTime();
  const monthEnd = endOfMonth(reference).getTime();

  return sum(
    subs
      .filter((s) => s.active)
      .filter(
        (s) =>
          s.nextPaymentDate >= monthStart && s.nextPaymentDate <= monthEnd,
      )
      .map((s) => toBase(s.amount, s.currency)),
  );
}

/**
 * Estimated spending by month end:
 * - everything already logged this month
 * - subscription payments still due this month (not yet marked paid)
 * - linear extrapolation of non-subscription spending only
 */
export function computeMonthEndForecast(
  monthExpenses: Expense[],
  activeSubs: Subscription[],
  toBase: ToBaseCurrency,
  reference = new Date(),
): number {
  const monthStart = startOfMonth(reference).getTime();
  const monthEnd = endOfMonth(reference).getTime();
  const dayOfMonth = Math.max(
    1,
    Math.ceil((reference.getTime() - monthStart) / 86400000),
  );
  const totalDays = Math.ceil((monthEnd - monthStart) / 86400000);

  const spent = sum(monthExpenses.map((e) => toBase(e.amount, e.currency)));

  const variableSpent = sum(
    monthExpenses
      .filter((e) => !e.subscriptionId)
      .map((e) => toBase(e.amount, e.currency)),
  );

  const variableExtra =
    variableSpent > 0
      ? Math.max(0, (variableSpent / dayOfMonth) * totalDays - variableSpent)
      : 0;

  const upcoming = upcomingSubscriptionsTotal(activeSubs, toBase, reference);

  return spent + upcoming + variableExtra;
}
