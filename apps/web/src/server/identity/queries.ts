import "server-only";

import { cookies } from "next/headers";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type {
  AccountDeletionRequestRecord,
  DeviceRecord,
  ProfileRecord,
  UserSettingsRecord,
} from "@/server/identity/types";

const profileSelect =
  "id, username, display_name, bio, avatar_media_id, location_label, visibility, locale, timezone, created_at, updated_at, deleted_at";
const deviceCookieName = "xowaak_device_id";

async function getCurrentDeviceId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(deviceCookieName)?.value;

  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

export async function getOwnProfile(): Promise<ProfileRecord | null> {
  const user = await getCurrentUser();

  if (!user || !hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("profile_query_failed");
  }

  return data as ProfileRecord | null;
}

export async function getProfileByUsername(username: string): Promise<ProfileRecord | null> {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error("profile_query_failed");
  }

  return data as ProfileRecord | null;
}

export async function getOwnSettings(): Promise<UserSettingsRecord | null> {
  const user = await getCurrentUser();

  if (!user || !hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "user_id, theme_preference, locale, discoverability, contact_privacy, notification_preferences, privacy_preferences, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("settings_query_failed");
  }

  return data as UserSettingsRecord | null;
}

export async function getOwnDevices(): Promise<DeviceRecord[]> {
  const user = await getCurrentUser();

  if (!user || !hasSupabasePublicEnv()) {
    return [];
  }

  const currentDeviceId = await getCurrentDeviceId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_devices")
    .select("id, device_name, platform, last_seen_at, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("devices_query_failed");
  }

  return ((data ?? []) as Omit<DeviceRecord, "is_current">[]).map((device) => ({
    ...device,
    is_current: device.id === currentDeviceId,
  }));
}

export async function getAccountDeletionRequest(): Promise<AccountDeletionRequestRecord | null> {
  const user = await getCurrentUser();

  if (!user || !hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("id, status, requested_at, confirmed_at, cancelled_at, completed_at")
    .eq("user_id", user.id)
    .eq("status", "requested")
    .maybeSingle();

  if (error) {
    throw new Error("deletion_query_failed");
  }

  return data as AccountDeletionRequestRecord | null;
}
