"use server";

import { hasSupabasePublicEnv } from "@/config/public-env";
import {
  isPostPublishable,
  postIdSchema,
  postSchema,
  updatePostSchema,
} from "@/domains/posts/validation";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type { PostActionResult } from "@/server/posts/types";

function mapPostError(error: { code?: string }) {
  if (error.code === "23514" || error.code === "22001") return "invalid" as const;
  if (error.code === "42501") return "forbidden" as const;
  if (error.code === "23505") return "conflict" as const;
  return "error" as const;
}

export async function createPost(input: unknown): Promise<PostActionResult<{ id: string }>> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (
    parsed.data.status === "published" &&
    !isPostPublishable(parsed.data.content, parsed.data.mediaAssetIds)
  ) {
    return { ok: false, code: "invalid" };
  }
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("create_post", {
      new_content: parsed.data.content || null,
      new_visibility: parsed.data.visibility,
      new_status: parsed.data.status,
      new_media_asset_ids: parsed.data.mediaAssetIds,
    });
    if (error) return { ok: false, code: mapPostError(error) };
    return { ok: true, data: { id: String(data) } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updatePost(input: unknown): Promise<PostActionResult<{ id: string }>> {
  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .update({ content: parsed.data.content, visibility: parsed.data.visibility })
      .eq("id", parsed.data.id)
      .eq("author_id", user.id)
      .eq("status", "published")
      .select("id, author_id, content, visibility, status, created_at, updated_at, deleted_at")
      .single();
    if (error) return { ok: false, code: mapPostError(error) };
    return { ok: true, data: { id: String(data.id) } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deletePost(input: unknown): Promise<PostActionResult> {
  const parsed = postIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("posts")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("author_id", user.id)
      .neq("status", "deleted");
    if (error) return { ok: false, code: mapPostError(error) };
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}
