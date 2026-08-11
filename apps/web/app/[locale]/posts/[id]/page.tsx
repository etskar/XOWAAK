import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/route-placeholder";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getPostsMessages } from "@/i18n/posts-messages";
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
    <main className="feed-page" data-locale={locale}>
      <div className="post-list">
        <PostCard locale={locale} post={result.data} isOwner={user?.id === result.data.authorId} />
      </div>
    </main>
  );
}
