import Link from "next/link";
import type { Route } from "next";
import type { User } from "@supabase/supabase-js";

import { Badge, Card, Container, EmptyState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { createTranslator } from "@/i18n/translate";
import type {
  GroupRecord,
  JobRecord,
  PlatformResult,
  ProductRecord,
  ServiceRecord,
} from "@/server/platform/types";
import { PlatformFeedCard } from "@/features/feed/feed-cards";

type ExploreViewProps = {
  locale: Locale;
  user: User | null;
  products: PlatformResult<ProductRecord[]>;
  services: PlatformResult<ServiceRecord[]>;
  jobs: PlatformResult<JobRecord[]>;
  groups: PlatformResult<GroupRecord[]>;
};

function ViewAllLink({ locale, href }: { locale: Locale; href: string }) {
  const landing = getLandingMessages(locale);
  return (
    <Link className="explore-section__more" href={href as Route}>
      {landing.marketplace.browseAction} →
    </Link>
  );
}

export function ExploreView({
  locale,
  user,
  products,
  services,
  jobs,
  groups,
}: ExploreViewProps) {
  const { t } = createTranslator(locale);
  const landing = getLandingMessages(locale);
  const isAuthenticated = user !== null;
  const available = [products, services, jobs, groups].some(
    (result) => result.status === "ok" && result.data.length > 0,
  );

  if (!available) {
    return (
      <main className="explore-page">
        <Container size="lg">
          <EmptyState
            title={landing.marketplace.title}
            description={landing.marketplace.description}
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="explore-page">
      <Container size="lg">
        <div className="explore-page__header">
          <p className="showcase-eyebrow">XOWAAK / {t("navigation.discover")}</p>
          <h1 className="ds-text-h1">{t("navigation.discover")}</h1>
          <p>{landing.marketplace.description}</p>
        </div>

        {products.status === "ok" && products.data.length > 0 && (
          <section className="explore-section" aria-labelledby="explore-products">
            <div className="explore-section__heading">
              <Badge variant="success">{t("navigation.products")}</Badge>
              <ViewAllLink locale={locale} href={`/${locale}/products`} />
            </div>
            <div className="explore-section__grid">
              {products.data.slice(0, 4).map((item) => (
                <PlatformFeedCard
                  key={item.id}
                  kind="product"
                  item={item}
                  locale={locale}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </section>
        )}

        {services.status === "ok" && services.data.length > 0 && (
          <section className="explore-section" aria-labelledby="explore-services">
            <div className="explore-section__heading">
              <Badge variant="success">{t("navigation.services")}</Badge>
              <ViewAllLink locale={locale} href={`/${locale}/services`} />
            </div>
            <div className="explore-section__grid">
              {services.data.slice(0, 4).map((item) => (
                <PlatformFeedCard
                  key={item.id}
                  kind="service"
                  item={item}
                  locale={locale}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </section>
        )}

        {jobs.status === "ok" && jobs.data.length > 0 && (
          <section className="explore-section" aria-labelledby="explore-jobs">
            <div className="explore-section__heading">
              <Badge variant="success">{t("navigation.jobs")}</Badge>
              <ViewAllLink locale={locale} href={`/${locale}/jobs`} />
            </div>
            <div className="explore-section__grid">
              {jobs.data.slice(0, 4).map((item) => (
                <PlatformFeedCard
                  key={item.id}
                  kind="job"
                  item={item}
                  locale={locale}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </section>
        )}

        {groups.status === "ok" && groups.data.length > 0 && (
          <section className="explore-section" aria-labelledby="explore-groups">
            <div className="explore-section__heading">
              <Badge variant="success">{t("navigation.groups")}</Badge>
              <ViewAllLink locale={locale} href={`/${locale}/groups`} />
            </div>
            <div className="explore-section__grid">
              {groups.data.slice(0, 4).map((group) => (
                <Card as="article" className="explore-group-card" key={group.id}>
                  <div className="explore-group-card__mark" aria-hidden="true">
                    G
                  </div>
                  <div>
                    <h2>{group.name}</h2>
                    {group.description && <p>{group.description}</p>}
                    <p className="explore-group-card__meta">
                      {group.memberCount} {t("navigation.groups")} · @{group.owner?.username}
                    </p>
                  </div>
                  <Link
                    className="feed-card__link"
                    href={`/${locale}/groups/${group.id}` as Route}
                  >
                    {t("navigation.discover")} →
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}