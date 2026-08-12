import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { getMediaSignedUrls } from "@/server/media/urls";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type {
  ConversationDetail,
  ConversationSummary,
  MessagingResult,
  MessageRecord,
  NotificationRecord,
} from "@/server/messaging/types";

type ProfileRow = Record<string, unknown>;

function profileName(profile: ProfileRow | undefined) {
  return {
    username: String(profile?.username ?? "unknown"),
    displayName: String(profile?.display_name || profile?.username || "XOWAAK user"),
  };
}

export async function getConversations(): Promise<MessagingResult<ConversationSummary[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  const user = await getCurrentUser();
  if (!user) return { status: "unauthenticated", data: null };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: ownMembers, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    if (memberError) return { status: "error", data: null };
    const conversationIds = (ownMembers ?? []).map((row) => String(row.conversation_id));
    if (conversationIds.length === 0) return { status: "ok", data: [] };

    const [{ data: members, error: membersError }, { data: messages, error: messagesError }] =
      await Promise.all([
        supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds)
          .neq("user_id", user.id),
        supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", conversationIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
    if (membersError || messagesError) return { status: "error", data: null };

    const otherUserIds = [...new Set((members ?? []).map((row) => String(row.user_id)))];
    const { data: profiles } = otherUserIds.length
      ? await supabase.from("profiles").select("id, username, display_name").in("id", otherUserIds)
      : { data: [] };
    const profileById = new Map(
      (profiles ?? []).map((profile) => [String(profile.id), profile as ProfileRow]),
    );
    const lastByConversation = new Map<string, Record<string, unknown>>();
    for (const message of messages ?? []) {
      const conversationId = String(message.conversation_id);
      if (!lastByConversation.has(conversationId)) lastByConversation.set(conversationId, message);
    }

    return {
      status: "ok",
      data: conversationIds.flatMap((id) => {
        const other = (members ?? []).find((row) => String(row.conversation_id) === id);
        if (!other) return [];
        const profile = profileName(profileById.get(String(other.user_id)));
        const last = lastByConversation.get(id);
        return [
          {
            id,
            otherUserId: String(other.user_id),
            otherUsername: profile.username,
            otherDisplayName: profile.displayName,
            lastMessage: last?.body ? String(last.body) : null,
            lastMessageAt: last?.created_at ? String(last.created_at) : null,
          },
        ];
      }),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getConversation(
  conversationId: string,
): Promise<MessagingResult<ConversationDetail | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  const user = await getCurrentUser();
  if (!user) return { status: "unauthenticated", data: null };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: members, error: memberError } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId);
    if (memberError) return { status: "error", data: null };
    if (!(members ?? []).some((row) => String(row.user_id) === user.id))
      return { status: "ok", data: null };
    const other = (members ?? []).find((row) => String(row.user_id) !== user.id);
    if (!other) return { status: "ok", data: null };

    const [{ data: profile }, { data: messages, error: messageError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", String(other.user_id))
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at, media_asset_id")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(100),
    ]);
    if (messageError) return { status: "error", data: null };
    const rows = (messages ?? []) as Array<Record<string, unknown>>;
    const mediaUrls = await getMediaSignedUrls(
      rows.flatMap((row) => (row.media_asset_id ? [String(row.media_asset_id)] : [])),
    );
    const name = profileName(profile as ProfileRow | undefined);
    const result: MessageRecord[] = rows.map((row) => ({
      id: String(row.id),
      conversationId: String(row.conversation_id),
      senderId: String(row.sender_id),
      body: String(row.body),
      createdAt: String(row.created_at),
      mediaUrl: row.media_asset_id ? (mediaUrls.get(String(row.media_asset_id)) ?? null) : null,
    }));
    return {
      status: "ok",
      data: {
        id: conversationId,
        otherUserId: String(other.user_id),
        otherUsername: name.username,
        otherDisplayName: name.displayName,
        messages: result,
      },
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getNotifications(limit = 50): Promise<MessagingResult<NotificationRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  const user = await getCurrentUser();
  if (!user) return { status: "unauthenticated", data: null };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, actor_id, kind, title, body, target_path, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { status: "error", data: null };
    return {
      status: "ok",
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        actorId: row.actor_id ? String(row.actor_id) : null,
        kind: String(row.kind),
        title: String(row.title),
        body: row.body ? String(row.body) : null,
        targetPath: row.target_path ? String(row.target_path) : null,
        readAt: row.read_at ? String(row.read_at) : null,
        createdAt: String(row.created_at),
      })),
    };
  } catch {
    return { status: "error", data: null };
  }
}
