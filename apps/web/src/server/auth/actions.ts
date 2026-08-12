"use server";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

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
