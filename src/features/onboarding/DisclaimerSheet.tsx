import { Bot, ExternalLink, HardDrive, Scale, Wifi } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { useSettings } from "@/stores/useSettings";
import { useT } from "@/i18n";
import { REPOSITORY_URL } from "@/lib/appMeta";

interface DisclaimerSheetProps {
  open: boolean;
  onAccepted: () => void;
}

export function DisclaimerSheet({ open, onAccepted }: DisclaimerSheetProps) {
  const t = useT();
  const language = useSettings((s) => s.settings.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const acceptDisclaimer = useSettings((s) => s.acceptDisclaimer);

  const handleAccept = async () => {
    await acceptDisclaimer();
    onAccepted();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={() => {}}
      title={t("disclaimer.title")}
      description={t("disclaimer.description")}
      maxHeight="92dvh"
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Bot className="h-7 w-7 text-foreground" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium">{t("disclaimer.language")}</span>
          <LanguageSelector value={language} onValueChange={setLanguage} />
        </div>

        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <span>{t("disclaimer.point_ai")}</span>
          </li>
          <li className="flex gap-3">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <span>
              {t("disclaimer.point_source")}{" "}
              <a
                href={REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2 tap"
              >
                {t("disclaimer.repository_link")}
              </a>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <span>{t("disclaimer.point_local")}</span>
          </li>
          <li className="flex gap-3">
            <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <span>{t("disclaimer.point_network")}</span>
          </li>
          <li className="flex gap-3">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <span>{t("disclaimer.point_acceptance")}</span>
          </li>
        </ul>

        <p className="text-xs text-muted-foreground">{t("disclaimer.accept_note")}</p>

        <Button className="w-full" onClick={handleAccept}>
          {t("disclaimer.accept")}
        </Button>
      </div>
    </BottomSheet>
  );
}
