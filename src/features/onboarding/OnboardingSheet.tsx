import { useState } from "react";
import { Wallet } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/shared/AmountInput";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { useSettings } from "@/stores/useSettings";
import { useT } from "@/i18n";

interface OnboardingSheetProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingSheet({ open, onComplete }: OnboardingSheetProps) {
  const t = useT();
  const settings = useSettings((s) => s.settings);
  const setStartingBalance = useSettings((s) => s.setStartingBalance);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const setCurrency = useSettings((s) => s.setCurrency);

  const [amount, setAmount] = useState("");

  const numericAmount = parseFloat(amount.replace(",", "."));
  const canContinue =
    amount !== "" && Number.isFinite(numericAmount) && numericAmount >= 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    await setStartingBalance(numericAmount);
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding();
    onComplete();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={() => {}}
      title={t("onboarding.title")}
      description={t("onboarding.description")}
      maxHeight="92dvh"
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <Wallet className="h-7 w-7" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("onboarding.hint")}
        </p>

        <div className="flex items-center justify-end">
          <CurrencySelector
            value={settings.currency}
            onValueChange={setCurrency}
          />
        </div>

        <div className="rounded-2xl bg-muted/40 px-4 py-6">
          <AmountInput
            value={amount}
            onValueChange={setAmount}
            currency={settings.currency}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button disabled={!canContinue} onClick={handleContinue}>
            {t("onboarding.continue")}
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            {t("onboarding.skip")}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
