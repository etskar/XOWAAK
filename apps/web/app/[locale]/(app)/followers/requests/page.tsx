import { notFound, redirect } from "next/navigation";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getSocialMessages } from "@/i18n/social-messages";
import { getCurrentUser } from "@/server/auth/session";
import { getPendingFollowRequests } from "@/server/social/queries";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";
import { SocialUserList } from "@/features/social/social-user-list";

export const dynamic = "force-dynamic";

type RequestsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FollowRequestsPage({ params }: RequestsPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const social = getSocialMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <RoutePlaceholder
        locale={locale}
        title={social.pages.requests}
        description={social.pages.unavailable}
      />
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/followers/requests`);
  const items = await getPendingFollowRequests(user.id, user.id);

  return (
    <main className="social-list-page" data-locale={locale}>
      <LocaleSwitcher locale={locale} />
      <div className="social-list-page__header">
        <h1 className="ds-text-h3">{social.pages.requests}</h1>
      </div>
      <SocialUserList
        locale={locale}
        items={items}
        emptyTitle={social.pages.noRequests}
        emptyDescription={social.pages.requests}
      />
    </main>
  );
}
