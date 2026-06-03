import { Link, useLocation } from "react-router-dom";
import { Cog, Moon, Sun, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/stores/useSettings";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const titleKeyMap: Record<string, string> = {
  "/": "topbar.titles.home",
  "/expenses": "topbar.titles.expenses",
  "/goals": "topbar.titles.goals",
  "/subscriptions": "topbar.titles.subscriptions",
  "/analytics": "topbar.titles.analytics",
  "/basics": "topbar.titles.basics",
  "/income": "topbar.titles.income",
  "/budget": "topbar.titles.budget",
  "/categories": "topbar.titles.categories",
  "/settings": "topbar.titles.settings",
};

export function TopBar() {
  const { pathname } = useLocation();
  const t = useT();
  const titleKey = titleKeyMap[pathname] ?? "topbar.titles.home";
  const title = t(titleKey);
  const settings = useSettings((s) => s.settings);
  const setTheme = useSettings((s) => s.setTheme);
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border glass safe-top",
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 tap">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            {title}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={t("topbar.toggle_theme")}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/settings" aria-label={t("topbar.settings")}>
              <Cog className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
