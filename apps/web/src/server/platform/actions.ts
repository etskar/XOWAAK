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
  | "not_found"
  | "error";
export type PlatformActionResult =
  { ok: true; id: string } | { ok: false; code: PlatformErrorCode };

const groupIdSchema = z.object({ groupId: z.string().uuid() });

export async function joinGroup(input: unknown): Promise<PlatformActionResult> {
  const parsed = groupIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("join_group", {
      target_group_id: parsed.data.groupId,
    });
    return error
      ? { ok: false, code: errorCode(error) }
      : { ok: true, id: parsed.data.groupId };
  } catch {
    return { ok: false, code: "error" };
  }
}

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
        type: parsed.data.type,
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

async function updatePlatformRow(
  table: "products" | "services" | "jobs",
  id: string,
  ownerColumn: string,
  ownerId: string,
  values: Record<string, unknown>,
): Promise<PlatformActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .eq(ownerColumn, ownerId)
    .select("id")
    .single();
  return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
}

export async function updateProduct(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z
    .object({ id: z.string().uuid(), ...productSchema.shape })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    return await updatePlatformRow(
      "products",
      parsed.data.id,
      "owner_user_id",
      creator.user.id,
      {
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency,
      location_label: parsed.data.locationLabel || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      image_media_asset_id: parsed.data.imageMediaAssetId,
      status: "published",
    });
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateService(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z
    .object({ id: z.string().uuid(), ...serviceSchema.shape })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    return await updatePlatformRow(
      "services",
      parsed.data.id,
      "provider_user_id",
      creator.user.id,
      {
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency,
      location_label: parsed.data.locationLabel || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      image_media_asset_id: parsed.data.imageMediaAssetId,
      status: "published",
    });
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateJob(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ id: z.string().uuid(), ...jobSchema.shape }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    return await updatePlatformRow("jobs", parsed.data.id, "owner_user_id", creator.user.id, {
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
      image_media_asset_id: parsed.data.imageMediaAssetId,
      status: "published",
    });
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateGroup(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z
    .object({ id: z.string().uuid(), ...groupSchema.shape })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("groups")
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        visibility: parsed.data.visibility,
        image_media_asset_id: parsed.data.imageMediaAssetId,
        type: parsed.data.type,
      })
      .eq("id", parsed.data.id)
      .eq("owner_user_id", creator.user.id)
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteProduct(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("owner_user_id", creator.user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.id };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteService(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("services")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("provider_user_id", creator.user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.id };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteJob(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("jobs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("owner_user_id", creator.user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.id };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteGroup(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("groups")
      .update({ status: "archived" })
      .eq("id", parsed.data.id)
      .eq("owner_user_id", creator.user.id);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.id };
  } catch {
    return { ok: false, code: "error" };
  }
}

const roleSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

export async function setGroupMemberRole(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_user_id")
      .eq("id", parsed.data.groupId)
      .single();
    if (groupError) return { ok: false, code: errorCode(groupError) };
    if (String(group.owner_user_id) !== creator.user.id) return { ok: false, code: "forbidden" };
    const { error } = await supabase
      .from("group_members")
      .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
      .eq("group_id", parsed.data.groupId)
      .eq("user_id", parsed.data.userId)
      .neq("role", "owner");
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.groupId };
  } catch {
    return { ok: false, code: "error" };
  }
}

const memberSchema = z.object({ groupId: z.string().uuid(), userId: z.string().uuid() });

export async function removeGroupMember(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    if (parsed.data.userId === creator.user.id) {
      const { error } = await supabase
        .from("group_members")
        .update({ status: "left", updated_at: new Date().toISOString() })
        .eq("group_id", parsed.data.groupId)
        .eq("user_id", creator.user.id)
        .neq("role", "owner");
      return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.groupId };
    }
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("owner_user_id")
      .eq("id", parsed.data.groupId)
      .single();
    if (groupError) return { ok: false, code: errorCode(groupError) };
    const isOwner = String(group.owner_user_id) === creator.user.id;
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", parsed.data.groupId)
      .eq("user_id", parsed.data.userId)
      .maybeSingle();
    if (memberError) return { ok: false, code: errorCode(memberError) };
    if (!member) return { ok: false, code: "not_found" };
    if (member.role === "owner") return { ok: false, code: "forbidden" };
    if (!isOwner) return { ok: false, code: "forbidden" };
    const { error } = await supabase
      .from("group_members")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("group_id", parsed.data.groupId)
      .eq("user_id", parsed.data.userId);
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.groupId };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function deleteGroupMessage(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z.object({ messageId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("delete_group_message", {
      target_message_id: parsed.data.messageId,
    });
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: parsed.data.messageId };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function sendGroupMessage(input: unknown): Promise<PlatformActionResult> {
  const creator = await requirePlatformCreator();
  if (!creator.user) return { ok: false, code: creator.code ?? "error" };
  const parsed = z
    .object({
      groupId: z.string().uuid(),
      body: z.string().trim().min(1).max(5000),
      mediaAssetId: z.string().uuid().optional().nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", parsed.data.groupId)
      .eq("user_id", creator.user.id)
      .maybeSingle();
    if (membershipError) return { ok: false, code: errorCode(membershipError) };
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("type, owner_user_id, status")
      .eq("id", parsed.data.groupId)
      .single();
    if (groupError) return { ok: false, code: errorCode(groupError) };
    const isManager =
      String(group.owner_user_id) === creator.user.id ||
      (membership && ["owner", "admin"].includes(String(membership.role)));
    if (String(group.status) !== "active") return { ok: false, code: "not_found" };
    if (!membership || String(membership.status) !== "active") {
      return { ok: false, code: "forbidden" };
    }
    if (String(group.type) === "channel" && !isManager) {
      return { ok: false, code: "forbidden" };
    }
    const { data, error } = await supabase
      .from("group_messages")
      .insert({
        group_id: parsed.data.groupId,
        sender_id: creator.user.id,
        body: parsed.data.body,
        media_asset_id: parsed.data.mediaAssetId ?? null,
      })
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
