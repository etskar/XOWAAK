import type { Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { SiteHeader } from "@/features/navigation/site-header";

export async function SiteHeaderContainer({ locale }: { locale: Locale }) {
  const user = await getCurrentUser();
  return <SiteHeader locale={locale} user={user} />;
}