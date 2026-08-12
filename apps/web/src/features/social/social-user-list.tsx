import Link from "next/link";
import type { Route } from "next";

import { Avatar, Badge, Card, Container, EmptyState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { getSocialMessages } from "@/i18n/social-messages";
import { RelationshipActions } from "@/features/social/relationship-actions";
import type { SocialUser } from "@/server/social/types";

type SocialUserListProps = {
  locale: Locale;
  items: SocialUser[];
  emptyTitle: string;
  emptyDescription: string;
};

export function SocialUserList({
  locale,
  items,
  emptyTitle,
  emptyDescription,
}: SocialUserListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="social-user-list">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="social-user-row">
            <Link
              href={`/${locale}/u/${item.username}` as Route}
              className="social-user-row__identity"
            >
              <Avatar name={item.displayName} size="md" />
              <span>
                <strong dir="auto">{item.displayName}</strong>
                <span dir="ltr">@{item.username}</span>
              </span>
            </Link>
            <RelationshipActions
              locale={locale}
              targetUserId={item.id}
              relationship={item.relationship}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

type SocialListPageProps = SocialUserListProps & {
  title: string;
  description: string;
  profileUsername: string;
  resource: "followers" | "following";
  page: number;
  hasMore: boolean;
};

export function SocialListPage({
  locale,
  items,
  emptyTitle,
  emptyDescription,
  title,
  description,
  profileUsername,
  resource,
  page,
  hasMore,
}: SocialListPageProps) {
  const social = getSocialMessages(locale);
  const { t } = createTranslator(locale);
  const previous = page > 1 ? `/${locale}/u/${profileUsername}/${resource}?page=${page - 1}` : null;
  const next = hasMore ? `/${locale}/u/${profileUsername}/${resource}?page=${page + 1}` : null;

  return (
    <main className="social-list-page" data-locale={locale}>
      <Container size="md">
        <div className="social-list-page__topline">
          <Link href={`/${locale}/u/${profileUsername}` as Route}>{t("common.backToHome")}</Link>
          <Badge variant="primary">
            {resource === "followers" ? social.pages.followers : social.pages.following}
          </Badge>
        </div>
        <div className="social-list-page__header">
          <p className="showcase-eyebrow">XOWAAK / @{profileUsername}</p>
          <h1 className="ds-text-h2">{title}</h1>
          <p>{description}</p>
        </div>
        <SocialUserList
          locale={locale}
          items={items}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
        {(previous || next) && (
          <nav
            className="social-pagination"
            aria-label={resource === "followers" ? social.pages.followers : social.pages.following}
          >
            {previous && <Link href={previous as Route}>{t("common.previous")}</Link>}
            {next && <Link href={next as Route}>{t("common.next")}</Link>}
          </nav>
        )}
      </Container>
    </main>
  );
}
