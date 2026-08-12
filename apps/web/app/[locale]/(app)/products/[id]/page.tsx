import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getProduct } from "@/server/platform/queries";
import { PlatformDetail } from "@/features/platform/platform-view";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <PlatformDetail kind="products" locale={locale} result={await getProduct(id)} />;
}
