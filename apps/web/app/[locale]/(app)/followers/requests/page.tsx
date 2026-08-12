import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getSocialMessages } from "@/i18n/social-messages";
import { getCurrentUser } from "@/server/auth/session";
import { getPendingFollowRequests } from "@/server/social/queries";
import { SocialUserList } from "@/features/social/social-user-list";
import { Badge, Container } from "@/design-system";
import { createTranslator } from "@/i18n/translate";

export const dynamic = "force-dynamic";

type RequestsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FollowRequestsPage({ params }: RequestsPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const social = getSocialMessages(locale);
  const { t } = createTranslator(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <main className="product-state-page">
        <Container size="md">
          <Badge variant="warning">{t("common.configurationTitle")}</Badge>
          <h1>{social.pages.requests}</h1>
          <p>{social.pages.unavailable}</p>
        </Container>
      </main>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/followers/requests`);
  const items = await getPendingFollowRequests(user.id, user.id);

  return (
    <main className="social-list-page" data-locale={locale}>
      <Container size="md">
        <div className="social-list-page__topline">
          <Link href={`/${locale}/home` as Route}>{t("common.backToHome")}</Link>
          <Badge variant="primary">{social.pages.requests}</Badge>
        </div>
        <div className="social-list-page__header">
          <p className="showcase-eyebrow">{t("navigation.followRequests")}</p>
          <h1 className="ds-text-h2">{social.pages.requests}</h1>
          <p>{social.pages.noRequests}</p>
        </div>
        <SocialUserList
          locale={locale}
          items={items}
          emptyTitle={social.pages.noRequests}
          emptyDescription={social.pages.requests}
        />
      </Container>
    </main>
  );
}
