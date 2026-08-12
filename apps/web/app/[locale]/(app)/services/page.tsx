import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getServices } from "@/server/platform/queries";
import { PlatformDirectory } from "@/features/platform/platform-view";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <PlatformDirectory kind="services" locale={locale} result={await getServices()} />;
}
