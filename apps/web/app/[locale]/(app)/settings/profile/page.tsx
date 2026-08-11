import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { ProfileForm } from "@/features/profile/profile-form";
import { getOwnProfile } from "@/server/identity/queries";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type ProfileSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileSettingsPage({ params }: ProfileSettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();
  const profile = unavailable ? null : await getOwnProfile();

  return (
    <>
      <SettingsHeader title={messages.profile.title} description={messages.profile.description} />
      <ProfileForm
        locale={locale}
        messages={messages}
        profile={profile}
        unavailable={unavailable}
      />
    </>
  );
}
