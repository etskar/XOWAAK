import type { Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfile } from "@/server/identity/queries";
import { SiteHeader } from "@/features/navigation/site-header";

export async function SiteHeaderContainer({ locale }: { locale: Locale }) {
  const user = await getCurrentUser();

  let avatarUrl: string | null = null;
  let displayName: string | null = null;
  if (user) {
    try {
      const profile = await getOwnProfile();
      if (profile) {
        avatarUrl = profile.avatar_url ?? null;
        displayName = profile.display_name ?? null;
      }
    } catch {
      // Header falls back to a generic avatar when the profile is unavailable.
    }
  }

  return (
    <SiteHeader locale={locale} user={user} avatarUrl={avatarUrl} displayName={displayName} />
  );
}
