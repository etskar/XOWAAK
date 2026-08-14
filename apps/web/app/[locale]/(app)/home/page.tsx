import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { requireCurrentUser } from "@/server/auth/session";
import { getUnifiedFeed } from "@/server/feed/queries";
import { decodeFeedCursor } from "@/server/feed/types";
import { getOwnProfile } from "@/server/identity/queries";
import { FeedView } from "@/features/feed/feed-view";

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

  const user = await requireCurrentUser(locale);
  let profile = null;
  try {
    profile = await getOwnProfile();
  } catch {
    profile = null;
  }
  const profileComplete = Boolean(profile?.username && profile.display_name.trim());
  const query = searchParams ? await searchParams : {};
  const cursorValue = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const result = await getUnifiedFeed(decodeFeedCursor(cursorValue));

  return (
    <FeedView
      locale={locale}
      viewerId={user.id}
      result={result}
      profileComplete={profileComplete}
    />
  );
}