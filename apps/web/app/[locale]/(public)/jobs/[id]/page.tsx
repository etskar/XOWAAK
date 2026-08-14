import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getJob } from "@/server/platform/queries";
import { PlatformDetail } from "@/features/platform/platform-view";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  return <PlatformDetail kind="jobs" locale={locale} result={await getJob(id)} user={user} />;
}