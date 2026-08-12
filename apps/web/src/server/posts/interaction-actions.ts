"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type { PostActionResult } from "@/server/posts/types";

const postIdInput = z.object({ postId: z.string().uuid() });
const commentInput = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

function mapError(error: { code?: string }): Extract<PostActionResult, { ok: false }>["code"] {
  if (error.code === "23505") return "conflict";
  if (error.code === "42501") return "forbidden";
  return "error";
}

export async function togglePostLike(
  input: unknown,
): Promise<PostActionResult<{ active: boolean }>> {
  const parsed = postIdInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: selectError } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", parsed.data.postId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (selectError) return { ok: false, code: mapError(selectError) };
    if (existing) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", parsed.data.postId)
        .eq("user_id", user.id);
      return error ? { ok: false, code: mapError(error) } : { ok: true, data: { active: false } };
    }
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: parsed.data.postId, user_id: user.id });
    return error ? { ok: false, code: mapError(error) } : { ok: true, data: { active: true } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function addPostComment(input: unknown): Promise<PostActionResult<{ id: string }>> {
  const parsed = commentInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: parsed.data.postId, author_id: user.id, body: parsed.data.body })
      .select("id")
      .single();
    return error
      ? { ok: false, code: mapError(error) }
      : { ok: true, data: { id: String(data.id) } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function togglePostShare(
  input: unknown,
): Promise<PostActionResult<{ active: boolean }>> {
  const parsed = postIdInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: selectError } = await supabase
      .from("post_shares")
      .select("post_id")
      .eq("post_id", parsed.data.postId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (selectError) return { ok: false, code: mapError(selectError) };
    if (existing) {
      const { error } = await supabase
        .from("post_shares")
        .delete()
        .eq("post_id", parsed.data.postId)
        .eq("user_id", user.id);
      return error ? { ok: false, code: mapError(error) } : { ok: true, data: { active: false } };
    }
    const { error } = await supabase
      .from("post_shares")
      .insert({ post_id: parsed.data.postId, user_id: user.id });
    return error ? { ok: false, code: mapError(error) } : { ok: true, data: { active: true } };
  } catch {
    return { ok: false, code: "error" };
  }
}
