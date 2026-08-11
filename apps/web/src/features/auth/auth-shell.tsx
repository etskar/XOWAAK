import type { ReactNode } from "react";

import { Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";

type AuthShellProps = {
  locale: Locale;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ locale, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-page" aria-labelledby="auth-title" data-locale={locale}>
      <Container size="sm">
        <Card elevated className="auth-card">
          <Stack gap={6}>
            <LocaleSwitcher locale={locale} />
            <Stack gap={2}>
              <h1 id="auth-title" className="ds-text-h3">
                {title}
              </h1>
              <p className="auth-description">{description}</p>
            </Stack>
            {children}
          </Stack>
        </Card>
      </Container>
    </main>
  );
}
