import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Badge, Card, Container } from "@/design-system";
import { cx } from "@/design-system/utils/cx";
import type { Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { getPlatformMessages } from "@/i18n/platform-messages";
import { createTranslator } from "@/i18n/translate";
import { Reveal } from "@/features/motion/reveal";
import { getJobs, getProducts, getServices } from "@/server/platform/queries";
import { getCurrentUser } from "@/server/auth/session";
import type { JobRecord, ProductRecord, ServiceRecord } from "@/server/platform/types";

type ShowcasePageProps = {
  locale: Locale;
  mode?: "landing" | "about";
};

type GlyphName = "social" | "marketplace" | "services" | "jobs" | "groups" | "messaging";

const GLYPH_PATHS: Record<GlyphName, string> = {
  social:
    "M16 19a4 4 0 0 0-8 0M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 15a3 3 0 0 0-1.5 4M18.5 15a3 3 0 0 1 1.5 4",
  marketplace:
    "M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1.2 12a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8ZM10 12v2a2 2 0 0 0 4 0v-2",
  services:
    "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z",
  jobs:
    "M8 8V6a4 4 0 0 1 8 0v2M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8ZM12 13v2",
  groups:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M17 8a3 3 0 1 0 0-6M15.5 14.5a6 6 0 0 1 6 5.5",
  messaging:
    "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6ZM8 9.5h8M8 12.5h5",
};

function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={GLYPH_PATHS[name]} />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

function price(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

function initialOf(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal>
      <div className="landing-section__heading">
        <p className="showcase-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </Reveal>
  );
}

type VisualBlockProps = {
  imageUrl?: string | null;
  letter: string;
  text?: boolean;
};

function VisualBlock({ imageUrl, letter, text = false }: VisualBlockProps) {
  return (
    <span
      className={cx("landing-card__visual", text && "landing-card__visual--text")}
      aria-hidden="true"
    >
      {imageUrl ? (
        // Signed URLs are generated on the server for visible records only.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <span>{letter}</span>
      )}
    </span>
  );
}

function RotatingHeadline({ lead, phrases }: { lead: string; phrases: readonly string[] }) {
  return (
    <h1 className="landing-hero__title">
      <span className="landing-hero__lead" aria-hidden="true">{lead} </span>
      <span className="landing-hero__rotating" aria-hidden="true">
        {phrases.map((phrase, index) => (
          <span key={phrase} className="landing-hero__rotating-item" data-index={index}>
            {phrase}
          </span>
        ))}
      </span>
      <span className="sr-only">
        {lead} {phrases[0]}
      </span>
    </h1>
  );
}

type HeroVisualProps = {
  locale: Locale;
  product: ProductRecord | null;
  service: ServiceRecord | null;
  job: JobRecord | null;
};

function HeroVisual({ locale, product, service, job }: HeroVisualProps) {
  const { t } = createTranslator(locale);

  return (
    <div className="landing-hero-visual" aria-hidden="true">
      <div className="landing-hero-visual__halo" />
      <div className="landing-hero-visual__halo landing-hero-visual__halo--two" />
      <div className="landing-hero-visual__stage">
        <span className="landing-hero-visual__brandmark">
          <span />
          <span />
          <span />
        </span>
        <strong className="landing-hero-visual__wordmark">XOWAAK</strong>
        <span className="landing-hero-visual__pills">
          <span>{t("navigation.products")}</span>
          <span aria-hidden="true">·</span>
          <span>{t("navigation.services")}</span>
          <span aria-hidden="true">·</span>
          <span>{t("navigation.jobs")}</span>
        </span>
      </div>
      {product ? (
        <div className="landing-hero-visual__card landing-hero-visual__card--product">
          <span className="landing-hero-visual__thumb">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              initialOf(product.title)
            )}
          </span>
          <strong>{product.title}</strong>
          <span className="landing-hero-visual__price">
            {product.price !== null ? price(product.price, product.currency, locale) : null}
          </span>
        </div>
      ) : null}
      {job ? (
        <div className="landing-hero-visual__card landing-hero-visual__card--job">
          <span className="landing-hero-visual__chips">
            <span>{job.employerName ?? `@${job.owner?.username ?? ""}`}</span>
          </span>
          <strong>{job.title}</strong>
          <span className="landing-hero-visual__meta">
            {job.locationLabel ? `⌖ ${job.locationLabel}` : null}
          </span>
        </div>
      ) : null}
      {service ? (
        <div className="landing-hero-visual__card landing-hero-visual__card--service">
          <strong>{service.title}</strong>
          <span className="landing-hero-visual__meta">
            {service.provider ? `@${service.provider.username}` : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
};

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Reveal>
      <div className="landing-empty">
        <span className="landing-empty__mark" aria-hidden="true">
          <Glyph name="services" />
        </span>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </Reveal>
  );
}

type SectionProps = {
  id?: string;
  alt?: boolean;
  children: ReactNode;
};

function LandingSection({ id, alt = false, children }: SectionProps) {
  return (
    <section className={cx("landing-section", alt && "landing-section--alt")} id={id}>
      <Container size="xl">{children}</Container>
    </section>
  );
}

function OfferTile({ glyph, label, title, description, href, index }: {
  glyph: GlyphName;
  label: string;
  title: string;
  description: string;
  href: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 60}>
      <Link className="landing-offer" href={href as Route}>
        <span className="landing-offer__icon">
          <Glyph name={glyph} />
        </span>
        <span className="landing-offer__label">{label}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </Link>
    </Reveal>
  );
}

async function LandingContent({ locale }: { locale: Locale }) {
  const landing = getLandingMessages(locale);
  const platform = getPlatformMessages(locale);
  const { t } = createTranslator(locale);

  const [user, products, services, jobs] = await Promise.all([
    getCurrentUser(),
    getProducts(4),
    getServices(4),
    getJobs(4),
  ]);

  const productItems: ProductRecord[] =
    products.status === "ok" && products.data.length > 0 ? products.data : [];
  const serviceItems: ServiceRecord[] =
    services.status === "ok" && services.data.length > 0 ? services.data : [];
  const jobItems: JobRecord[] = jobs.status === "ok" && jobs.data.length > 0 ? jobs.data : [];

  const offers: Array<{
    key: keyof typeof landing.offers.items;
    href: string;
  }> = [
    { key: "marketplace", href: "#marketplace" },
    { key: "services", href: "#services" },
    { key: "jobs", href: "#jobs" },
  ];

  return (
    <>
      <section className="landing-hero">
        <Container size="xl">
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <Reveal>
                <Badge variant="primary">{landing.hero.eyebrow}</Badge>
                <RotatingHeadline lead={landing.hero.lead} phrases={landing.hero.phrases} />
                <p className="landing-hero__description">{landing.hero.description}</p>
                <div className="showcase-actions">
                  {user ? (
                    <Link
                      className="showcase-button showcase-button--primary showcase-button--lg"
                      href={`/${locale}/home` as Route}
                    >
                      {landing.hero.openApp}
                      <ArrowIcon />
                    </Link>
                  ) : (
                    <>
                      <Link
                        className="showcase-button showcase-button--primary showcase-button--lg"
                        href={`/${locale}/auth/sign-up` as Route}
                      >
                        {landing.hero.primaryAction}
                        <ArrowIcon />
                      </Link>
                      <Link
                        className="showcase-button showcase-button--secondary showcase-button--lg"
                        href={`/${locale}/auth/sign-in` as Route}
                      >
                        {landing.hero.secondaryAction}
                      </Link>
                    </>
                  )}
                </div>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <HeroVisual
                locale={locale}
                product={productItems[0] ?? null}
                service={serviceItems[0] ?? null}
                job={jobItems[0] ?? null}
              />
            </Reveal>
          </div>
        </Container>
      </section>

      <LandingSection id="offers">
        <SectionHeading
          eyebrow={landing.offers.eyebrow}
          title={landing.offers.title}
          description={landing.offers.description}
        />
        <div className="landing-offers-grid">
          {offers.map((offer, index) => (
            <OfferTile
              key={offer.key}
              glyph={offer.key}
              label={landing.offers.items[offer.key].label}
              title={landing.offers.items[offer.key].title}
              description={landing.offers.items[offer.key].description}
              href={offer.href}
              index={index}
            />
          ))}
        </div>
      </LandingSection>

      <LandingSection id="marketplace" alt>
        <SectionHeading
          eyebrow={landing.marketplace.eyebrow}
          title={landing.marketplace.title}
          description={landing.marketplace.description}
        />
        {productItems.length > 0 ? (
          <div className="landing-grid">
            {productItems.slice(0, 4).map((item, index) => (
              <Reveal key={item.id} delay={index * 60}>
                <Link className="landing-card" href={`/${locale}/products/${item.id}` as Route}>
                  <VisualBlock imageUrl={item.imageUrl} letter={initialOf(item.title)} />
                  <span className="landing-card__body">
                    <strong className="landing-card__title" dir="auto">
                      {item.title}
                    </strong>
                    {item.category && (
                      <span className="landing-card__chips">
                        <span className="landing-card__chip">{item.category}</span>
                      </span>
                    )}
                    <span className="landing-card__meta">
                      {item.locationLabel
                        ? `⌖ ${item.locationLabel}`
                        : item.owner
                          ? `@${item.owner.username}`
                          : landing.marketplace.eyebrow}
                    </span>
                    <span className="landing-card__price">
                      {item.price !== null ? price(item.price, item.currency, locale) : null}
                    </span>
                  </span>
                  <span className="landing-card__footer">
                    <span className="landing-card__link">
                      {t("navigation.products")}
                      <ArrowIcon />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title={landing.empty.title} description={landing.empty.description} />
        )}
        <div className="landing-section__action">
          <Link className="showcase-button showcase-button--primary" href={`/${locale}/products` as Route}>
            {landing.marketplace.browseAction}
            <ArrowIcon />
          </Link>
        </div>
      </LandingSection>

      <LandingSection id="services">
        <SectionHeading
          eyebrow={landing.services.eyebrow}
          title={landing.services.title}
          description={landing.services.description}
        />
        {serviceItems.length > 0 ? (
          <div className="landing-grid">
            {serviceItems.slice(0, 4).map((item, index) => (
              <Reveal key={item.id} delay={index * 60}>
                <Link className="landing-card" href={`/${locale}/services/${item.id}` as Route}>
                  <VisualBlock imageUrl={item.imageUrl} letter={initialOf(item.title)} />
                  <span className="landing-card__body">
                    <strong className="landing-card__title" dir="auto">
                      {item.title}
                    </strong>
                    <span className="landing-card__meta">
                      {item.provider ? `@${item.provider.username}` : landing.services.eyebrow}
                    </span>
                    <span className="landing-card__price">
                      {item.price !== null ? price(item.price, item.currency, locale) : null}
                    </span>
                  </span>
                  <span className="landing-card__footer">
                    <span className="landing-card__link">
                      {t("navigation.services")}
                      <ArrowIcon />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title={landing.empty.title} description={landing.empty.description} />
        )}
        <div className="landing-section__action">
          <Link className="showcase-button showcase-button--secondary" href={`/${locale}/services` as Route}>
            {landing.services.browseAction}
            <ArrowIcon />
          </Link>
        </div>
      </LandingSection>

      <LandingSection id="jobs" alt>
        <SectionHeading
          eyebrow={landing.jobs.eyebrow}
          title={landing.jobs.title}
          description={landing.jobs.description}
        />
        {jobItems.length > 0 ? (
          <div className="landing-grid">
            {jobItems.slice(0, 4).map((item, index) => {
              const typeLabel =
                item.jobType && platform.jobTypes[item.jobType as keyof typeof platform.jobTypes]
                  ? platform.jobTypes[item.jobType as keyof typeof platform.jobTypes]
                  : null;
              return (
                <Reveal key={item.id} delay={index * 60}>
                  <Link className="landing-card" href={`/${locale}/jobs/${item.id}` as Route}>
                    <span className="landing-card__body landing-card__body--pad">
                      <span className="landing-card__chips">
                        <span className="landing-card__chip">
                          {item.employerName ?? `@${item.owner?.username ?? ""}`}
                        </span>
                        {typeLabel && <span className="landing-card__chip">{typeLabel}</span>}
                      </span>
                      <strong className="landing-card__title" dir="auto">
                        {item.title}
                      </strong>
                      <span className="landing-card__meta">
                        {item.locationLabel
                          ? `⌖ ${item.locationLabel}`
                          : item.employerName
                            ? item.employerName
                            : landing.jobs.eyebrow}
                      </span>
                      {item.salaryMin !== null && (
                        <span className="landing-card__price">
                          {price(item.salaryMin, item.currency, locale)}
                        </span>
                      )}
                    </span>
                    <span className="landing-card__footer">
                      <span className="landing-card__link">
                        {t("navigation.jobs")}
                        <ArrowIcon />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <EmptyState title={landing.empty.title} description={landing.empty.description} />
        )}
        <div className="landing-section__action">
          <Link className="showcase-button showcase-button--outline" href={`/${locale}/jobs` as Route}>
            {landing.jobs.browseAction}
            <ArrowIcon />
          </Link>
        </div>
      </LandingSection>

      <LandingSection id="unified">
        <div className="landing-unified">
          <Reveal>
            <div className="landing-unified__pills" aria-hidden="true">
              <span className="landing-unified__pill">{t("navigation.products")}</span>
              <span className="landing-unified__pill">{t("navigation.services")}</span>
              <span className="landing-unified__pill">{t("navigation.messages")}</span>
            </div>
          </Reveal>
          <SectionHeading
            eyebrow={landing.unified.eyebrow}
            title={landing.unified.title}
            description={landing.unified.description}
          />
        </div>
      </LandingSection>

      <LandingSection id="cta">
        <div className="showcase-cta">
          <div>
            <p className="showcase-eyebrow">XOWAAK</p>
            <h2>{landing.finalCta.title}</h2>
            <p>{landing.finalCta.description}</p>
          </div>
          <div className="showcase-actions">
            {user ? (
              <Link
                className="showcase-button showcase-button--primary showcase-button--lg"
                href={`/${locale}/home` as Route}
              >
                {landing.hero.openApp}
                <ArrowIcon />
              </Link>
            ) : (
              <>
                <Link
                  className="showcase-button showcase-button--primary showcase-button--lg"
                  href={`/${locale}/auth/sign-up` as Route}
                >
                  {landing.finalCta.primaryAction}
                  <ArrowIcon />
                </Link>
                <Link
                  className="showcase-button showcase-button--secondary showcase-button--lg"
                  href={`/${locale}/auth/sign-in` as Route}
                >
                  {landing.finalCta.secondaryAction}
                </Link>
              </>
            )}
          </div>
        </div>
      </LandingSection>
    </>
  );
}

function AboutContent({ locale }: { locale: Locale }) {
  const landing = getLandingMessages(locale);
  const features = [landing.features.identity, landing.features.privacy, landing.features.social];
  const glyphs: GlyphName[] = ["social", "messaging", "groups"];

  return (
    <>
      <section className="landing-hero">
        <Container size="xl">
          <div className="landing-hero__grid landing-hero__grid--about">
            <div className="landing-hero__copy">
              <Reveal>
                <Badge variant="primary">{landing.about.eyebrow}</Badge>
                <h1>{landing.about.title}</h1>
                <p className="landing-hero__description">{landing.about.description}</p>
                <div className="showcase-actions">
                  <Link
                    className="showcase-button showcase-button--primary showcase-button--lg"
                    href={`/${locale}/auth/sign-up` as Route}
                  >
                    {landing.finalCta.primaryAction}
                    <ArrowIcon />
                  </Link>
                  <Link
                    className="showcase-button showcase-button--secondary showcase-button--lg"
                    href={`/${locale}/auth/sign-in` as Route}
                  >
                    {landing.finalCta.secondaryAction}
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>
      <LandingSection id="about-features">
        <div className="landing-offers-grid">
          {features.map((feature, index) => (
            <OfferTile
              key={feature.label}
              glyph={glyphs[index]}
              label={feature.label}
              title={feature.title}
              description={feature.description}
              href={`/${locale}/auth/sign-up`}
              index={index}
            />
          ))}
        </div>
      </LandingSection>
      <LandingSection id="about-cta">
        <div className="showcase-cta">
          <div>
            <p className="showcase-eyebrow">XOWAAK</p>
            <h2>{landing.finalCta.title}</h2>
            <p>{landing.finalCta.description}</p>
          </div>
          <div className="showcase-actions">
            <Link
              className="showcase-button showcase-button--primary showcase-button--lg"
              href={`/${locale}/auth/sign-up` as Route}
            >
              {landing.finalCta.primaryAction}
              <ArrowIcon />
            </Link>
            <Link
              className="showcase-button showcase-button--secondary showcase-button--lg"
              href={`/${locale}/auth/sign-in` as Route}
            >
              {landing.finalCta.secondaryAction}
            </Link>
          </div>
        </div>
      </LandingSection>
    </>
  );
}

export async function ShowcasePage({ locale, mode = "landing" }: ShowcasePageProps) {
  return (
    <main className={`showcase-page landing-page landing-page--${mode}`}>
      {mode === "landing" ? <LandingContent locale={locale} /> : <AboutContent locale={locale} />}
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
