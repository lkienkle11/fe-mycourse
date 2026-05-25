import { getTranslations } from "next-intl/server";

export async function SysadminDashboardPage() {
  const t = await getTranslations("dashboard.sysadmin");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  );
}
