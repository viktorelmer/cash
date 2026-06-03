import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./router";
import { seedDatabaseIfEmpty } from "@/lib/db";
import { DisclaimerSheet } from "@/features/onboarding/DisclaimerSheet";
import { useSettings } from "@/stores/useSettings";
import { useApplyTheme } from "@/hooks/useTheme";
import { useT } from "@/i18n";
import { Wallet } from "lucide-react";

export function App() {
  const [ready, setReady] = useState(false);
  const hydrate = useSettings((s) => s.hydrate);
  const disclaimerAcceptedAt = useSettings(
    (s) => s.settings.disclaimerAcceptedAt,
  );
  const refreshExchangeRatesIfStale = useSettings(
    (s) => s.refreshExchangeRatesIfStale,
  );
  useApplyTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await seedDatabaseIfEmpty();
      await hydrate();
      if (!cancelled) {
        void refreshExchangeRatesIfStale();
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate, refreshExchangeRatesIfStale]);

  if (!ready) return <Splash />;

  if (!disclaimerAcceptedAt) {
    return (
      <>
        <div className="min-h-dvh bg-background">
          <DisclaimerSheet open onAccepted={() => {}} />
        </div>
        <Toaster
          theme="system"
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "rounded-2xl border border-border shadow-pop bg-elevated text-foreground",
              title: "text-sm font-medium",
              description: "text-xs text-muted-foreground",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme="system"
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl border border-border shadow-pop bg-elevated text-foreground",
            title: "text-sm font-medium",
            description: "text-xs text-muted-foreground",
          },
        }}
      />
    </>
  );
}

function Splash() {
  const t = useT();
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">
          {t("app.loading")}
        </div>
      </div>
    </div>
  );
}
