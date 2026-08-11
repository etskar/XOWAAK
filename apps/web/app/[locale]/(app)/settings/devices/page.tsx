import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { DevicesList } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";
import { getOwnDevices } from "@/server/identity/queries";

export const dynamic = "force-dynamic";

type DevicesSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DevicesSettingsPage({ params }: DevicesSettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();
  const devices = unavailable ? [] : await getOwnDevices();

  return (
    <>
      <SettingsHeader title={messages.devices.title} description={messages.devices.description} />
      <DevicesList
        locale={locale}
        messages={messages}
        devices={devices}
        unavailable={unavailable}
      />
    </>
  );
}
