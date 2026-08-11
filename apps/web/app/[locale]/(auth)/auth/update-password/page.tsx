import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { AuthShell } from "@/features/auth/auth-shell";
import { UpdatePasswordForm } from "@/features/auth/auth-forms";

type UpdatePasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UpdatePasswordPage({ params }: UpdatePasswordPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getAuthMessages(locale);

  return (
    <AuthShell
      locale={locale}
      title={messages.updatePassword.title}
      description={messages.updatePassword.description}
    >
      <UpdatePasswordForm locale={locale} messages={messages} />
    </AuthShell>
  );
}
