import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { SettingsHeader } from "@/features/settings/settings-shell";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const messages = getIdentityMessages(locale);
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);

  const sections = [
    {
      href: `/${locale}/settings/profile` as Route,
      title: messages.nav.profile,
      description: messages.profile.description,
    },
    {
      href: `/${locale}/settings/notifications` as Route,
      title: messages.nav.notifications,
      description: app.notificationPrefsDescription,
    },
    {
      href: `/${locale}/settings/language` as Route,
      title: messages.nav.language,
      description: messages.common.language,
    },
    {
      href: `/${locale}/settings/appearance` as Route,
      title: messages.nav.appearance,
      description: messages.common.appearance,
    },
    {
      href: `/${locale}/settings/privacy` as Route,
      title: messages.nav.privacy,
      description: messages.privacy.description,
    },
    {
      href: `/${locale}/settings/account` as Route,
      title: messages.nav.account,
      description: messages.account.description,
    },
    {
      href: `/${locale}/settings/security` as Route,
      title: messages.nav.security,
      description: messages.security.description,
    },
    {
      href: `/${locale}/settings/devices` as Route,
      title: messages.nav.devices,
      description: messages.devices.description,
    },
  ];

  return (
    <>
      <SettingsHeader title={messages.nav.settings} description={t("common.footerResources")} />
      <div className="settings-hub">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="settings-hub__card">
            <strong>{section.title}</strong>
            <span>{section.description}</span>
          </Link>
        ))}
      </div>
    </>
  );
}