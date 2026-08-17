import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getPostsMessages } from "@/i18n/posts-messages";
import { Container } from "@/design-system";
import { getCurrentUser } from "@/server/auth/session";
import { PostCard } from "@/features/posts/post-card";
import { BackLink } from "@/features/navigation/back-link";
import { AppNavigation } from "@/features/navigation/app-navigation";
import { getPost } from "@/server/posts/queries";

export const dynamic = "force-dynamic";

type PostDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const messages = getPostsMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <RoutePlaceholder
        locale={locale}
        title={messages.pages.detail}
        description={messages.pages.unavailable}
      />
    );
  }

  const result = await getPost(id);
  if (result.status === "unavailable" || result.status === "error") {
    return (
      <RoutePlaceholder
        locale={locale}
        title={messages.pages.detail}
        description={messages.pages.failed}
      />
    );
  }
  if (!result.data) notFound();

  const user = await getCurrentUser();
  return (
    <main className="feed-page post-detail-page" data-locale={locale}>
      <Container size="md">
        <div className="post-detail-page__topline">
          <BackLink locale={locale} fallback={`/${locale}/home`} />
          <h1 className="showcase-eyebrow post-detail-page__title">{messages.pages.detail}</h1>
        </div>
        <div className="post-list">
          <PostCard
            locale={locale}
            post={result.data}
            isOwner={user?.id === result.data.authorId}
            isAuthenticated={user !== null}
          />
        </div>
      </Container>
      {user && <AppNavigation locale={locale} />}
    </main>
  );
}
