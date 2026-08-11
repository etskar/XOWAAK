import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { createSupabaseServerClient } from "@/server/supabase/client";

type SignOutContext = {
  params: Promise<{ locale: string }>;
};

export async function POST(request: NextRequest, { params }: SignOutContext) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Logout remains safe to retry even when the auth provider is unavailable.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/auth/sign-in`, request.url), 303);
}
