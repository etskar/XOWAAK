export type ConversationSummary = {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mediaUrl: string | null;
};

export type ConversationDetail = {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  messages: MessageRecord[];
};

export type NotificationRecord = {
  id: string;
  actorId: string | null;
  kind: string;
  title: string;
  body: string | null;
  targetPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export type MessagingResult<T> =
  { status: "ok"; data: T } | { status: "unavailable" | "unauthenticated" | "error"; data: null };
