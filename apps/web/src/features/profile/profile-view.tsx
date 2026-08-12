import Link from "next/link";
import type { Route } from "next";

import { Avatar, Badge, Card, Container } from "@/design-system";

import type { Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import type { ProfileRecord } from "@/server/identity/types";
import { RelationshipActions } from "@/features/social/relationship-actions";
import { PostList } from "@/features/posts/post-list";
import { getSocialMessages } from "@/i18n/social-messages";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createTranslator } from "@/i18n/translate";
import type { Relationship } from "@/server/social/types";
import type { PostListResult, PostQueryResult } from "@/server/posts/types";

type ProfileViewProps = {
  locale: Locale;
  profile: ProfileRecord;
  relationship: Relationship | null;
  followerCount: number;
  followingCount: number;
  viewerId: string | null;
  posts: PostQueryResult<PostListResult> | null;
  postsPaginationPath: string;
};

export function ProfileView({
  locale,
  profile,
  relationship,
  followerCount,
  followingCount,
  viewerId,
  posts,
  postsPaginationPath,
}: ProfileViewProps) {
  const messages = getIdentityMessages(locale);
  const social = getSocialMessages(locale);
  const postsMessages = getPostsMessages(locale);
  const { t } = createTranslator(locale);
  const displayName = profile.display_name || profile.username;

  return (
    <main className="profile-page" data-locale={locale}>
      <Container size="xl">
        <div className="profile-page__topline">
          <Link href={`/${locale}` as Route}>{t("common.backToHome")}</Link>
          <Badge variant={profile.visibility === "private" ? "warning" : "success"}>
            {profile.visibility === "private" ? messages.privacy.private : messages.privacy.public}
          </Badge>
        </div>
        <Card elevated className="profile-hero-card">
          <div className="profile-cover" aria-hidden="true" />
          <div className="profile-hero-card__body">
            <div className="profile-summary">
              <Avatar name={displayName} size="lg" />
              <div className="profile-summary__identity">
                <h1 className="ds-text-h3" dir="auto">
                  {displayName}
                </h1>
                <p className="profile-summary__username" dir="ltr">
                  @{profile.username}
                </p>
              </div>
              <div className="profile-summary__actions">
                <RelationshipActions
                  locale={locale}
                  targetUserId={profile.id}
                  relationship={relationship}
                />
              </div>
            </div>
            {profile.bio && (
              <p className="profile-bio" dir="auto">
                {profile.bio}
              </p>
            )}
            {profile.location_label && (
              <p className="profile-location" dir="auto">
                ⌖ {profile.location_label}
              </p>
            )}
            <div className="profile-metrics">
              <Link href={`/${locale}/u/${profile.username}/followers` as Route}>
                <strong>{followerCount}</strong>
                <span>{social.counts.followers}</span>
              </Link>
              <Link href={`/${locale}/u/${profile.username}/following` as Route}>
                <strong>{followingCount}</strong>
                <span>{social.counts.following}</span>
              </Link>
            </div>
          </div>
        </Card>
        <div className="profile-content-grid">
          <section className="profile-posts" aria-labelledby="profile-posts-title">
            <div className="profile-section-heading">
              <p className="showcase-eyebrow">XOWAAK / {profile.username}</p>
              <h2 id="profile-posts-title" className="ds-text-h3">
                {postsMessages.pages.home}
              </h2>
            </div>
            {posts && (
              <PostList
                locale={locale}
                result={posts.status === "ok" ? posts.data : null}
                viewerId={viewerId}
                error={posts.status === "error"}
                emptyTitle={postsMessages.pages.noPosts}
                emptyDescription={postsMessages.pages.noPosts}
                paginationPath={postsPaginationPath}
              />
            )}
          </section>
          <aside className="profile-context-card">
            <span className="profile-context-card__mark">X</span>
            <h2>{messages.profile.publicTitle}</h2>
            <p>{messages.profile.description}</p>
            <Link href={`/${locale}/u/${profile.username}/followers` as Route}>
              {social.counts.followers}
            </Link>
            <Link href={`/${locale}/u/${profile.username}/following` as Route}>
              {social.counts.following}
            </Link>
          </aside>
        </div>
      </Container>
    </main>
  );
}
