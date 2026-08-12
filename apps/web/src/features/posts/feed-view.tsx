import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { getLandingMessages } from "@/i18n/landing-messages";
import { createTranslator } from "@/i18n/translate";
import { getAppMessages } from "@/i18n/app-messages";
import { PostComposer } from "@/features/posts/post-composer";
import { PostList } from "@/features/posts/post-list";
import { CreateAction } from "@/features/posts/create-action";
import type { PostListResult, PostQueryResult } from "@/server/posts/types";

type FeedViewProps = {
  locale: Locale;
  viewerId: string;
  result: PostQueryResult<PostListResult>;
  profileComplete: boolean;
};

export function FeedView({ locale, viewerId, result, profileComplete }: FeedViewProps) {
  const messages = getPostsMessages(locale);
  const landing = getLandingMessages(locale);
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const unavailable = result.status === "unavailable";
  const queryError = result.status === "error";

  return (
    <main className="feed-page" data-locale={locale}>
      <Container size="xl">
        <div className="feed-page__header">
          <div>
            <p className="showcase-eyebrow">{landing.rhythm.eyebrow}</p>
            <h1 className="ds-text-h1">{messages.pages.home}</h1>
            <p>{landing.hero.description}</p>
          </div>
          <div className="feed-page__links">
            <Link href={`/${locale}/settings` as Route}>{t("navigation.settings")}</Link>
            <Link href={`/${locale}/followers/requests` as Route}>
              {t("navigation.followRequests")}
            </Link>
          </div>
        </div>
        <div className="feed-page__layout">
          <div className="feed-page__main">
            {profileComplete || unavailable ? (
              <PostComposer locale={locale} unavailable={unavailable} />
            ) : (
              <Card className="feed-profile-gate">
                <Badge variant="warning">{app.completeProfileTitle}</Badge>
                <p>{app.completeProfileDescription}</p>
                <Link href={`/${locale}/settings/profile` as Route}>
                  {app.completeProfileAction}
                </Link>
              </Card>
            )}
            <PostList
              locale={locale}
              result={result.status === "ok" ? result.data : null}
              viewerId={viewerId}
              error={queryError}
            />
            {unavailable && (
              <Card className="feed-unavailable">
                <Badge variant="warning">{t("common.configurationTitle")}</Badge>
                {messages.pages.unavailable}
              </Card>
            )}
          </div>
          <aside className="feed-page__aside">
            <Card className="feed-context-card">
              <Badge variant="primary">{t("common.liveProduct")}</Badge>
              <h2>{landing.features.identity.title}</h2>
              <p>{landing.features.identity.description}</p>
              <Link href={`/${locale}/settings/profile` as Route}>{t("navigation.settings")}</Link>
            </Card>
            <Card className="feed-context-card feed-context-card--quiet">
              <span className="feed-context-card__index">02</span>
              <h2>{landing.features.privacy.title}</h2>
              <p>{landing.features.privacy.description}</p>
            </Card>
          </aside>
        </div>
        <section className="feed-platform-directory" aria-labelledby="platform-directory-title">
          <div className="feed-platform-directory__heading">
            <p className="showcase-eyebrow">{landing.ecosystem.eyebrow}</p>
            <h2 id="platform-directory-title" className="ds-text-h3">
              {landing.ecosystem.title}
            </h2>
          </div>
          <div className="feed-platform-directory__grid">
            {Object.values(landing.ecosystem.categories).map((category) => {
              const isSocial = category.label === landing.ecosystem.categories.social.label;
              const isProfile = category.label === landing.ecosystem.categories.profiles.label;
              const href = isSocial
                ? `/${locale}/home`
                : isProfile
                  ? `/${locale}/settings/profile`
                  : `/${locale}/explore`;

              return (
                <Link key={category.label} className="feed-platform-tile" href={href as Route}>
                  <span>{category.label}</span>
                  <strong>{category.title}</strong>
                  <small>{category.state}</small>
                </Link>
              );
            })}
          </div>
        </section>
        <CreateAction locale={locale} profileComplete={profileComplete} />
      </Container>
    </main>
  );
}
