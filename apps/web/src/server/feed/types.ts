import type { JobRecord, ProductRecord, ServiceRecord } from "@/server/platform/types";
import type { PostRecord } from "@/server/posts/types";

export type FeedItem =
  | { kind: "post"; item: PostRecord }
  | { kind: "product"; item: ProductRecord }
  | { kind: "service"; item: ServiceRecord }
  | { kind: "job"; item: JobRecord };

export type FeedCursor = {
  post: number;
  product: number;
  service: number;
  job: number;
};

export type FeedListResult = {
  items: FeedItem[];
  nextCursor: FeedCursor | null;
  hasMore: boolean;
};

export type FeedQueryResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; data: null }
  | { status: "error"; data: null };

export function decodeFeedCursor(value: string | null | undefined): FeedCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<
      Record<keyof FeedCursor, unknown>
    >;
    const cursor: FeedCursor = {
      post: Math.max(0, Number(parsed.post) || 0),
      product: Math.max(0, Number(parsed.product) || 0),
      service: Math.max(0, Number(parsed.service) || 0),
      job: Math.max(0, Number(parsed.job) || 0),
    };
    return cursor;
  } catch {
    return null;
  }
}

export function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}