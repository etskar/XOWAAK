import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { getLandingMessages } from "@/i18n/landing-messages";
import { createTranslator } from "@/i18n/translate";
import { PostComposer } from "@/features/posts/post-composer";
import { PostList } from "@/features/posts/post-list";
import type { PostListResult, PostQueryResult } from "@/server/posts/types";

type FeedViewProps = {
  locale: Locale;
  viewerId: string;
  result: PostQueryResult<PostListResult>;
};

export function FeedView({ locale, viewerId, result }: FeedViewProps) {
  const messages = getPostsMessages(locale);
  const landing = getLandingMessages(locale);
  const { t } = createTranslator(locale);
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
            <PostComposer locale={locale} unavailable={unavailable} />
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
      </Container>
    </main>
  );
}
