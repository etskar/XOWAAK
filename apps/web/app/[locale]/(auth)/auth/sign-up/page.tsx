import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { AuthShell } from "@/features/auth/auth-shell";
import { SignUpForm } from "@/features/auth/auth-forms";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getAuthMessages(locale);

  return (
    <AuthShell locale={locale} title={messages.signUp.title}>
      <SignUpForm locale={locale} messages={messages} />
    </AuthShell>
  );
}
