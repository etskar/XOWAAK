import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getServicesById } from "@/server/platform/queries";
import { PlatformDetail } from "@/features/platform/platform-view";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <PlatformDetail kind="services" locale={locale} result={await getServicesById(id)} />;
}
