"use server";

import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";

import { getIdentityMessages } from "@/i18n/identity-messages";
import { getIdentitySchemas } from "@/domains/identity/validation";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type {
  DeviceRecord,
  IdentityActionResult,
  ProfileRecord,
  UserSettingsRecord,
} from "@/server/identity/types";

const deviceCookieName = "xowaak_device_id";
const deviceCookieMaxAge = 60 * 60 * 24 * 365;
const profileSelect =
  "id, username, display_name, bio, avatar_media_id, location_label, visibility, locale, timezone, created_at, updated_at, deleted_at";

export async function updateProfile(input: unknown): Promise<IdentityActionResult<ProfileRecord>> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  const result = getIdentitySchemas(getIdentityMessages("en")).profile.safeParse(input);
  if (!result.success) {
    return { ok: false, code: "validation" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: result.data.username,
          display_name: result.data.displayName,
          bio: result.data.bio || null,
          location_label: result.data.locationLabel || null,
          avatar_media_id: result.data.avatarMediaId ?? null,
        },
        { onConflict: "id" },
      )
      .select(profileSelect)
      .single();

    if (error) {
      return { ok: false, code: error.code === "23505" ? "conflict" : "error" };
    }

    return { ok: true, data: data as ProfileRecord };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updatePrivacySettings(input: unknown): Promise<IdentityActionResult> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  const result = getIdentitySchemas(getIdentityMessages("en")).privacy.safeParse(input);
  if (!result.success) {
    return { ok: false, code: "validation" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("update_own_privacy_settings", {
      new_visibility: result.data.visibility,
      new_discoverability: result.data.discoverability,
      new_contact_privacy: result.data.contactPrivacy,
    });

    return error ? { ok: false, code: "error" } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateSettings(
  input: unknown,
): Promise<IdentityActionResult<UserSettingsRecord>> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  const result = getIdentitySchemas(getIdentityMessages("en")).settings.safeParse(input);
  if (!result.success) {
    return { ok: false, code: "validation" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          locale: result.data.locale,
          theme_preference: result.data.themePreference,
        },
        { onConflict: "user_id" },
      )
      .select(
        "user_id, theme_preference, locale, discoverability, contact_privacy, notification_preferences, privacy_preferences, created_at, updated_at",
      )
      .single();

    if (error) {
      return { ok: false, code: "error" };
    }

    return { ok: true, data: data as UserSettingsRecord };
  } catch {
    return { ok: false, code: "error" };
  }
}

function getPlatform(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (value.includes("android")) return "android" as const;
  if (value.includes("iphone") || value.includes("ipad")) return "ios" as const;
  if (value.includes("windows") || value.includes("macintosh") || value.includes("linux"))
    return "desktop" as const;
  return "web" as const;
}

export async function registerCurrentDevice(): Promise<IdentityActionResult<DeviceRecord>> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const currentId = cookieStore.get(deviceCookieName)?.value;
    const deviceId = currentId && /^[0-9a-f-]{36}$/i.test(currentId) ? currentId : randomUUID();
    const userAgent = headerStore.get("user-agent") ?? "";
    const now = new Date().toISOString();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_devices")
      .upsert(
        {
          id: deviceId,
          user_id: user.id,
          device_name: userAgent.slice(0, 120) || "Current browser",
          platform: getPlatform(userAgent),
          last_seen_at: now,
          revoked_at: null,
        },
        { onConflict: "id" },
      )
      .select("id, device_name, platform, last_seen_at, revoked_at, created_at")
      .single();

    if (error) {
      return { ok: false, code: "error" };
    }

    cookieStore.set(deviceCookieName, deviceId, {
      httpOnly: true,
      maxAge: deviceCookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true, data: { ...(data as Omit<DeviceRecord, "is_current">), is_current: true } };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function revokeDevice(deviceId: string): Promise<IdentityActionResult> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(deviceId)) {
    return { ok: false, code: user ? "validation" : "unauthenticated" };
  }

  try {
    const currentId = (await cookies()).get(deviceCookieName)?.value;
    if (currentId === deviceId) {
      return { ok: false, code: "forbidden" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("user_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("user_id", user.id)
      .is("revoked_at", null);

    return error ? { ok: false, code: "error" } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function requestAccountDeletion(input: unknown): Promise<IdentityActionResult> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  const result = getIdentitySchemas(getIdentityMessages("en")).deletion.safeParse(input);
  if (!result.success) {
    return { ok: false, code: "validation" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("account_deletion_requests").insert({
      user_id: user.id,
      status: "requested",
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      return { ok: false, code: error.code === "23505" ? "conflict" : "error" };
    }

    return { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function cancelAccountDeletion(): Promise<IdentityActionResult> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false, code: "unavailable" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: "unauthenticated" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("account_deletion_requests")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "requested");

    return error ? { ok: false, code: "error" } : { ok: true, data: undefined };
  } catch {
    return { ok: false, code: "error" };
  }
}
