import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { ProductUnavailablePage } from "@/features/showcase/showcase-page";

type NotificationsPageProps = { params: Promise<{ locale: string }> };

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);
  return <ProductUnavailablePage locale={locale} title={t("navigation.notifications")} />;
}
