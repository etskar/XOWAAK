import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createTranslator } from "@/i18n/translate";
import { Container } from "@/design-system";
import { getCurrentUser } from "@/server/auth/session";
import { PostCard } from "@/features/posts/post-card";
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
  const { t } = createTranslator(locale);

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
          <Link href={`/${locale}/home` as Route}>{t("common.backToHome")}</Link>
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
    </main>
  );
}
