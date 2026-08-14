"use server";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/client";
import { getCurrentUser } from "@/server/auth/session";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getIdentitySchemas } from "@/domains/identity/validation";

export type ConfirmSignupResult = { ok: true } | { ok: false };

interface ConfirmSignupInput {
  userId: string;
  email: string;
}

/**
 * Confirms the email of a freshly created account so the user can sign in
 * immediately without completing an email verification step. Uses the real
 * Supabase Auth Admin API on the server only; nothing is faked client-side.
 * Email verification can be re-enabled later by removing this call and
 * relying on the Supabase project setting instead.
 */
export async function confirmSignupEmail(input: ConfirmSignupInput): Promise<ConfirmSignupResult> {
  if (!hasSupabasePublicEnv()) {
    return { ok: false };
  }

  const userId = input?.userId;
  const email = input?.email;

  // Only accept well-formed UUIDs and emails; never pass arbitrary input to the Admin API.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId ?? "")) {
    return { ok: false };
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false };
  }

  try {
    const supabase = createSupabaseAdminClient();
    // Only confirm the account that was just created with this exact email
    // and that is not already confirmed.
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user || data.user.email_confirmed_at) {
      return { ok: false };
    }
    if (data.user.email?.toLowerCase() !== email.toLowerCase()) {
      return { ok: false };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    return updateError ? { ok: false } : { ok: true };
  } catch {
    return { ok: false };
  }
}

export type UsernameAvailabilityResult = { ok: true; available: true } | { ok: true; available: false };

export async function isUsernameAvailable(username: unknown): Promise<UsernameAvailabilityResult> {
  const result = getIdentitySchemas(getIdentityMessages("en")).profile.pick({ username: true }).safeParse(
    { username: typeof username === "string" ? username : "" },
  );
  if (!result.success) {
    return { ok: true, available: false };
  }
  if (!hasSupabasePublicEnv()) {
    return { ok: true, available: true };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", result.data.username)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return { ok: true, available: true };
    return { ok: true, available: !data };
  } catch {
    return { ok: true, available: true };
  }
}

export type UsernameResolutionResult = { ok: true; email: string | null } | { ok: false };

export async function resolveUsernameToEmail(username: unknown): Promise<UsernameResolutionResult> {
  if (typeof username !== "string" || !/^[a-z0-9][a-z0-9._-]{2,31}$/i.test(username)) {
    return { ok: false };
  }
  if (!hasSupabasePublicEnv()) {
    return { ok: true, email: null };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username.trim().toLowerCase())
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return { ok: true, email: null };
    const admin = createSupabaseAdminClient();
    const { data: user, error: userError } = await admin.auth.admin.getUserById(String(data.id));
    if (userError || !user.user?.email) return { ok: true, email: null };
    return { ok: true, email: user.user.email };
  } catch {
    return { ok: false };
  }
}

export type SignupProfileResult = { ok: true } | { ok: false };

interface SignupProfileInput {
  username: string;
  displayName: string;
}

export async function createProfileOnSignup(input: SignupProfileInput): Promise<SignupProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const result = getIdentitySchemas(getIdentityMessages("en")).profile
    .pick({ username: true, displayName: true })
    .safeParse(input);
  if (!result.success) return { ok: false };
  if (!hasSupabasePublicEnv()) return { ok: false };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: result.data.username,
        display_name: result.data.displayName,
      },
      { onConflict: "id" },
    );
    return error ? { ok: false } : { ok: true };
  } catch {
    return { ok: false };
  }
}
