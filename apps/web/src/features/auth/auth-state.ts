"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/supabase/browser";

export type AuthStateChange = {
  event: AuthChangeEvent;
  session: Session | null;
};

export function subscribeToAuthState(onChange: (change: AuthStateChange) => void) {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      onChange({ event, session });
    });

    return () => data.subscription.unsubscribe();
  } catch {
    onChange({ event: "SIGNED_OUT", session: null });
    return () => undefined;
  }
}
