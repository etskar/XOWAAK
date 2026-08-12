export type PostVisibility = "public" | "followers" | "private";
export type PostStatus = "draft" | "published" | "deleted";

export type PostMedia = {
  id: string;
  mediaAssetId: string;
  mediaType: "image" | "video";
  position: number;
  url?: string | null;
};

export type PostEngagement = import("@/server/posts/engagement").PostEngagement;

export type PostAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarMediaId: string | null;
};

export type PostRecord = {
  id: string;
  authorId: string;
  content: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: PostAuthor;
  media: PostMedia[];
  engagement?: PostEngagement;
};

export type PostCursor = {
  createdAt: string;
  id: string;
};

export type PostListResult = {
  items: PostRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PostQueryResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; data: null }
  | { status: "error"; data: null };

export type PostActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "unauthenticated" | "invalid" | "conflict" | "unavailable" | "forbidden" | "error";
    };
