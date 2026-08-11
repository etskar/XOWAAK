import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { AuthShell } from "@/features/auth/auth-shell";

type VerificationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function VerificationPage({ params }: VerificationPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getAuthMessages(locale);

  return (
    <AuthShell
      locale={locale}
      title={messages.verification.title}
      description={messages.verification.description}
    >
      <p className="auth-form__hint">{messages.signUp.verification}</p>
      <p className="auth-form__links">
        <Link href={`/${locale}/auth/sign-in`}>{messages.common.backToSignIn}</Link>
      </p>
    </AuthShell>
  );
}
