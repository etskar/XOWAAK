"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type { SocialActionResult, SocialErrorCode } from "@/server/social/types";

const userIdSchema = z.object({ userId: z.string().uuid() });
const requestIdSchema = z.object({ requestId: z.string().uuid() });

function errorCode(error: { code?: string; message?: string }): SocialErrorCode {
  if (error.code === "23514") return "invalid";
  if (error.code === "23505") return "conflict";
  if (error.code === "42501") return "blocked";
  if (error.code === "23503") return "invalid";
  return "error";
}

async function currentUser() {
  if (!hasSupabasePublicEnv()) return { user: null, code: "unavailable" as const };
  const user = await getCurrentUser();
  return user ? { user, code: null } : { user: null, code: "unauthenticated" as const };
}

export async function followUser(
  input: unknown,
): Promise<SocialActionResult<{ status: "pending" | "accepted" }>> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_follow", {
      target_user_id: parsed.data.userId,
    });
    if (error) return { ok: false, code: errorCode(error) };
    return { ok: true, data: { status: data as "pending" | "accepted" } };
  } catch {
    return { ok: false, code: "error" };
  }
}

async function removeFollow(input: unknown): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", auth.user.id)
      .eq("following_id", parsed.data.userId);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export const unfollowUser = removeFollow;
export const cancelFollowRequest = removeFollow;

export async function acceptFollowRequest(input: unknown): Promise<SocialActionResult> {
  const parsed = requestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("follows")
      .update({ status: "accepted" })
      .eq("id", parsed.data.requestId)
      .eq("following_id", auth.user.id)
      .eq("status", "pending");
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function rejectFollowRequest(input: unknown): Promise<SocialActionResult> {
  const parsed = requestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", parsed.data.requestId)
      .eq("following_id", auth.user.id)
      .eq("status", "pending");
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function blockUser(input: unknown): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("create_block", { target_user_id: parsed.data.userId });
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function unblockUser(input: unknown): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const auth = await currentUser();
  if (!auth.user) return { ok: false, code: auth.code };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", auth.user.id)
      .eq("blocked_id", parsed.data.userId);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}
