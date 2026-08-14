import Link from "next/link";
import type { Route } from "next";

import { Avatar, Badge, Card, Container } from "@/design-system";

import type { Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getAppMessages } from "@/i18n/app-messages";
import type { ProfileRecord } from "@/server/identity/types";
import { RelationshipActions } from "@/features/social/relationship-actions";
import { PostList } from "@/features/posts/post-list";
import { getSocialMessages } from "@/i18n/social-messages";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createTranslator } from "@/i18n/translate";
import type { Relationship } from "@/server/social/types";
import type { PostListResult, PostQueryResult } from "@/server/posts/types";
import type { PlatformResult, ProfilePlatformRecords } from "@/server/platform/types";

export type ProfileTab = "posts" | "products" | "services" | "jobs" | "groups";

export const PROFILE_TABS: ProfileTab[] = ["posts", "products", "services", "jobs", "groups"];

type ProfileViewProps = {
  locale: Locale;
  profile: ProfileRecord;
  relationship: Relationship | null;
  followerCount: number;
  followingCount: number;
  viewerId: string | null;
  posts: PostQueryResult<PostListResult> | null;
  postsPaginationPath: string;
  platform: PlatformResult<ProfilePlatformRecords>;
  isOwnProfile?: boolean;
  tab?: ProfileTab;
};

type PlatformEntry = {
  id: string;
  title: string;
  href: string;
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
  platform,
  isOwnProfile = false,
  tab = "posts",
}: ProfileViewProps) {
  const messages = getIdentityMessages(locale);
  const social = getSocialMessages(locale);
  const postsMessages = getPostsMessages(locale);
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);
  const displayName = profile.display_name || profile.username;

  const platformOk = platform.status === "ok" ? platform.data : null;
  const counts: Record<ProfileTab, number> = {
    posts: 0,
    products: platformOk?.products.length ?? 0,
    services: platformOk?.services.length ?? 0,
    jobs: platformOk?.jobs.length ?? 0,
    groups: platformOk?.groups.length ?? 0,
  };
  const tabLabel: Record<ProfileTab, string> = {
    posts: postsMessages.pages.home,
    products: t("navigation.products"),
    services: t("navigation.services"),
    jobs: t("navigation.jobs"),
    groups: t("navigation.groups"),
  };
  const tabHref: Record<ProfileTab, string> = {
    posts: `/${locale}/u/${profile.username}`,
    products: `/${locale}/u/${profile.username}?tab=products`,
    services: `/${locale}/u/${profile.username}?tab=services`,
    jobs: `/${locale}/u/${profile.username}?tab=jobs`,
    groups: `/${locale}/u/${profile.username}?tab=groups`,
  };

  const entries: Record<ProfileTab, PlatformEntry[]> = {
    posts: [],
    products:
      platformOk?.products.map((item) => ({
        id: item.id,
        title: item.title,
        href: `/${locale}/products/${item.id}`,
      })) ?? [],
    services:
      platformOk?.services.map((item) => ({
        id: item.id,
        title: item.title,
        href: `/${locale}/services/${item.id}`,
      })) ?? [],
    jobs:
      platformOk?.jobs.map((item) => ({
        id: item.id,
        title: item.title,
        href: `/${locale}/jobs/${item.id}`,
      })) ?? [],
    groups:
      platformOk?.groups.map((item) => ({
        id: item.id,
        title: item.name,
        href: `/${locale}/groups/${item.id}`,
      })) ?? [],
  };

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
          <div className="profile-cover" aria-hidden="true">
            {profile.cover_url && (
              // Signed URLs are generated on the server for visible profiles only.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.cover_url} alt="" />
            )}
          </div>
          <div className="profile-hero-card__body">
            <div className="profile-summary">
              <Avatar name={displayName} src={profile.avatar_url ?? undefined} size="lg" />
              <div className="profile-summary__identity">
                <h1 className="ds-text-h3" dir="auto">
                  {displayName}
                </h1>
                <p className="profile-summary__username" dir="ltr">
                  @{profile.username}
                </p>
              </div>
              <div className="profile-summary__actions">
                {isOwnProfile ? (
                  <>
                    <Link
                      className="showcase-button showcase-button--secondary"
                      href={`/${locale}/settings/profile` as Route}
                    >
                      {app.editProfile}
                    </Link>
                    <Link
                      className="showcase-button showcase-button--quiet"
                      href={`/${locale}/settings` as Route}
                    >
                      {t("navigation.settings")}
                    </Link>
                  </>
                ) : (
                  <RelationshipActions
                    locale={locale}
                    targetUserId={profile.id}
                    relationship={relationship}
                  />
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
          <div>
            <nav className="profile-tabs" aria-label={t("navigation.profile")}>
              {PROFILE_TABS.map((key) => {
                const count = counts[key];
                return (
                  <Link
                    key={key}
                    href={tabHref[key] as Route}
                    className={tab === key ? "is-active" : undefined}
                    aria-current={tab === key ? "page" : undefined}
                  >
                    {tabLabel[key]}
                    {count > 0 && <span className="profile-tabs__count">{count}</span>}
                  </Link>
                );
              })}
            </nav>
            <section className="profile-tab-panel" aria-label={tabLabel[tab]}>
              <div className="profile-section-heading">
                <p className="showcase-eyebrow">XOWAAK / {profile.username}</p>
                <h2 className="ds-text-h3">{tabLabel[tab]}</h2>
              </div>
              {tab === "posts" &&
                (posts ? (
                  <PostList
                    locale={locale}
                    result={posts.status === "ok" ? posts.data : null}
                    viewerId={viewerId}
                    error={posts.status === "error"}
                    emptyTitle={postsMessages.pages.noPosts}
                    emptyDescription={postsMessages.pages.noPosts}
                    paginationPath={postsPaginationPath}
                  />
                ) : null)}
              {tab !== "posts" && (
                <div className="profile-platform-grid">
                  {entries[tab].map((item) => (
                    <Link
                      key={`${tab}-${item.id}`}
                      href={item.href as Route}
                      className="profile-platform-card"
                    >
                      <span>{tabLabel[tab]}</span>
                      <strong>{item.title}</strong>
                    </Link>
                  ))}
                  {entries[tab].length === 0 && (
                    <p className="profile-tab-empty">{t("common.emptyState")}</p>
                  )}
                </div>
              )}
            </section>
          </div>
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