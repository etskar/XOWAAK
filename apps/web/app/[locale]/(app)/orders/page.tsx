import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { getOrderCenter } from "@/server/platform/order-queries";
import { OrdersView } from "@/features/orders/orders-view";

type OrdersPageProps = { params: Promise<{ locale: string }> };

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <OrdersView locale={locale} result={await getOrderCenter()} />;
}