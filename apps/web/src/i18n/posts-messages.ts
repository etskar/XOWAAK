import type { Locale } from "@/config/locales";
import { messages } from "@/i18n/messages";

export type PostsMessages = (typeof messages)[Locale]["posts"];

export function getPostsMessages(locale: Locale): PostsMessages {
  return messages[locale].posts;
}
