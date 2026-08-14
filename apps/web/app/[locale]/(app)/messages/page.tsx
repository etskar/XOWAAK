import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { getConversations } from "@/server/messaging/queries";
import { MessagesView } from "@/features/messaging/messages-view";

type MessagesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MessagesPage({ params, searchParams }: MessagesPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const query = searchParams ? await searchParams : {};
  return (
    <MessagesView
      locale={locale}
      initial={await getConversations()}
      initialUsername={firstQueryValue(query.open) ?? undefined}
    />
  );
}
