"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";

const mediaInputSchema = z.object({
  bucket: z.enum(["avatars", "post-media", "message-media", "platform-media"]),
  objectPath: z.string().min(3).max(500),
  mimeType: z
    .string()
    .regex(/^[\w.+-]+\/[\w.+-]+$/)
    .max(255),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
});

export type MediaActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "unavailable" | "unauthenticated" | "invalid" | "forbidden" | "error" };

export async function registerMediaAsset(input: unknown): Promise<MediaActionResult> {
  const parsed = mediaInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  if (!parsed.data.objectPath.startsWith(`${user.id}/`)) return { ok: false, code: "forbidden" };

  const allowed =
    parsed.data.bucket === "avatars" || parsed.data.bucket === "platform-media"
      ? parsed.data.mimeType.startsWith("image/")
      : parsed.data.mimeType.startsWith("image/") || parsed.data.mimeType.startsWith("video/");
  if (!allowed) return { ok: false, code: "invalid" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        owner_user_id: user.id,
        bucket: parsed.data.bucket,
        object_path: parsed.data.objectPath,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.sizeBytes,
        status: "ready",
      })
      .select("id")
      .single();
    if (error) return { ok: false, code: error.code === "42501" ? "forbidden" : "error" };
    return { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function markMediaAssetsDeleted(input: unknown): Promise<MediaActionResult> {
  const parsed = z.array(z.string().uuid()).max(10).safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  if (parsed.data.length === 0) return { ok: true, id: "" };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("media_assets")
      .update({ status: "deleted" })
      .in("id", parsed.data)
      .eq("owner_user_id", user.id);
    return error ? { ok: false, code: "error" } : { ok: true, id: "" };
  } catch {
    return { ok: false, code: "error" };
  }
}
