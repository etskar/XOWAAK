import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getSafeInternalPath } from "@/auth/redirects";
import type { Locale } from "@/config/locales";
import { createSupabaseServerClient } from "@/server/supabase/client";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function hasCurrentUserRole(role: string) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("has_role", { requested_role: role });

    return !error && data === true;
  } catch {
    return false;
  }
}

export async function requireCurrentUser(locale: Locale, nextPath = `/${locale}/home`) {
  const user = await getCurrentUser();

  if (!user) {
    const safePath = getSafeInternalPath(nextPath, locale);
    redirect(`/${locale}/auth/sign-in?next=${encodeURIComponent(safePath)}`);
  }

  return user;
}

export async function requireRole(locale: Locale, role: string) {
  const user = await requireCurrentUser(locale, `/${locale}/admin`);
  const hasRole = await hasCurrentUserRole(role);

  if (!hasRole) {
    redirect(`/${locale}/home?error=forbidden`);
  }

  return user;
}
