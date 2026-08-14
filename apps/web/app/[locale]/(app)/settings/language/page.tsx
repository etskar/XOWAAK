import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getOwnSettings } from "@/server/identity/queries";
import { LanguageForm } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type LanguagePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LanguagePage({ params }: LanguagePageProps) {
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
      <SettingsHeader title={messages.nav.language} description={messages.common.language} />
      <LanguageForm
        locale={locale}
        messages={messages}
        settings={settings}
        unavailable={unavailable}
      />
    </>
  );
}