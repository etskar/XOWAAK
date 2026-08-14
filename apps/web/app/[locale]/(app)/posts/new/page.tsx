import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { Badge, Card, Container } from "@/design-system";
import { isLocale, type Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { getPostsMessages } from "@/i18n/posts-messages";
import { requireCurrentUser } from "@/server/auth/session";
import { getOwnProfile } from "@/server/identity/queries";
import { PostComposer } from "@/features/posts/post-composer";

export const dynamic = "force-dynamic";

type NewPostPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewPostPage({ params }: NewPostPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getPostsMessages(locale);
  const app = getAppMessages(locale);

  await requireCurrentUser(locale);
  let profile = null;
  try {
    profile = await getOwnProfile();
  } catch {
    profile = null;
  }
  const profileComplete = Boolean(profile?.username && profile.display_name.trim());

  return (
    <main className="posts-new-page" data-locale={locale}>
      <Container size="md">
        <Link className="platform-back-link" href={`/${locale}/home` as Route}>
          ← {messages.pages.home}
        </Link>
        {profileComplete ? (
          <Card className="posts-new-page__card">
            <PostComposer
              locale={locale}
              unavailable={false}
              redirectTo={`/${locale}/home` as Route}
            />
          </Card>
        ) : (
          <Card className="feed-profile-gate">
            <Badge variant="warning">{app.completeProfileTitle}</Badge>
            <p>{app.completeProfileDescription}</p>
            <Link href={`/${locale}/settings/profile` as Route}>
              {app.completeProfileAction}
            </Link>
          </Card>
        )}
      </Container>
    </main>
  );
}