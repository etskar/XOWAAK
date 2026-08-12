import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getGroup } from "@/server/platform/queries";
import { PlatformDetail } from "@/features/platform/platform-view";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <PlatformDetail kind="groups" locale={locale} result={await getGroup(id)} />;
}
