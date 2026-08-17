import type { Locale } from "@/config/locales";

const APP_TOP_LEVEL_SEGMENTS = [
  "home",
  "search",
  "messages",
  "notifications",
  "settings",
  "followers",
  "admin",
  "map",
  "profile",
  "orders",
  "marketplace",
] as const;

const APP_CREATE_SEGMENTS = ["posts", "products", "services", "jobs", "groups"] as const;

const APP_EDIT_SEGMENTS = ["products", "services", "jobs", "groups"] as const;

export function isApplicationPath(pathname: string, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== locale) return false;

  const [head, second, third] = segments.slice(1);
  if (!head) return false;

  if ((APP_TOP_LEVEL_SEGMENTS as readonly string[]).includes(head)) return true;
  if ((APP_CREATE_SEGMENTS as readonly string[]).includes(head) && second === "new") return true;
  if ((APP_EDIT_SEGMENTS as readonly string[]).includes(head) && second && third === "edit") {
    return true;
  }
  return false;
}

const APP_LIKE_PUBLIC_SEGMENTS = ["explore", "posts", "products", "services", "jobs", "groups", "u"] as const;

export function isAppExperiencePath(pathname: string, locale: Locale) {
  if (isApplicationPath(pathname, locale)) return true;
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== locale) return false;

  const head = segments[1];
  if (!head) return false;

  return (APP_LIKE_PUBLIC_SEGMENTS as readonly string[]).includes(head);
}
