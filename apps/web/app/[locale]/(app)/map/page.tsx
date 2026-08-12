import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getLocationRecords } from "@/server/platform/queries";
import { PlatformMap } from "@/features/platform/platform-map";

export const dynamic = "force-dynamic";

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  return <PlatformMap locale={localeParam as Locale} result={await getLocationRecords()} />;
}
