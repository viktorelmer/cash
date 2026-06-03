import { PieChart, Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { NavRow } from "@/components/shared/NavRow";
import { useT } from "@/i18n";

export function BasicsPage() {
  const t = useT();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("basics.title")}
        description={t("basics.description")}
      />

      <Card>
        <CardContent className="p-2">
          <NavRow
            to="/budget"
            icon={PieChart}
            title={t("settings.nav.budget")}
            description={t("settings.nav.budget_caption")}
          />
          <NavRow
            to="/categories"
            icon={Tags}
            title={t("settings.nav.categories")}
            description={t("settings.nav.categories_caption")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
