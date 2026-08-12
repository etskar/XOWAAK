"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";

const inviteSchema = z.object({
  groupId: z.string().uuid(),
  username: z.string().trim().min(3).max(32),
});
const responseSchema = z.object({ groupId: z.string().uuid(), accept: z.boolean() });

export type GroupActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "unavailable" | "unauthenticated" | "invalid" | "forbidden" | "not_found" | "error";
    };

function mapError(error: { code?: string }): Extract<GroupActionResult, { ok: false }>["code"] {
  if (error.code === "42501") return "forbidden";
  if (error.code === "23503") return "not_found";
  if (error.code === "22023") return "invalid";
  return "error";
}

export async function inviteGroupMember(input: unknown): Promise<GroupActionResult> {
  const parsed = inviteSchema.safeParse(input);
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
    if (profileError) return { ok: false, code: mapError(profileError) };
    if (!profile || String(profile.id) === user.id) return { ok: false, code: "not_found" };
    const { error } = await supabase.rpc("create_group_invitation", {
      target_group_id: parsed.data.groupId,
      invited_user_id: String(profile.id),
    });
    return error ? { ok: false, code: mapError(error) } : { ok: true };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function respondToGroupInvitation(input: unknown): Promise<GroupActionResult> {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("group_members")
      .update({ status: parsed.data.accept ? "active" : "left" })
      .eq("group_id", parsed.data.groupId)
      .eq("user_id", user.id)
      .eq("status", "invited");
    return error ? { ok: false, code: mapError(error) } : { ok: true };
  } catch {
    return { ok: false, code: "error" };
  }
}
