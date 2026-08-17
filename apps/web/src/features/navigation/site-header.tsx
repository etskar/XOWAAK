"use client";

import Link from "next/link";
import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

import { getLocaleConfig, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";
import { UserMenu } from "@/features/navigation/user-menu";
import { MenuRegistryProvider } from "@/features/navigation/menu-registry";
import { isAppExperiencePath, isApplicationPath } from "@/features/navigation/routes";

type SiteHeaderProps = {
  locale: Locale;
  user?: User | null;
  avatarUrl?: string | null;
  displayName?: string | null;
};

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function SiteHeader({ locale, user, avatarUrl, displayName }: SiteHeaderProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const { t } = createTranslator(locale);
  const config = getLocaleConfig(locale);
  const isApp = isApplicationPath(pathname, locale);
  const isAuthenticated = user !== null && user !== undefined;
  const showAppChrome = isApp || (isAuthenticated && isAppExperiencePath(pathname, locale));

  return (
    <MenuRegistryProvider>
      <header className={`site-header${showAppChrome ? " site-header--app" : " site-header--public"}`}>
        <div className="site-header__inner">
          <Link
            className="site-brand"
            href={(showAppChrome ? `/${locale}/home` : `/${locale}`) as Route}
            aria-label={config.name}
          >
            <BrandMark />
            <span className="site-brand__word">XOWAAK</span>
          </Link>

          <div className="site-header__actions">
            {showAppChrome ? (
              <UserMenu
                locale={locale}
                isAuthenticated={isAuthenticated}
                avatarUrl={avatarUrl ?? null}
                displayName={displayName ?? null}
              />
            ) : (
              <>
                <LocaleSwitcher locale={locale} compact />
                {isAuthenticated ? (
                  <Link
                    className="site-action site-action--primary"
                    href={`/${locale}/home` as Route}
                  >
                    {t("navigation.openApp")}
                  </Link>
                ) : (
                  <>
                    <Link
                      className="site-action site-action--quiet"
                      href={`/${locale}/auth/sign-in` as Route}
                    >
                      {t("navigation.signIn")}
                    </Link>
                    <Link
                      className="site-action site-action--primary"
                      href={`/${locale}/auth/sign-up` as Route}
                    >
                      {t("navigation.createAccount")}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </MenuRegistryProvider>
  );
}

export function SiteFooter({ locale }: SiteHeaderProps) {
  const { t } = createTranslator(locale);

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link className="site-brand" href={`/${locale}` as Route}>
            <BrandMark />
            <span className="site-brand__word">XOWAAK</span>
          </Link>
          <p>{t("common.brandTagline")}</p>
          <LocaleSwitcher locale={locale} compact />
        </div>
        <div className="site-footer__links">
          <div>
            <p className="site-footer__label">{t("common.footerProduct")}</p>
            <Link href={`/${locale}/about` as Route}>{t("navigation.about")}</Link>
            <Link href={`/${locale}/explore` as Route}>{t("navigation.discover")}</Link>
          </div>
          <div>
            <p className="site-footer__label">{t("common.footerResources")}</p>
            <Link href={`/${locale}/auth/sign-in` as Route}>{t("navigation.signIn")}</Link>
            <Link href={`/${locale}/auth/sign-up` as Route}>{t("navigation.createAccount")}</Link>
          </div>
        </div>
        <p className="site-footer__copyright">© {new Date().getFullYear()} XOWAAK</p>
      </div>
    </footer>
  );
}
