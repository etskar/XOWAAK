"use server";

import { getUnifiedFeed } from "@/server/feed/queries";
import { decodeFeedCursor, encodeFeedCursor } from "@/server/feed/types";
import type { FeedCursor } from "@/server/feed/types";

export type LoadMoreFeedResult =
  | { status: "ok"; items: import("@/server/feed/types").FeedItem[]; nextCursor: string | null; hasMore: boolean }
  | { status: "unavailable" }
  | { status: "error" };

export async function loadMoreFeed(cursorValue: string | null): Promise<LoadMoreFeedResult> {
  const result = await getUnifiedFeed(decodeFeedCursor(cursorValue));

  if (result.status !== "ok") {
    return { status: result.status };
  }

  const nextCursor: FeedCursor | null = result.data.nextCursor;
  return {
    status: "ok",
    items: result.data.items,
    nextCursor: nextCursor ? encodeFeedCursor(nextCursor) : null,
    hasMore: result.data.hasMore,
  };
}