"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { Card, Container, Skeleton } from "@/design-system";

export default function LocaleLoading() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main
      className="product-state-page page-loading"
      aria-busy="true"
      aria-label={t("common.loading")}
    >
      <Container size="md">
        <Card className="loading-card">
          <Skeleton variant="avatar" />
          <Skeleton variant="text" />
          <Skeleton variant="card" />
          <p>{t("common.loadingXowaak")}</p>
        </Card>
      </Container>
    </main>
  );
}
