import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { createTranslator } from "@/i18n/translate";

export function AdminDashboard({ locale }: { locale: Locale }) {
  const landing = getLandingMessages(locale);
  const { t } = createTranslator(locale);
  const areas = [
    landing.offers.items.social,
    landing.offers.items.marketplace,
    landing.offers.items.services,
  ];

  return (
    <main className="admin-page">
      <Container size="xl">
        <div className="admin-page__topline">
          <Link href={`/${locale}` as Route}>{t("common.backToHome")}</Link>
          <Badge variant="success">{t("common.liveProduct")}</Badge>
        </div>
        <header className="admin-page__header">
          <p className="showcase-eyebrow">XOWAAK / {t("navigation.admin")}</p>
          <h1 className="ds-text-display">{t("navigation.admin")}</h1>
          <p>{landing.about.description}</p>
        </header>
        <div className="admin-grid">
          {areas.map((area, index) => (
            <Card key={area.title} className="admin-card">
              <span className="admin-card__index">0{index + 1}</span>
              <h2>{area.title}</h2>
              <p>{area.description}</p>
            </Card>
          ))}
        </div>
        <Card className="admin-notice">
          <Badge variant="info">{t("navigation.admin")}</Badge>
          <h2>{t("common.configurationTitle")}</h2>
          <p>{t("common.configurationDescription")}</p>
          <Link href={`/${locale}/settings` as Route}>{t("navigation.settings")}</Link>
        </Card>
      </Container>
    </main>
  );
}
