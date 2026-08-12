import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getJobs } from "@/server/platform/queries";
import { PlatformDirectory } from "@/features/platform/platform-view";

export const dynamic = "force-dynamic";

export default async function JobsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <PlatformDirectory kind="jobs" locale={locale} result={await getJobs()} />;
}
