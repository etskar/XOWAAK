import { notFound } from "next/navigation";

import { getAuthQueryErrorMessage, getAuthQuerySuccessMessage } from "@/auth/errors";
import { isLocale, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { AuthShell } from "@/features/auth/auth-shell";
import { SignInForm } from "@/features/auth/auth-forms";

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const query = searchParams ? await searchParams : {};
  const messages = getAuthMessages(locale);

  return (
    <AuthShell
      locale={locale}
      title={messages.signIn.title}
      description={messages.signIn.description}
    >
      <SignInForm
        locale={locale}
        messages={messages}
        nextPath={firstQueryValue(query.next)}
        initialError={getAuthQueryErrorMessage(firstQueryValue(query.error) ?? null, locale)}
        initialSuccess={getAuthQuerySuccessMessage(firstQueryValue(query.success) ?? null, locale)}
      />
    </AuthShell>
  );
}
