"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { Badge, Button, Card, Container } from "@/design-system";

type LocaleErrorProps = {
  reset: () => void;
};

export default function LocaleError({ reset }: LocaleErrorProps) {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main className="product-state-page" role="alert" aria-labelledby="error-title">
      <Container size="md">
        <Card className="product-state-card">
          <span className="product-state-card__mark" aria-hidden="true">
            !
          </span>
          <Badge variant="error">{t("errors.unexpected")}</Badge>
          <h1 id="error-title" className="ds-text-h2">
            {t("common.unexpectedError")}
          </h1>
          <p className="product-state-card__description">{t("errors.reload")}</p>
          <div className="showcase-actions">
            <Button type="button" onPress={reset}>
              {t("common.retry")}
            </Button>
            <Link
              className="showcase-button showcase-button--secondary"
              href={`/${locale}` as Route}
            >
              {t("common.backToHome")}
            </Link>
          </div>
        </Card>
      </Container>
    </main>
  );
}
