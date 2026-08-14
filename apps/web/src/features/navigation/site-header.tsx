"use client";

import Link from "next/link";
import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { getLocaleConfig, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";
import { ThemeToggle } from "@/features/navigation/theme-toggle";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { SearchBar } from "@/features/navigation/search-bar";
import { UserMenu } from "@/features/navigation/user-menu";
import { MenuRegistryProvider } from "@/features/navigation/menu-registry";
import { cx } from "@/design-system/utils/cx";

type SiteHeaderProps = {
  locale: Locale;
  user?: User | null;
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

function isApplicationPath(pathname: string, locale: Locale) {
  return [
    `/${locale}/home`,
    `/${locale}/search`,
    `/${locale}/messages`,
    `/${locale}/notifications`,
    `/${locale}/settings`,
    `/${locale}/followers/requests`,
    `/${locale}/admin`,
    `/${locale}/products`,
    `/${locale}/services`,
    `/${locale}/jobs`,
    `/${locale}/groups`,
    `/${locale}/map`,
    `/${locale}/posts`,
    `/${locale}/marketplace`,
    `/${locale}/profile`,
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function SiteHeader({ locale, user }: SiteHeaderProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const { t } = createTranslator(locale);
  const [isOpen, setIsOpen] = useState(false);
  const config = getLocaleConfig(locale);
  const isApp = isApplicationPath(pathname, locale);
  const isHome = pathname === `/${locale}/home`;
  const isLanding = pathname === `/${locale}`;
  const isAuthenticated = user !== null && user !== undefined;
  const links = [
    { href: `/${locale}` as Route, label: t("navigation.landing") },
    { href: `/${locale}/about` as Route, label: t("navigation.about") },
    { href: `/${locale}/explore` as Route, label: t("navigation.discover") },
    { href: `/${locale}/home` as Route, label: t("navigation.home") },
  ];

  return (
    <MenuRegistryProvider>
      <header
        className={`site-header${isApp ? " site-header--app" : ""}${isLanding ? " site-header--landing" : ""}`}
      >
        <div className="site-header__inner">
          <Link className="site-brand" href={`/${locale}` as Route} aria-label={config.name}>
            <BrandMark />
            <span className="site-brand__word">XOWAAK</span>
          </Link>

          {isApp && isHome && (
            <div className="site-header__search">
              <SearchBar locale={locale} />
            </div>
          )}

          {!isApp && !isLanding && (
            <nav className="site-nav site-nav--desktop" aria-label={t("navigation.productNavigation")}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx("site-nav__link", pathname === link.href && "site-nav__link--active")}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="site-header__actions">
            {isLanding ? (
              <LocaleSwitcher locale={locale} compact />
            ) : (
              <>
                <InstallAppButton locale={locale} />
                <LocaleSwitcher locale={locale} compact />
                <ThemeToggle locale={locale} />
                {isApp ? (
                  <UserMenu locale={locale} isAuthenticated={isAuthenticated} />
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
                {!isApp && (
                  <button
                    className="site-menu-button"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls="mobile-product-navigation"
                    aria-label={isOpen ? t("common.closeNavigation") : t("common.openNavigation")}
                    onClick={() => setIsOpen((current) => !current)}
                  >
                    <span />
                    <span />
                    <span />
                  </button>
                )}
              </>
            )}
          </div>

          {!isApp && !isLanding && (
            <nav
              id="mobile-product-navigation"
              className="site-nav site-nav--mobile"
              data-open={isOpen || undefined}
              aria-label={t("navigation.productNavigation")}
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="site-nav__mobile-link"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={`/${locale}/auth/sign-in` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.signIn")}
              </Link>
              <Link
                href={`/${locale}/auth/sign-up` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.createAccount")}
              </Link>
            </nav>
          )}
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