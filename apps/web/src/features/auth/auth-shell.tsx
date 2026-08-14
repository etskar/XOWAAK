import type { ReactNode } from "react";

import { Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { hasSupabasePublicEnv } from "@/config/public-env";

type AuthShellProps = {
  locale: Locale;
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthShell({ locale, title, description, children }: AuthShellProps) {
  const auth = getAuthMessages(locale);
  const unavailable = !hasSupabasePublicEnv();

  return (
    <main className="auth-page" aria-labelledby="auth-title" data-locale={locale}>
      <Container size="sm">
        <Card elevated className="auth-card">
          <Stack gap={6}>
            <Stack gap={2}>
              <p className="showcase-eyebrow">XOWAAK</p>
              <h1 id="auth-title" className="ds-text-h3">
                {title}
              </h1>
              {description && <p className="auth-description">{description}</p>}
            </Stack>
            {unavailable && (
              <div className="auth-unavailable" role="status">
                <strong>{auth.common.notConfigured}</strong>
                <span>{auth.common.unexpected}</span>
              </div>
            )}
            {children}
          </Stack>
        </Card>
      </Container>
    </main>
  );
}
