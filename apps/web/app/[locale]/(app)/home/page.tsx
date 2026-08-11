import { RoutePlaceholder } from "@/components/route-placeholder";
import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { createTranslator } from "@/i18n/translate";
import { requireCurrentUser } from "@/server/auth/session";
import { FeedView } from "@/features/posts/feed-view";
import { getFeed } from "@/server/posts/queries";
import { getPostsMessages } from "@/i18n/posts-messages";

export const dynamic = "force-dynamic";

type HomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);
  const posts = getPostsMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return (
      <RoutePlaceholder
        locale={locale}
        title={t("navigation.home")}
        description={posts.pages.unavailable}
      />
    );
  }

  const user = await requireCurrentUser(locale);
  const query = searchParams ? await searchParams : {};
  const cursorValue = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const feed = await getFeed(cursorValue, 20);
  const result =
    feed.status === "unauthenticated" ? { status: "error" as const, data: null } : feed;

  return <FeedView locale={locale} viewerId={user.id} result={result} />;
}
