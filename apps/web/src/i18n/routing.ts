import { defaultLocale, isLocale, type Locale } from "@/config/locales";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return segment && isLocale(segment) ? segment : defaultLocale;
}

export function replacePathLocale(pathname: string, targetLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1] ?? "")) {
    segments[1] = targetLocale;
    return segments.join("/") || `/${targetLocale}`;
  }

  return `/${targetLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
