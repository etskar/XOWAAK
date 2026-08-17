import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getSocialMessages } from "@/i18n/social-messages";
import { getCurrentUser } from "@/server/auth/session";
import { getProfileByUsername } from "@/server/identity/queries";
import { getFollowing } from "@/server/social/queries";
import { SocialListPage } from "@/features/social/social-user-list";
import { AppNavigation } from "@/features/navigation/app-navigation";

export const dynamic = "force-dynamic";

type FollowingPageProps = {
  params: Promise<{ locale: string; username: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pageValue(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 1;
}

export default async function FollowingPage({ params, searchParams }: FollowingPageProps) {
  const { locale: localeParam, username } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const social = getSocialMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <RoutePlaceholder
        locale={locale}
        title={social.pages.following}
        description={social.pages.unavailable}
      />
    );
  }

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();
  const viewer = await getCurrentUser();
  const query = searchParams ? await searchParams : {};
  const page = pageValue(query.page);
  const result = await getFollowing(profile.id, viewer?.id ?? null, page, 20);

  return (
    <>
      <SocialListPage
        locale={locale}
        items={result.items}
        emptyTitle={social.pages.noFollowing}
        emptyDescription={messages.profile.publicTitle}
        title={social.pages.following}
        description={messages.profile.publicTitle}
        profileUsername={profile.username}
        resource="following"
        page={result.page}
        hasMore={result.hasMore}
      />
      {viewer && <AppNavigation locale={locale} />}
    </>
  );
}
