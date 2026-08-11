import type { Locale } from "@/config/locales";

const protectedSuffixes = ["/home", "/admin", "/settings", "/followers/requests"] as const;

export function isProtectedPath(pathname: string, locale: Locale) {
  return protectedSuffixes.some((suffix) => {
    const route = `/${locale}${suffix}`;
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function isAuthEntryPath(pathname: string, locale: Locale) {
  const authRoutes = ["sign-in", "sign-up", "recovery", "update-password"];
  return authRoutes.some((route) => pathname === `/${locale}/auth/${route}`);
}
