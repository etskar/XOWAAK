import type { ReactNode } from "react";

import { Badge, Card, Container, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { getAuthMessages } from "@/i18n/auth-messages";
import { hasSupabasePublicEnv } from "@/config/public-env";

type AuthShellProps = {
  locale: Locale;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ locale, title, description, children }: AuthShellProps) {
  const landing = getLandingMessages(locale);
  const auth = getAuthMessages(locale);
  const unavailable = !hasSupabasePublicEnv();

  return (
    <main className="auth-page" aria-labelledby="auth-title" data-locale={locale}>
      <Container size="xl">
        <div className="auth-layout">
          <aside className="auth-aside">
            <Badge variant="primary">{landing.hero.eyebrow}</Badge>
            <p className="auth-aside__kicker">XOWAAK / 01</p>
            <h2>{landing.hero.visualTitle}</h2>
            <p>{landing.hero.visualBody}</p>
            <div className="auth-aside__points">
              <span>{landing.features.identity.title}</span>
              <span>{landing.features.privacy.title}</span>
              <span>{landing.features.social.title}</span>
            </div>
          </aside>
          <Card elevated className="auth-card">
            <Stack gap={6}>
              <div className="auth-card__toolbar">
                <span className="auth-card__mark" aria-hidden="true">
                  X
                </span>
              </div>
              <Stack gap={2}>
                <p className="showcase-eyebrow">{auth.common.submit}</p>
                <h1 id="auth-title" className="ds-text-h3">
                  {title}
                </h1>
                <p className="auth-description">{description}</p>
              </Stack>
              {unavailable && (
                <div className="auth-unavailable" role="status">
                  <strong>{auth.common.notConfigured}</strong>
                  <span>{landing.hero.description}</span>
                </div>
              )}
              {children}
            </Stack>
          </Card>
        </div>
      </Container>
    </main>
  );
}
