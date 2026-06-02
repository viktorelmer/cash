import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { SubscriptionsPage } from "@/pages/SubscriptionsPage";
import { IncomePage } from "@/pages/IncomePage";
import { BudgetPage } from "@/pages/BudgetPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useT } from "@/i18n";

const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);

function PageFallback() {
  const t = useT();
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-muted-foreground animate-fade-in">
        {t("common.loading")}
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "expenses", element: <ExpensesPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "subscriptions", element: <SubscriptionsPage /> },
      {
        path: "analytics",
        element: (
          <Suspense fallback={<PageFallback />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      { path: "income", element: <IncomePage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
