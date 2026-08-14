export type ProfileRecord = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_media_id: string | null;
  avatar_url?: string | null;
  cover_media_id: string | null;
  cover_url?: string | null;
  location_label: string | null;
  visibility: "public" | "private";
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NotificationPreferenceKey =
  | "follow"
  | "like"
  | "comment"
  | "share"
  | "message"
  | "group"
  | "system";

export type UserSettingsRecord = {
  user_id: string;
  theme_preference: "system" | "light" | "dark";
  locale: Locale;
  discoverability: "discoverable" | "not_discoverable";
  contact_privacy: "anyone" | "authenticated" | "nobody";
  notification_preferences: Record<string, unknown>;
  privacy_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DeviceRecord = {
  id: string;
  device_name: string | null;
  platform: "web" | "ios" | "android" | "desktop" | "other";
  last_seen_at: string | null;
  revoked_at: string | null;
  created_at: string;
  is_current: boolean;
};

export type AccountDeletionRequestRecord = {
  id: string;
  status: "requested" | "cancelled" | "completed";
  requested_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
};

export type IdentityActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "unauthenticated" | "unavailable" | "validation" | "conflict" | "forbidden" | "error";
    };
import type { Locale } from "@/config/locales";
