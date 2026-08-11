import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { hasSupabasePublicEnv } from "@/config/public-env";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { AccountForm } from "@/features/settings/settings-forms";
import { SettingsHeader } from "@/features/settings/settings-shell";
import { getAccountDeletionRequest } from "@/server/identity/queries";

export const dynamic = "force-dynamic";

type AccountSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountSettingsPage({ params }: AccountSettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const unavailable = !hasSupabasePublicEnv();
  const deletionRequest = unavailable ? null : await getAccountDeletionRequest();

  return (
    <>
      <SettingsHeader title={messages.account.title} description={messages.account.description} />
      <AccountForm
        locale={locale}
        messages={messages}
        deletionRequest={deletionRequest}
        unavailable={unavailable}
      />
    </>
  );
}
