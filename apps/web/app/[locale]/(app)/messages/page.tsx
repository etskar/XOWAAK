import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { getConversations } from "@/server/messaging/queries";
import { MessagesView } from "@/features/messaging/messages-view";

type MessagesPageProps = { params: Promise<{ locale: string }> };

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <MessagesView locale={locale} initial={await getConversations()} />;
}
