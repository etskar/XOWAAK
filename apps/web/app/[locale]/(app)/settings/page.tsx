import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getOwnSettings } from "@/server/identity/queries";
import { PreferencesForm } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();
  const settings = unavailable ? null : await getOwnSettings();

  return (
    <>
      <SettingsHeader title={messages.nav.settings} description={messages.profile.description} />
      <PreferencesForm
        locale={locale}
        messages={messages}
        settings={settings}
        unavailable={unavailable}
      />
    </>
  );
}
