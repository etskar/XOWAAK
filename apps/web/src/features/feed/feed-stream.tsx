"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";

import { Button, Card } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { PostCard } from "@/features/posts/post-card";
import { PlatformFeedCard, type FeedPlatformKind } from "@/features/feed/feed-cards";
import { loadMoreFeed } from "@/server/feed/actions";
import type { FeedItem } from "@/server/feed/types";

type FeedStreamProps = {
  locale: Locale;
  viewerId: string;
  initialItems: FeedItem[];
  initialCursor: string | null;
  hasMore: boolean;
};

export function FeedStream({
  locale,
  viewerId,
  initialItems,
  initialCursor,
  hasMore: initialHasMore,
}: FeedStreamProps) {
  const app = getAppMessages(locale);
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(() => {
      void loadMoreFeed(cursor).then((result) => {
        if (result.status !== "ok") {
          setStatus(app.feedEmptyDescription);
          return;
        }
        setItems((current) => [...current, ...result.items]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      });
    });
  }

  if (items.length === 0 && !hasMore) {
    return (
      <Card className="feed-empty">
        <span className="feed-empty__mark" aria-hidden="true">
          X
        </span>
        <p className="feed-empty__title">{app.feedEmpty}</p>
        <p className="feed-empty__description">{app.feedEmptyDescription}</p>
        <Link href={`/${locale}/search` as Route} className="feed-empty__action">
          {app.searchTitle}
        </Link>
      </Card>
    );
  }

  return (
    <div className="feed-stream">
      <div className="feed-stream__list">
        {items.map((entry) => {
          if (entry.kind === "post") {
            return (
              <PostCard
                key={`post-${entry.item.id}`}
                locale={locale}
                post={entry.item}
                isOwner={entry.item.authorId === viewerId}
                showComments={false}
              />
            );
          }
          return (
            <PlatformFeedCard
              key={`${entry.kind}-${entry.item.id}`}
              kind={entry.kind as FeedPlatformKind}
              item={entry.item}
              locale={locale}
            />
          );
        })}
      </div>
      {hasMore && (
        <div className="feed-stream__more">
          <Button type="button" loading={isPending} isDisabled={isPending} onPress={loadMore}>
            {app.loadMore}
          </Button>
        </div>
      )}
      {status && (
        <p className="feed-stream__status" role="alert">
          {status}
        </p>
      )}
    </div>
  );
}