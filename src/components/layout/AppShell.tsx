import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Home,
  PiggyBank,
  Receipt,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingAddButton } from "@/components/shared/FloatingAddButton";
import { AddExpenseSheet } from "@/features/expenses/AddExpenseSheet";
import { OnboardingSheet } from "@/features/onboarding/OnboardingSheet";
import { DisclaimerSheet } from "@/features/onboarding/DisclaimerSheet";
import { useSettings } from "@/stores/useSettings";
import { useT } from "@/i18n";
import { TopBar } from "./TopBar";

export function AppShell() {
  const t = useT();
  const disclaimerAcceptedAt = useSettings(
    (s) => s.settings.disclaimerAcceptedAt,
  );
  const onboardingCompletedAt = useSettings(
    (s) => s.settings.onboardingCompletedAt,
  );
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setShowDisclaimer(!disclaimerAcceptedAt);
    setShowOnboarding(!!disclaimerAcceptedAt && !onboardingCompletedAt);
  }, [disclaimerAcceptedAt, onboardingCompletedAt]);
  const tabs = [
    { to: "/", label: t("nav.home"), icon: Home, end: true },
    { to: "/expenses", label: t("nav.expenses"), icon: Receipt, end: false },
    { to: "/goals", label: t("nav.goals"), icon: PiggyBank, end: false },
    {
      to: "/subscriptions",
      label: t("nav.subscriptions"),
      icon: Repeat,
      end: false,
    },
    {
      to: "/analytics",
      label: t("nav.insights"),
      icon: BarChart3,
      end: false,
    },
  ];
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pb-32 pt-2 sm:pt-4">
        <Outlet />
      </main>

      <FloatingAddButton />
      <AddExpenseSheet />
      <DisclaimerSheet
        open={showDisclaimer}
        onAccepted={() => {
          setShowDisclaimer(false);
          if (!onboardingCompletedAt) setShowOnboarding(true);
        }}
      />
      <OnboardingSheet
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border glass pb-safe",
        )}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium tap transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-xl px-3 py-1 transition-colors",
                      isActive && "bg-secondary",
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                  </span>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
