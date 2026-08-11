import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getIdentityMessages } from "@/i18n/identity-messages";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";

type SettingsShellProps = {
  locale: Locale;
  children: ReactNode;
};

export function SettingsShell({ locale, children }: SettingsShellProps) {
  const messages = getIdentityMessages(locale);
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
        <div className="settings-layout">
          <nav className="settings-nav" aria-label={messages.nav.settings}>
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="settings-nav__link">
                {link.label}
              </Link>
            ))}
          </nav>
          <Card elevated className="settings-content">
            <Stack gap={6}>
              <LocaleSwitcher locale={locale} />
              {children}
            </Stack>
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
