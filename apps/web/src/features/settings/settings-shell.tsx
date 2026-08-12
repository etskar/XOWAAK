import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Badge, Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { createTranslator } from "@/i18n/translate";

type SettingsShellProps = {
  locale: Locale;
  children: ReactNode;
};

export function SettingsShell({ locale, children }: SettingsShellProps) {
  const messages = getIdentityMessages(locale);
  const { t } = createTranslator(locale);
  const links = [
    { href: `/${locale}/settings`, label: messages.nav.settings },
    { href: `/${locale}/settings/profile`, label: messages.nav.profile },
    { href: `/${locale}/settings/privacy`, label: messages.nav.privacy },
    { href: `/${locale}/settings/account`, label: messages.nav.account },
    { href: `/${locale}/settings/security`, label: messages.nav.security },
    { href: `/${locale}/settings/devices`, label: messages.nav.devices },
  ];

  return (
    <main className="settings-page" data-locale={locale}>
      <Container size="xl">
        <div className="settings-page__topline">
          <Link href={`/${locale}` as Route}>{t("common.backToHome")}</Link>
          <Badge variant="primary">{messages.nav.settings}</Badge>
        </div>
        <div className="settings-layout">
          <nav className="settings-nav" aria-label={messages.nav.settings}>
            <p className="settings-nav__label">{t("navigation.productNavigation")}</p>
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="settings-nav__link">
                {link.label}
              </Link>
            ))}
          </nav>
          <Card elevated className="settings-content">
            <Stack gap={6}>{children}</Stack>
          </Card>
        </div>
      </Container>
    </main>
  );
}

export function SettingsHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="settings-header">
      <h1 className="ds-text-h3">{title}</h1>
      <p>{description}</p>
    </header>
  );
}
