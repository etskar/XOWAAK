import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { Container, EmptyState, ErrorState } from "@/design-system";
import { isLocale, type Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { getProducts, getServices } from "@/server/platform/queries";
import { MarketplaceGrid } from "@/features/platform/marketplace-grid";
import { cx } from "@/design-system/utils/cx";

export const dynamic = "force-dynamic";

type MarketplacePageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({ params, searchParams }: MarketplacePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);
  const query = searchParams ? await searchParams : {};
  const tabParam = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const tab = tabParam === "services" ? "services" : "products";

  const [products, services] = await Promise.all([getProducts(), getServices()]);

  return (
    <main className="app-surface marketplace-page">
      <Container size="lg">
        <div className="app-surface__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / {app.marketplace}</p>
            <h1 className="ds-text-h1">{app.marketplace}</h1>
            <p>{app.marketplaceDescription}</p>
          </div>
        </div>
        <div className="marketplace-tabs" role="tablist" aria-label={app.marketplace}>
          <Link
            role="tab"
            aria-selected={tab === "products"}
            className={cx("marketplace-tab", tab === "products" && "marketplace-tab--active")}
            href={`/${locale}/marketplace?tab=products` as Route}
          >
            {app.marketplaceProducts}
          </Link>
          <Link
            role="tab"
            aria-selected={tab === "services"}
            className={cx("marketplace-tab", tab === "services" && "marketplace-tab--active")}
            href={`/${locale}/marketplace?tab=services` as Route}
          >
            {app.marketplaceServices}
          </Link>
        </div>
        {tab === "products" &&
          (products.status === "error" ? (
            <ErrorState title={app.commerceFailed} description="" />
          ) : products.status === "unavailable" ? (
            <EmptyState title={app.unavailable} description="" />
          ) : (
            <MarketplaceGrid
              locale={locale}
              kind="product"
              items={products.status === "ok" ? products.data : []}
            />
          ))}
        {tab === "services" &&
          (services.status === "error" ? (
            <ErrorState title={app.commerceFailed} description="" />
          ) : services.status === "unavailable" ? (
            <EmptyState title={app.unavailable} description="" />
          ) : (
            <MarketplaceGrid
              locale={locale}
              kind="service"
              items={services.status === "ok" ? services.data : []}
            />
          ))}
        <div className="marketplace-links">
          <Link href={`/${locale}/products/new` as Route}>{t("navigation.products")}</Link>
          <Link href={`/${locale}/services/new` as Route}>{t("navigation.services")}</Link>
        </div>
      </Container>
    </main>
  );
}