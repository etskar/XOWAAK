import type { Locale } from "@/config/locales";
import { messages } from "@/i18n/messages";

export type SocialMessages = (typeof messages)[Locale]["social"];

export function getSocialMessages(locale: Locale): SocialMessages {
  return messages[locale].social;
}
