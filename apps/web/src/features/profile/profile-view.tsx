import Link from "next/link";
import type { Route } from "next";

import { Avatar, Badge, Card, Container, Stack } from "@/design-system";

import type { Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import type { ProfileRecord } from "@/server/identity/types";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";
import { RelationshipActions } from "@/features/social/relationship-actions";
import { PostList } from "@/features/posts/post-list";
import { getSocialMessages } from "@/i18n/social-messages";
import { getPostsMessages } from "@/i18n/posts-messages";
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
  const displayName = profile.display_name || profile.username;

  return (
    <main className="profile-page" data-locale={locale}>
      <Container size="md">
        <LocaleSwitcher locale={locale} />
        <Card elevated>
          <Stack gap={5}>
            <div className="profile-summary">
              <Avatar name={displayName} size="lg" />
              <div className="profile-summary__identity">
                <h1 className="ds-text-h3" dir="auto">
                  {displayName}
                </h1>
                <p className="profile-summary__username" dir="ltr">
                  @{profile.username}
                </p>
                {profile.visibility === "private" && (
                  <Badge variant="neutral">{messages.privacy.private}</Badge>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="profile-bio" dir="auto">
                {profile.bio}
              </p>
            )}
            {profile.location_label && (
              <p className="profile-location" dir="auto">
                {profile.location_label}
              </p>
            )}
            <div className="profile-metrics">
              <Link href={`/${locale}/u/${profile.username}/followers` as Route}>
                <strong>{followerCount}</strong> {social.counts.followers}
              </Link>
              <Link href={`/${locale}/u/${profile.username}/following` as Route}>
                <strong>{followingCount}</strong> {social.counts.following}
              </Link>
            </div>
            <RelationshipActions
              locale={locale}
              targetUserId={profile.id}
              relationship={relationship}
            />
          </Stack>
        </Card>
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
      </Container>
    </main>
  );
}
