import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { SecurityForm } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type SecuritySettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SecuritySettingsPage({ params }: SecuritySettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();

  return (
    <>
      <SettingsHeader title={messages.security.title} description={messages.security.description} />
      <SecurityForm locale={locale} messages={messages} unavailable={unavailable} />
    </>
  );
}
