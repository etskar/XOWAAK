import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { getNotifications } from "@/server/messaging/queries";
import { NotificationsView } from "@/features/messaging/notifications-view";

type NotificationsPageProps = { params: Promise<{ locale: string }> };

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <NotificationsView locale={locale} initial={await getNotifications()} />;
}
