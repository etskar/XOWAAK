import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { PrivacyForm } from "@/features/settings/settings-forms";
import { getOwnProfile, getOwnSettings } from "@/server/identity/queries";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type PrivacySettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacySettingsPage({ params }: PrivacySettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();
  const [profile, settings] = unavailable
    ? [null, null]
    : await Promise.all([getOwnProfile(), getOwnSettings()]);

  return (
    <>
      <SettingsHeader title={messages.privacy.title} description={messages.privacy.description} />
      <PrivacyForm
        locale={locale}
        messages={messages}
        visibility={profile?.visibility ?? "public"}
        discoverability={settings?.discoverability ?? "discoverable"}
        contactPrivacy={settings?.contact_privacy ?? "authenticated"}
        unavailable={unavailable}
      />
    </>
  );
}
