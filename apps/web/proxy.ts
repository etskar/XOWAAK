import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isProtectedPath } from "@/auth/routes";
import { hasSupabasePublicEnv, getSupabasePublicEnv } from "@/config/public-env";
import { isLocale, type Locale } from "@/config/locales";

function getLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return segment && isLocale(segment) ? segment : null;
}

function redirectToSignIn(request: NextRequest, locale: Locale, reason?: string) {
  const url = new URL(`/${locale}/auth/sign-in`, request.url);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  if (reason) {
    url.searchParams.set("error", reason);
  }

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const locale = getLocaleFromPath(request.nextUrl.pathname);

  if (!locale) {
    return NextResponse.next();
  }

  const protectedPath = isProtectedPath(request.nextUrl.pathname, locale);

  if (!hasSupabasePublicEnv()) {
    return protectedPath
      ? redirectToSignIn(request, locale, "auth_unavailable")
      : NextResponse.next();
  }

  let response = NextResponse.next({ request });

  try {
    const { url, publishableKey } = getSupabasePublicEnv();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (protectedPath && (error || !data.user)) {
      return redirectToSignIn(request, locale);
    }
  } catch {
    if (protectedPath) {
      return redirectToSignIn(request, locale, "auth_unavailable");
    }
  }

  return response;
}

export const config = {
  matcher: ["/(en|ar|es|fr|de|tr|pt|zh)", "/(en|ar|es|fr|de|tr|pt|zh)/:path*"],
};
