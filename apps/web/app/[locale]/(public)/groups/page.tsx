import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getGroups } from "@/server/platform/queries";
import { PlatformDirectory } from "@/features/platform/platform-view";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function GroupsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  return (
    <PlatformDirectory kind="groups" locale={locale} result={await getGroups()} user={user} />
  );
}