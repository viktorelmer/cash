import { Bot, ExternalLink, HardDrive, Wifi } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/stores/useSettings";
import { useT } from "@/i18n";
import { REPOSITORY_URL } from "@/lib/appMeta";

interface DisclaimerSheetProps {
  open: boolean;
  onAccepted: () => void;
}

export function DisclaimerSheet({ open, onAccepted }: DisclaimerSheetProps) {
  const t = useT();
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
        </ul>

        <Button className="w-full" onClick={handleAccept}>
          {t("disclaimer.accept")}
        </Button>
      </div>
    </BottomSheet>
  );
}
