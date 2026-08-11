import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { AuthShell } from "@/features/auth/auth-shell";
import { RecoveryForm } from "@/features/auth/auth-forms";

type RecoveryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RecoveryPage({ params }: RecoveryPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getAuthMessages(locale);

  return (
    <AuthShell
      locale={locale}
      title={messages.recovery.title}
      description={messages.recovery.description}
    >
      <RecoveryForm locale={locale} messages={messages} />
    </AuthShell>
  );
}
