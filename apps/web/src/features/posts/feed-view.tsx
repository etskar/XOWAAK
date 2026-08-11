import { Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { PostComposer } from "@/features/posts/post-composer";
import { PostList } from "@/features/posts/post-list";
import type { PostListResult, PostQueryResult } from "@/server/posts/types";

type FeedViewProps = {
  locale: Locale;
  viewerId: string;
  result: PostQueryResult<PostListResult>;
};

export function FeedView({ locale, viewerId, result }: FeedViewProps) {
  const messages = getPostsMessages(locale);
  const unavailable = result.status === "unavailable";
  const queryError = result.status === "error";

  return (
    <main className="feed-page" data-locale={locale}>
      <Container size="md">
        <Stack gap={5}>
          <h1 className="ds-text-h3">{messages.pages.home}</h1>
          <PostComposer locale={locale} unavailable={unavailable} />
          <PostList
            locale={locale}
            result={result.status === "ok" ? result.data : null}
            viewerId={viewerId}
            error={queryError}
          />
          {unavailable && <Card>{messages.pages.unavailable}</Card>}
        </Stack>
      </Container>
    </main>
  );
}
