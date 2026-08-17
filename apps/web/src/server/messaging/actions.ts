"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { getConversation } from "@/server/messaging/queries";
import { createSupabaseServerClient } from "@/server/supabase/client";

const usernameSchema = z.object({ username: z.string().trim().min(3).max(32) });
const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  mediaAssetId: z.string().uuid().optional().nullable(),
});

export type MessagingActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "unavailable" | "unauthenticated" | "invalid" | "forbidden" | "not_found" | "error";
    };

function errorCode(error: {
  code?: string;
}): Extract<MessagingActionResult, { ok: false }>["code"] {
  if (error.code === "42501") return "forbidden";
  if (error.code === "23503") return "not_found";
  if (error.code === "22023") return "invalid";
  return "error";
}

export async function startConversation(
  input: unknown,
): Promise<MessagingActionResult<{ id: string }>> {
  const parsed = usernameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", parsed.data.username.toLowerCase())
      .is("deleted_at", null)
      .maybeSingle();
    if (profileError) return { ok: false, code: errorCode(profileError) };
    if (!profile || String(profile.id) === user.id) return { ok: false, code: "not_found" };
    const { data, error } = await supabase.rpc("create_direct_conversation", {
      target_user_id: String(profile.id),
    });
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: { id: String(data) } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function sendDirectMessage(
  input: unknown,
): Promise<MessagingActionResult<{ id: string }>> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const conversation = await getConversation(parsed.data.conversationId);
    if (conversation.status !== "ok" || !conversation.data)
      return {
        ok: false,
        code: conversation.status === "unauthenticated" ? "unauthenticated" : "forbidden",
      };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: parsed.data.conversationId,
        sender_id: user.id,
        body: parsed.data.body,
        media_asset_id: parsed.data.mediaAssetId ?? null,
      })
      .select("id")
      .single();
    return error
      ? { ok: false, code: errorCode(error) }
      : { ok: true, data: { id: String(data.id) } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function loadConversation(conversationId: string) {
  return getConversation(conversationId);
}

export async function markNotificationRead(notificationId: string): Promise<MessagingActionResult> {
  const parsed = z.string().uuid().safeParse(notificationId);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", parsed.data);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function markAllNotificationsRead(): Promise<MessagingActionResult> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

const conversationIdSchema = z.object({ conversationId: z.string().uuid() });

export async function markConversationRead(input: unknown): Promise<MessagingActionResult> {
  const parsed = conversationIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", parsed.data.conversationId)
      .eq("user_id", user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function setConversationMuted(input: unknown): Promise<MessagingActionResult> {
  const parsed = z
    .object({ conversationId: z.string().uuid(), muted: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("conversation_members")
      .update({
        muted_at: parsed.data.muted ? new Date().toISOString() : null,
      })
      .eq("conversation_id", parsed.data.conversationId)
      .eq("user_id", user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function leaveConversation(input: unknown): Promise<MessagingActionResult> {
  const parsed = conversationIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", parsed.data.conversationId)
      .eq("user_id", user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteDirectMessage(input: unknown): Promise<MessagingActionResult> {
  const parsed = z.object({ messageId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.messageId)
      .eq("sender_id", user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}
