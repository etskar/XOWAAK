import type { Locale } from "@/config/locales";

const APP_PATH_SEGMENTS = [
  "home",
  "search",
  "messages",
  "notifications",
  "settings",
  "followers",
  "admin",
  "products",
  "services",
  "jobs",
  "groups",
  "map",
  "posts",
  "marketplace",
  "profile",
  "orders",
] as const;

export function isApplicationPath(pathname: string, locale: Locale) {
  return APP_PATH_SEGMENTS.some(
    (segment) =>
      pathname === `/${locale}/${segment}` ||
      pathname.startsWith(`/${locale}/${segment}/`),
  );
}
