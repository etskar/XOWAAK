"use server";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfile } from "@/server/identity/queries";
import { createSupabaseServerClient } from "@/server/supabase/client";
import {
  groupSchema,
  jobSchema,
  productSchema,
  serviceSchema,
} from "@/domains/platform/validation";
import { z } from "zod";

export type PlatformErrorCode =
  | "unavailable"
  | "unauthenticated"
  | "profile_incomplete"
  | "validation"
  | "forbidden"
  | "conflict"
  | "error";
export type PlatformActionResult =
  { ok: true; id: string } | { ok: false; code: PlatformErrorCode };

async function requirePlatformCreator() {
  if (!hasSupabasePublicEnv()) return { user: null, code: "unavailable" as const };
  const user = await getCurrentUser();
  if (!user) return { user: null, code: "unauthenticated" as const };
  const profile = await getOwnProfile().catch(() => null);
  if (!profile?.username || !profile.display_name.trim())
    return { user: null, code: "profile_incomplete" as const };
  return { user, code: null };
}

function errorCode(error: { code?: string }): PlatformErrorCode {
  if (error.code === "23505") return "conflict";
  if (error.code === "42501") return "forbidden";
  return "error";
}

export async function createProduct(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        owner_user_id: creator.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        price: parsed.data.price ?? null,
        currency: parsed.data.currency,
        location_label: parsed.data.locationLabel || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        image_media_asset_id: parsed.data.imageMediaAssetId ?? null,
        status: "published",
      })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function createService(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        provider_user_id: creator.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        price: parsed.data.price ?? null,
        currency: parsed.data.currency,
        location_label: parsed.data.locationLabel || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        image_media_asset_id: parsed.data.imageMediaAssetId ?? null,
        status: "published",
      })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function createJob(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        owner_user_id: creator.user.id,
        title: parsed.data.title,
        employer_name: parsed.data.employerName || null,
        description: parsed.data.description || null,
        requirements: parsed.data.requirements || null,
        job_type: parsed.data.jobType ?? null,
        salary_min: parsed.data.salaryMin ?? null,
        salary_max: parsed.data.salaryMax ?? null,
        currency: parsed.data.currency,
        location_label: parsed.data.locationLabel || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        image_media_asset_id: parsed.data.imageMediaAssetId ?? null,
        status: "published",
      })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function createGroup(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("groups")
      .insert({
        owner_user_id: creator.user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        visibility: parsed.data.visibility,
        image_media_asset_id: parsed.data.imageMediaAssetId ?? null,
        status: "active",
      })
      .select("id")
      .single();
    if (error) return { ok: false, code: errorCode(error) };
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: data.id, user_id: creator.user.id, role: "owner", status: "active" });
    return memberError
      ? { ok: false, code: errorCode(memberError) }
      : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function sendGroupMessage(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z
    .object({ groupId: z.string().uuid(), body: z.string().trim().min(1).max(5000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("group_messages")
      .insert({ group_id: parsed.data.groupId, sender_id: creator.user.id, body: parsed.data.body })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function toggleFavorite(
  input: unknown,
): Promise<{ ok: true; active: boolean } | { ok: false; code: PlatformErrorCode }> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  const parsed = z
    .object({
      targetType: z.enum(["post", "product", "service", "job", "group"]),
      targetId: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: selectError } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("target_type", parsed.data.targetType)
      .eq("target_id", parsed.data.targetId)
      .maybeSingle();
    if (selectError) return { ok: false, code: errorCode(selectError) };
    if (existing) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", parsed.data.targetType)
        .eq("target_id", parsed.data.targetId);
      return error ? { ok: false, code: errorCode(error) } : { ok: true, active: false };
    }
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
    });
    return error ? { ok: false, code: errorCode(error) } : { ok: true, active: true };
  } catch {
    return { ok: false, code: "error" };
  }
}
