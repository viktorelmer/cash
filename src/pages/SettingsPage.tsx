import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  DatabaseBackup,
  Download,
  Info,
  Moon,
  Percent,
  RefreshCw,
  Repeat,
  Settings2,
  Sun,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ExchangeRatesPreview } from "@/components/shared/ExchangeRatesPreview";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useSettings } from "@/stores/useSettings";
import { useFormatMoney, useT } from "@/i18n";
import { downloadBackup, importBackup, resetDatabase } from "@/lib/db";
import type { ThemePreference } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const t = useT();
  const settings = useSettings((s) => s.settings);
  const setCurrency = useSettings((s) => s.setCurrency);
  const refreshExchangeRates = useSettings((s) => s.refreshExchangeRates);
  const setTheme = useSettings((s) => s.setTheme);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setDefaultTaxRate = useSettings((s) => s.setDefaultTaxRate);
  const update = useSettings((s) => s.update);
  const setStartingBalance = useSettings((s) => s.setStartingBalance);
  const formatMoney = useFormatMoney();
  const walletBalance = useWalletBalance();

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [ratesRefreshing, setRatesRefreshing] = useState(false);
  const [baselineAmount, setBaselineAmount] = useState("");

  useEffect(() => {
    setBaselineAmount(
      settings.startingBalance !== null &&
        settings.startingBalance !== undefined
        ? String(settings.startingBalance)
        : "",
    );
  }, [settings.startingBalance]);

  const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "system", label: t("settings.themes.system"), icon: Repeat },
    { value: "light", label: t("settings.themes.light"), icon: Sun },
    { value: "dark", label: t("settings.themes.dark"), icon: Moon },
  ];

  const handleImportClick = () => fileInput.current?.click();

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      await importBackup(text, "replace");
      toast.success(t("settings.toast_backup_restored"));
    } catch (err) {
      console.error(err);
      toast.error(t("settings.toast_backup_failed"), {
        description:
          err instanceof Error
            ? err.message
            : t("settings.toast_backup_failed_unexpected"),
      });
    } finally {
      setRestoring(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <Card>
        <CardContent className="p-5 space-y-4">
          <SectionHeading
            icon={Wallet}
            title={t("settings.section_wallet")}
          />
          <p className="text-sm text-muted-foreground">
            {t("settings.wallet_caption")}
          </p>
          {walletBalance !== null && (
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("wallet.on_hand")}
              </div>
              <div className="mt-1 text-xl font-semibold num">
                {formatMoney(walletBalance, settings.currency)}
              </div>
            </div>
          )}
          <div>
            <Label>{t("settings.wallet_baseline_label")}</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={baselineAmount}
                onChange={(e) => setBaselineAmount(e.target.value)}
                placeholder={t("settings.wallet_baseline_placeholder")}
                className="flex-1"
              />
              <CurrencySelector
                value={settings.currency}
                onValueChange={setCurrency}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const n = Number(baselineAmount);
              if (!Number.isFinite(n) || n < 0) return;
              await setStartingBalance(n);
              toast.success(t("settings.toast_baseline_updated"));
            }}
          >
            {t("settings.wallet_baseline_save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-5">
          <SectionHeading
            icon={Settings2}
            title={t("settings.section_preferences")}
          />

          <SettingRow label={t("settings.default_currency")}>
            <CurrencySelector
              value={settings.currency}
              onValueChange={setCurrency}
            />
          </SettingRow>

          <div className="rounded-xl bg-muted/40 p-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              {settings.exchangeRatesUpdatedAt
                ? t("settings.exchange_rates_updated", {
                    date: new Date(
                      settings.exchangeRatesUpdatedAt,
                    ).toLocaleString(),
                  })
                : t("settings.exchange_rates_never")}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={ratesRefreshing}
              onClick={async () => {
                setRatesRefreshing(true);
                try {
                  const ok = await refreshExchangeRates();
                  if (ok) {
                    toast.success(t("settings.toast_rates_updated"));
                  } else {
                    toast.error(t("settings.toast_rates_failed"));
                  }
                } finally {
                  setRatesRefreshing(false);
                }
              }}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  ratesRefreshing && "animate-spin",
                )}
              />
              {t("settings.exchange_rates_refresh")}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {t("settings.exchange_rates_caption")}
            </p>
            <ExchangeRatesPreview
              base={settings.currency}
              rates={settings.exchangeRates}
            />
          </div>

          <SettingRow label={t("settings.theme")}>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setTheme(theme.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tap transition-colors",
                    settings.theme === theme.value
                      ? "bg-background shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <theme.icon className="h-3.5 w-3.5" />
                  {theme.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label={t("settings.language")}>
            <LanguageSelector
              value={settings.language}
              onValueChange={setLanguage}
            />
          </SettingRow>

          <SettingRow label={t("settings.week_starts_on")}>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => update({ weekStartsOn: 1 })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  settings.weekStartsOn === 1
                    ? "bg-background shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                {t("settings.weeks.monday")}
              </button>
              <button
                type="button"
                onClick={() => update({ weekStartsOn: 0 })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  settings.weekStartsOn === 0
                    ? "bg-background shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                {t("settings.weeks.sunday")}
              </button>
            </div>
          </SettingRow>

          <Separator />

          <SectionHeading icon={Percent} title={t("settings.section_taxes")} />
          <div>
            <Label>{t("settings.default_tax_rate")}</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                value={settings.defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {t("settings.tax_caption")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <SectionHeading
            icon={DatabaseBackup}
            title={t("settings.section_backup")}
          />
          <p className="text-sm text-muted-foreground">
            {t("settings.backup_caption")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => downloadBackup()}>
              <Download className="h-4 w-4" />
              {t("settings.export")}
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={restoring}
            >
              <Upload className="h-4 w-4" />
              {restoring ? t("settings.restoring") : t("settings.import")}
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <SectionHeading
            icon={AlertTriangle}
            title={t("settings.section_danger")}
          />
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <div className="text-sm font-semibold">
                {t("settings.reset_title")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("settings.reset_caption")}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm(t("settings.reset_confirm"))) {
                  await resetDatabase();
                  toast(t("settings.toast_reset"));
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t("settings.reset_button")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground py-4 flex items-center justify-center gap-1.5">
        <Info className="h-3 w-3" />
        {t("settings.privacy_footer")}
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Sun;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{title}</span>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

