import Link from "next/link";
import type { Route } from "next";

import { EmptyState, ErrorState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { PostCard } from "@/features/posts/post-card";
import type { PostListResult } from "@/server/posts/types";

type PostListProps = {
  locale: Locale;
  result: PostListResult | null;
  viewerId: string | null;
  error?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  paginationPath?: string;
};

export function PostList({
  locale,
  result,
  viewerId,
  error = false,
  emptyTitle,
  emptyDescription,
  paginationPath,
}: PostListProps) {
  const messages = getPostsMessages(locale);

  if (error) {
    return <ErrorState title={messages.pages.failed} description={messages.pages.unavailable} />;
  }

  if (!result || result.items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? messages.pages.noPosts}
        description={emptyDescription ?? messages.pages.noPosts}
      />
    );
  }

  return (
    <div className="post-list">
      {result.items.map((post) => (
        <PostCard key={post.id} locale={locale} post={post} isOwner={viewerId === post.authorId} />
      ))}
      {result.nextCursor && (
        <Link
          className="post-load-more"
          href={
            `${paginationPath ?? `/${locale}/home`}?cursor=${encodeURIComponent(result.nextCursor)}` as Route
          }
        >
          {messages.pages.loadMore}
        </Link>
      )}
    </div>
  );
}
