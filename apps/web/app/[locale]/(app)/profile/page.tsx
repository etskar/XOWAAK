import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { requireCurrentUser } from "@/server/auth/session";
import { getOwnProfile } from "@/server/identity/queries";
import { getFollowerCount, getFollowingCount } from "@/server/social/queries";
import { getUserPosts } from "@/server/posts/queries";
import { getProfilePlatformRecords } from "@/server/platform/queries";
import { ProfileView } from "@/features/profile/profile-view";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const user = await requireCurrentUser(locale);
  const profile = await getOwnProfile();

  if (!profile) {
    redirect(`/${locale}/settings/profile`);
  }

  const [followerCount, followingCount, posts, platform] = await Promise.all([
    getFollowerCount(profile.id),
    getFollowingCount(profile.id),
    getUserPosts(profile.id, null, 20),
    getProfilePlatformRecords(profile.id),
  ]);

  return (
    <ProfileView
      locale={locale}
      profile={profile}
      relationship={null}
      followerCount={followerCount}
      followingCount={followingCount}
      viewerId={user.id}
      posts={posts}
      postsPaginationPath={`/${locale}/profile`}
      platform={platform}
      isOwnProfile
    />
  );
}