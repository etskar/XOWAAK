import type { Locale } from "@/config/locales";

const internalOrigin = "https://xowaak.internal";

export function getSafeInternalPath(
  value: string | null | undefined,
  locale: Locale,
  fallback = `/${locale}/home`,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  if (/[\r\n]/.test(value)) {
    return fallback;
  }

  try {
    const target = new URL(value, internalOrigin);
    const localeRoot = `/${locale}`;
    const hasLocale =
      target.pathname === localeRoot || target.pathname.startsWith(`${localeRoot}/`);

    if (target.origin !== internalOrigin || !hasLocale) {
      return fallback;
    }

    return `${target.pathname}${target.search}`;
  } catch {
    return fallback;
  }
}

export function buildAuthCallbackPath(locale: Locale, destination: string) {
  const safeDestination = getSafeInternalPath(destination, locale);
  return `/${locale}/auth/callback?next=${encodeURIComponent(safeDestination)}`;
}
