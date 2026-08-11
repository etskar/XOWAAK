import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSafeInternalPath } from "@/auth/redirects";
import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { createSupabaseServerClient } from "@/server/supabase/client";

type CallbackContext = {
  params: Promise<{ locale: string }>;
};

function signInRedirect(
  request: NextRequest,
  locale: Locale,
  error: "auth_unavailable" | "callback",
) {
  const url = new URL(`/${locale}/auth/sign-in`, request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest, { params }: CallbackContext) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return NextResponse.redirect(new URL("/en/auth/sign-in?error=callback", request.url));
  }

  const locale = localeParam as Locale;
  const code = request.nextUrl.searchParams.get("code");
  const destination = getSafeInternalPath(request.nextUrl.searchParams.get("next"), locale);

  if (!code) {
    return signInRedirect(request, locale, "callback");
  }

  if (!hasSupabasePublicEnv()) {
    return signInRedirect(request, locale, "auth_unavailable");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return signInRedirect(request, locale, "callback");
    }

    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return signInRedirect(request, locale, "auth_unavailable");
  }
}
