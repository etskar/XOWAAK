import { z } from "zod";

export const postContentMaximumLength = 5000;

export const postSchema = z.object({
  content: z.string().trim().max(postContentMaximumLength),
  visibility: z.enum(["public", "followers", "private"]),
  status: z.enum(["draft", "published"]).default("published"),
  mediaAssetIds: z.array(z.string().uuid()).max(10).default([]),
});

export const updatePostSchema = z.object({
  id: z.string().uuid(),
  content: z.string().trim().min(1).max(postContentMaximumLength),
  visibility: z.enum(["public", "followers", "private"]),
});

export const postIdSchema = z.object({ id: z.string().uuid() });

export function isPostPublishable(content: string, mediaAssetIds: string[]) {
  return Boolean(content.trim()) || mediaAssetIds.length > 0;
}
