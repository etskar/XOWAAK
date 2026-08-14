import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getOwnSettings } from "@/server/identity/queries";
import { AppearanceForm } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type AppearancePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AppearancePage({ params }: AppearancePageProps) {
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
      <SettingsHeader title={messages.nav.appearance} description={messages.common.appearance} />
      <AppearanceForm messages={messages} settings={settings} unavailable={unavailable} />
    </>
  );
}