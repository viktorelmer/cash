import { CategoryBadge } from "./CategoryBadge";
import { ConvertedMoney } from "./ConvertedMoney";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useShortDateLabel, useT } from "@/i18n";
import type { Category, Subscription } from "@/types";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  subscription: Subscription;
  category?: Category | null;
  onClick?: () => void;
  className?: string;
}

export function SubscriptionCard({
  subscription,
  category,
  onClick,
  className,
}: SubscriptionCardProps) {
  const t = useT();
  const shortDateLabel = useShortDateLabel();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left tap hover:shadow-pop transition-shadow",
        !subscription.active && "opacity-60",
        className,
      )}
    >
      {subscription.icon ? (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/[0.03]"
          style={{
            backgroundColor: `${subscription.color ?? "#71717A"}26`,
            color: subscription.color ?? "#71717A",
          }}
        >
          <Icon name={subscription.icon} className="h-5 w-5" />
        </div>
      ) : (
        <CategoryBadge category={category} size="md" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium text-sm truncate">
            {subscription.name}
          </div>
          <ConvertedMoney
            amount={subscription.amount}
            currency={subscription.currency}
            amountClassName="text-sm font-semibold"
          />
        </div>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t(`subscriptions.frequencies.${subscription.frequency}`)}
            </span>
            {!subscription.active && (
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] h-4"
              >
                {t("common.paused")}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {t("subscriptions.next_short", {
              date: shortDateLabel(subscription.nextPaymentDate),
            })}
          </div>
        </div>
      </div>
    </button>
  );
}
