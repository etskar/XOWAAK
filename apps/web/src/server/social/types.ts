export type RelationshipState =
  | "none"
  | "following"
  | "followed_by"
  | "mutual"
  | "pending_outgoing"
  | "pending_incoming"
  | "blocked"
  | "blocked_by";

export type Relationship = {
  state: RelationshipState;
  followId: string | null;
};

export type SocialUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarMediaId: string | null;
  avatarUrl: string | null;
  visibility: "public" | "private";
  relationship: Relationship | null;
};

export type SocialListResult = {
  items: SocialUser[];
  page: number;
  limit: number;
  hasMore: boolean;
};

export type SocialActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; code: SocialErrorCode };

export type SocialErrorCode =
  "unauthenticated" | "invalid" | "blocked" | "forbidden" | "conflict" | "unavailable" | "error";
