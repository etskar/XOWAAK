import { RoutePlaceholder } from "@/components/route-placeholder";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

type MessagesPageProps = { params: Promise<{ locale: string }> };

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);
  return <RoutePlaceholder locale={locale} title={t("navigation.messages")} />;
}
