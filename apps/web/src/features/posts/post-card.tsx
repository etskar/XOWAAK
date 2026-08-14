import Link from "next/link";
import type { Route } from "next";

import { Avatar, Badge, Card, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { formatDateTime } from "@/i18n/format";
import { getPostsMessages } from "@/i18n/posts-messages";
import { PostActions } from "@/features/posts/post-actions";
import { PostEngagement } from "@/features/posts/post-engagement";
import { PostMedia } from "@/features/posts/post-media";
import type { PostRecord } from "@/server/posts/types";

type PostCardProps = {
  locale: Locale;
  post: PostRecord;
  isOwner: boolean;
  showComments?: boolean;
  isAuthenticated?: boolean;
};

export function PostCard({
  locale,
  post,
  isOwner,
  showComments = true,
  isAuthenticated = true,
}: PostCardProps) {
  const messages = getPostsMessages(locale);
  const visibilityLabel = {
    public: messages.composer.public,
    followers: messages.composer.followers,
    private: messages.composer.private,
  }[post.visibility];

  return (
    <Card as="article" className="post-card" aria-labelledby={`post-${post.id}`}>
      <Stack gap={4}>
        <header className="post-card__header">
          <Link
            href={`/${locale}/u/${post.author.username}` as Route}
            className="post-card__author"
          >
            <Avatar name={post.author.displayName} size="md" />
            <span>
              <strong dir="auto">{post.author.displayName}</strong>
              <span dir="ltr">@{post.author.username}</span>
            </span>
          </Link>
          <div className="post-card__meta">
            <time dateTime={post.createdAt}>{formatDateTime(post.createdAt, locale)}</time>
            <Badge variant="neutral">{visibilityLabel}</Badge>
          </div>
        </header>
        {post.content && (
          <p id={`post-${post.id}`} className="post-card__content" dir="auto">
            {post.content}
          </p>
        )}
        <PostMedia locale={locale} media={post.media} />
        <PostEngagement
          locale={locale}
          postId={post.id}
          initial={post.engagement}
          showComments={showComments}
          isAuthenticated={isAuthenticated}
        />
        <div className="post-card__footer">
          <Link href={`/${locale}/posts/${post.id}` as Route}>{messages.card.viewPost}</Link>
          <PostActions locale={locale} post={post} isOwner={isOwner} />
        </div>
      </Stack>
    </Card>
  );
}
