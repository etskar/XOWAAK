import { RoutePlaceholder } from "@/components/route-placeholder";
import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { requireRole } from "@/server/auth/session";
import { createTranslator } from "@/i18n/translate";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);

  if (hasSupabasePublicEnv()) {
    await requireRole(locale, "admin");
  }

  return <RoutePlaceholder locale={locale} title={t("navigation.admin")} />;
}
