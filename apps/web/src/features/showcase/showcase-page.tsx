import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container, Section } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { createTranslator } from "@/i18n/translate";
import { Reveal } from "@/features/motion/reveal";

type ShowcasePageProps = {
  locale: Locale;
  mode?: "landing" | "about";
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

function OrbitVisual({ locale }: { locale: Locale }) {
  const landing = getLandingMessages(locale);

  return (
    <div className="showcase-orbit" aria-label={landing.hero.visualTitle}>
      <div className="showcase-orbit__halo showcase-orbit__halo--one" />
      <div className="showcase-orbit__halo showcase-orbit__halo--two" />
      <div className="showcase-orbit__core">
        <span className="showcase-orbit__core-mark">X</span>
        <span className="showcase-orbit__core-label">{landing.hero.visualKicker}</span>
      </div>
      <div className="showcase-orbit__card showcase-orbit__card--top">
        <span>{landing.features.identity.label}</span>
        <strong>{landing.features.identity.title}</strong>
      </div>
      <div className="showcase-orbit__signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function ShowcasePage({ locale, mode = "landing" }: ShowcasePageProps) {
  const landing = getLandingMessages(locale);
  const { t } = createTranslator(locale);
  const featureCards = [
    landing.features.identity,
    landing.features.privacy,
    landing.features.social,
  ];

  return (
    <main className={`showcase-page showcase-page--${mode}`}>
      <section className="showcase-hero">
        <Container size="xl">
          <div className="showcase-hero__grid">
            <div className="showcase-hero__copy">
              <Badge variant="primary">{landing.hero.eyebrow}</Badge>
              <h1 className="ds-text-display">
                {mode === "about" ? landing.intro.title : landing.hero.title}
              </h1>
              <p className="showcase-hero__description">
                {mode === "about" ? landing.intro.description : landing.hero.description}
              </p>
              <div className="showcase-actions">
                <Link
                  className="showcase-button showcase-button--primary"
                  href={`/${locale}/auth/sign-up` as Route}
                >
                  {mode === "about" ? landing.cta.primaryAction : landing.hero.primaryAction}
                  <ArrowIcon />
                </Link>
                <Link
                  className="showcase-button showcase-button--secondary"
                  href={`/${locale}/explore` as Route}
                >
                  {mode === "about" ? landing.cta.secondaryAction : landing.hero.secondaryAction}
                </Link>
              </div>
              <div className="showcase-hero__note">
                <span className="showcase-hero__note-dot" />
                <span>{t("common.liveProduct")}</span>
              </div>
            </div>
            <div className="showcase-hero__visual">
              <OrbitVisual locale={locale} />
              <div className="showcase-hero__visual-caption">
                <span>{landing.hero.visualTag}</span>
                <strong>{landing.hero.visualTitle}</strong>
                <p>{landing.hero.visualBody}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="lg" className="showcase-section showcase-section--intro">
        <Container size="lg">
          <div className="showcase-section__heading">
            <p className="showcase-eyebrow">{landing.intro.eyebrow}</p>
            <h2 className="ds-text-h1">{landing.intro.title}</h2>
            <p>{landing.intro.description}</p>
          </div>
        </Container>
      </Section>

      <Section spacing="lg" className="showcase-section">
        <Container size="xl">
          <div className="showcase-feature-grid">
            {featureCards.map((feature, index) => (
              <Reveal key={feature.label} delay={index * 70}>
                <Card className={`showcase-feature showcase-feature--${index + 1}`}>
                  <span className="showcase-feature__number">{feature.label}</span>
                  <span className="showcase-feature__glyph" aria-hidden="true">
                    {index === 0 ? "01" : index === 1 ? "◌" : "↗"}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="showcase-feature__line" aria-hidden="true" />
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="lg" className="showcase-section showcase-section--ecosystem">
        <Container size="xl">
          <div className="showcase-ecosystem__heading">
            <p className="showcase-eyebrow">{landing.ecosystem.eyebrow}</p>
            <h2 className="ds-text-h1">{landing.ecosystem.title}</h2>
            <p>{landing.ecosystem.description}</p>
          </div>
          <div className="showcase-ecosystem__grid">
            {Object.values(landing.ecosystem.categories).map((category, index) => {
              const isCurrent = category.state === landing.ecosystem.categories.social.state;

              return (
                <Reveal key={category.label} delay={index * 55}>
                  <Card className={`ecosystem-card ecosystem-card--${index + 1}`}>
                    <div className="ecosystem-card__topline">
                      <span className="ecosystem-card__index">0{index + 1}</span>
                      <Badge variant={isCurrent ? "success" : "neutral"}>{category.state}</Badge>
                    </div>
                    <span className="ecosystem-card__glyph" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="ecosystem-card__label">{category.label}</p>
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                    </div>
                    <Link className="ecosystem-card__link" href={`/${locale}/explore` as Route}>
                      {t("navigation.discover")}
                      <ArrowIcon />
                    </Link>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section spacing="lg" className="showcase-section showcase-section--rhythm">
        <Container size="lg">
          <div className="showcase-rhythm">
            <div className="showcase-rhythm__heading">
              <p className="showcase-eyebrow">{landing.rhythm.eyebrow}</p>
              <h2 className="ds-text-h2">{landing.rhythm.title}</h2>
              <p>{landing.rhythm.description}</p>
            </div>
            <div className="showcase-rhythm__list">
              {Object.values(landing.rhythm.items).map((item, index) => (
                <div className="showcase-rhythm__item" key={item.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="lg" className="showcase-section showcase-section--cta">
        <Container size="lg">
          <div className="showcase-cta">
            <div>
              <p className="showcase-eyebrow">XOWAAK</p>
              <h2 className="ds-text-h2">{landing.cta.title}</h2>
              <p>{landing.cta.description}</p>
            </div>
            <div className="showcase-actions">
              <Link
                className="showcase-button showcase-button--primary"
                href={`/${locale}/auth/sign-up` as Route}
              >
                {landing.cta.primaryAction}
                <ArrowIcon />
              </Link>
              <Link
                className="showcase-button showcase-button--secondary"
                href={`/${locale}/auth/sign-in` as Route}
              >
                {landing.cta.secondaryAction}
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

export function ProductUnavailablePage({ locale, title }: { locale: Locale; title: string }) {
  const { t } = createTranslator(locale);

  return (
    <main className="product-state-page">
      <Container size="md">
        <Card className="product-state-card">
          <span className="product-state-card__mark" aria-hidden="true">
            X
          </span>
          <Badge variant="warning">{t("common.designPreview")}</Badge>
          <h1 className="ds-text-h2">{title}</h1>
          <p>{t("common.unavailableTitle")}</p>
          <p className="product-state-card__description">{t("common.unavailableDescription")}</p>
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
