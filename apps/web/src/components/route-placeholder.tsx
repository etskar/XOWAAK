import Link from "next/link";
import type { Route } from "next";

import { defaultLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { Badge, Card, Container } from "@/design-system";

type RoutePlaceholderProps = {
  title: string;
  description?: string;
  locale?: Locale;
};

export function RoutePlaceholder({
  title,
  description,
  locale = defaultLocale,
}: RoutePlaceholderProps) {
  const { t } = createTranslator(locale);

  return (
    <main className="product-state-page" aria-labelledby="route-title">
      <Container size="md">
        <Card className="product-state-card">
          <span className="product-state-card__mark" aria-hidden="true">
            X
          </span>
          <Badge variant="warning">{t("common.configurationTitle")}</Badge>
          <h1 id="route-title" className="ds-text-h2">
            {title}
          </h1>
          <p>{description ?? t("common.reserved")}</p>
          <p className="product-state-card__description">{t("common.configurationDescription")}</p>
          <div className="showcase-actions">
            <Link className="showcase-button showcase-button--primary" href={`/${locale}` as Route}>
              {t("common.backToHome")}
            </Link>
            <Link
              className="showcase-button showcase-button--secondary"
              href={`/${locale}/auth/sign-up` as Route}
            >
              {t("navigation.createAccount")}
            </Link>
          </div>
        </Card>
      </Container>
    </main>
  );
}
