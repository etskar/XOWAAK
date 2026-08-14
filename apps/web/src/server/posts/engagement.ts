import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";

export type PostCommentRecord = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  body: string;
  createdAt: string;
};

export type PostEngagement = {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewerLiked: boolean;
  viewerShared: boolean;
  comments: PostCommentRecord[];
};

export async function getPostEngagement(postIds: string[]): Promise<Map<string, PostEngagement>> {
  const result = new Map<string, PostEngagement>();
  for (const postId of postIds) {
    result.set(postId, {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewerLiked: false,
      viewerShared: false,
      comments: [],
    });
  }
  if (!hasSupabasePublicEnv() || postIds.length === 0) return result;

  try {
    const supabase = await createSupabaseServerClient();
    const user = await getCurrentUser();
    const [{ data: likes }, { data: comments }, { data: shares }] = await Promise.all([
      supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
      supabase
        .from("post_comments")
        .select("id, post_id, author_id, body, created_at")
        .in("post_id", postIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(200),
      supabase.from("post_shares").select("post_id, user_id").in("post_id", postIds),
    ]);

    const commentRows = (comments ?? []) as Array<Record<string, unknown>>;
    const authorIds = [...new Set(commentRows.map((row) => String(row.author_id)))];
    const { data: profiles } = authorIds.length
      ? await supabase.from("profiles").select("id, display_name, username").in("id", authorIds)
      : { data: [] };
    const profileById = new Map(
      (profiles ?? []).map((profile) => [String(profile.id), profile as Record<string, unknown>]),
    );

    for (const row of likes ?? []) {
      const item = result.get(String(row.post_id));
      if (!item) continue;
      item.likeCount += 1;
      item.viewerLiked ||= user?.id === String(row.user_id);
    }
    for (const row of shares ?? []) {
      const item = result.get(String(row.post_id));
      if (!item) continue;
      item.shareCount += 1;
      item.viewerShared ||= user?.id === String(row.user_id);
    }
    for (const row of commentRows) {
      const item = result.get(String(row.post_id));
      if (!item) continue;
      const authorId = String(row.author_id);
      const profile = profileById.get(authorId);
      item.commentCount += 1;
      item.comments.push({
        id: String(row.id),
        authorId,
        authorName: String(profile?.display_name || profile?.username || "XOWAAK user"),
        authorUsername: profile?.username ? String(profile.username) : "",
        body: String(row.body),
        createdAt: String(row.created_at),
      });
    }
  } catch {
    // Engagement is optional hydration; the post itself remains renderable.
  }
  return result;
}
