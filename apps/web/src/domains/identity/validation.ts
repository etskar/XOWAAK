import { z } from "zod";

import { locales } from "@/config/locales";
import type { IdentityMessages } from "@/i18n/identity-messages";

export const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function getIdentitySchemas(messages: IdentityMessages) {
  const username = z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z
      .string()
      .min(3, messages.validation.usernameRequired)
      .max(32, messages.validation.usernameInvalid)
      .regex(usernamePattern, messages.validation.usernameInvalid),
  );
  const displayName = z
    .string()
    .trim()
    .min(1, messages.validation.displayNameRequired)
    .max(120, messages.validation.displayNameTooLong);

  return {
    profile: z.object({
      username,
      displayName,
      bio: z.string().trim().max(2000, messages.validation.bioTooLong),
      locationLabel: z.string().trim().max(160, messages.validation.locationTooLong),
      avatarMediaId: z.string().uuid().nullable().optional(),
      coverMediaId: z.string().uuid().nullable().optional(),
    }),
    notificationPreferences: z.object({
      follow: z.boolean(),
      like: z.boolean(),
      comment: z.boolean(),
      share: z.boolean(),
      message: z.boolean(),
      group: z.boolean(),
      system: z.boolean(),
    }),
    privacy: z.object({
      visibility: z.enum(["public", "private"]),
      discoverability: z.enum(["discoverable", "not_discoverable"]),
      contactPrivacy: z.enum(["anyone", "authenticated", "nobody"]),
    }),
    settings: z.object({
      locale: z.enum(locales),
      themePreference: z.enum(["system", "light", "dark"]),
    }),
    deletion: z.object({
      confirmation: z.literal("DELETE", { error: messages.validation.confirmationRequired }),
    }),
    email: z.object({
      email: z.string().trim().email(messages.validation.emailInvalid),
    }),
  };
}

export function getIdentityFieldErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues
      .filter((issue) => issue.path[0])
      .map((issue) => [String(issue.path[0]), issue.message]),
  );
}
