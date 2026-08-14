import type { Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";

export type AuthErrorContext = "signIn" | "signUp" | "recovery" | "updatePassword" | "callback";

export function getAuthErrorMessage(error: unknown, locale: Locale, context: AuthErrorContext) {
  const messages = getAuthMessages(locale);
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("supabase") || message.includes("configuration")) {
    return messages.common.notConfigured;
  }

  if (context === "signIn" && message.includes("email not confirmed")) {
    return messages.errors.emailNotConfirmed;
  }

  if (
    context === "signIn" &&
    (message.includes("invalid login") || message.includes("invalid credentials"))
  ) {
    return messages.errors.invalidCredentials;
  }

  if (message.includes("session expired")) {
    return messages.errors.sessionExpired;
  }

  if (context === "signUp" && message.includes("already registered")) {
    return messages.errors.emailAlreadyRegistered;
  }

  if (
    message.includes("rate limit") ||
    message.includes("over_email_send_rate_limit") ||
    message.includes("too many requests")
  ) {
    return messages.errors.rateLimited;
  }

  if (context === "signIn" && message.includes("user not found")) {
    return messages.errors.userNotFound;
  }

  if (context === "callback") {
    return messages.errors.callback;
  }

  return messages.errors.unavailable;
}

export function getAuthQueryErrorMessage(value: string | null, locale: Locale) {
  const messages = getAuthMessages(locale);

  switch (value) {
    case "auth_unavailable":
      return messages.common.notConfigured;
    case "callback":
      return messages.errors.callback;
    case "session_expired":
      return messages.errors.sessionExpired;
    default:
      return null;
  }
}

export function getAuthQuerySuccessMessage(value: string | null, locale: Locale) {
  if (value === "password_updated") {
    return getAuthMessages(locale).common.passwordUpdated;
  }

  return null;
}
