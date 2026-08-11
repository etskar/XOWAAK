import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { ProfileView } from "@/features/profile/profile-view";
import { getCurrentUser } from "@/server/auth/session";
import { getProfileByUsername } from "@/server/identity/queries";
import { getFollowerCount, getFollowingCount, getRelationship } from "@/server/social/queries";
import { getUserPosts } from "@/server/posts/queries";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: Promise<{ locale: string; username: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const { locale: localeParam, username } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <RoutePlaceholder
        locale={locale}
        title={messages.profile.publicTitle}
        description={messages.profile.unavailable}
      />
    );
  }

  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const query = searchParams ? await searchParams : {};
  const cursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const [relationship, followerCount, followingCount, posts] = await Promise.all([
    viewer ? getRelationship(viewer.id, profile.id) : Promise.resolve(null),
    getFollowerCount(profile.id),
    getFollowingCount(profile.id),
    getUserPosts(profile.id, cursor, 20),
  ]);

  return (
    <ProfileView
      locale={locale}
      profile={profile}
      relationship={relationship}
      followerCount={followerCount}
      followingCount={followingCount}
      viewerId={viewer?.id ?? null}
      posts={posts}
      postsPaginationPath={`/${locale}/u/${profile.username}`}
    />
  );
}
