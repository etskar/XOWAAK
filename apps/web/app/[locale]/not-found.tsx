"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { Badge, Card, Container } from "@/design-system";

export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main className="product-state-page" aria-labelledby="route-title">
      <Container size="md">
        <Card className="product-state-card">
          <span className="product-state-card__mark" aria-hidden="true">
            404
          </span>
          <Badge variant="neutral">{t("common.notFound")}</Badge>
          <h1 id="route-title" className="ds-text-h2">
            {t("errors.notFound")}
          </h1>
          <p className="product-state-card__description">{t("errors.unavailable")}</p>
          <Link className="showcase-button showcase-button--primary" href={`/${locale}` as Route}>
            {t("common.backToHome")}
          </Link>
        </Card>
      </Container>
    </main>
  );
}
