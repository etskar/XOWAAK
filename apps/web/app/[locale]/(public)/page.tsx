import { RoutePlaceholder } from "@/components/route-placeholder";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

type PublicHomePageProps = { params: Promise<{ locale: string }> };

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);

  return <RoutePlaceholder locale={locale} title="XOWAAK" description={t("common.publicShell")} />;
}
