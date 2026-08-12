"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { getLocaleConfig, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { getAppMessages } from "@/i18n/app-messages";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";
import { ThemeToggle } from "@/features/navigation/theme-toggle";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { Avatar } from "@/design-system";
import { cx } from "@/design-system/utils/cx";

type SiteHeaderProps = {
  locale: Locale;
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
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function AccountMenu({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const [isOpen, setIsOpen] = useState(false);
  const items = [
    { href: `/${locale}/settings/profile` as Route, label: t("navigation.profile") },
    { href: `/${locale}/settings` as Route, label: t("navigation.settings") },
    { href: `/${locale}/settings/account` as Route, label: t("navigation.account") },
    { href: `/${locale}/settings/security` as Route, label: t("identity.nav.security") },
    { href: `/${locale}/settings/devices` as Route, label: t("identity.nav.devices") },
  ];

  return (
    <div className="account-menu">
      <button
        className="account-menu__trigger"
        type="button"
        aria-label={app.accountMenuTitle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Avatar name={t("navigation.account")} size="sm" />
      </button>
      {isOpen && (
        <div className="account-menu__popover" role="menu" aria-label={app.accountMenuTitle}>
          <div className="account-menu__heading">
            <span className="account-menu__eyebrow">XOWAAK</span>
            <strong>{t("navigation.account")}</strong>
          </div>
          {items.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          ))}
          <form method="post" action={`/${locale}/auth/sign-out`}>
            <button type="submit">{t("navigation.signOut")}</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const { t } = createTranslator(locale);
  const [isOpen, setIsOpen] = useState(false);
  const config = getLocaleConfig(locale);
  const isApp = isApplicationPath(pathname, locale);
  const links = isApp
    ? [
        { href: `/${locale}/home` as Route, label: t("navigation.home") },
        { href: `/${locale}/search` as Route, label: t("navigation.search") },
        { href: `/${locale}/products` as Route, label: t("navigation.products") },
        { href: `/${locale}/map` as Route, label: t("navigation.map") },
        { href: `/${locale}/services` as Route, label: t("navigation.services") },
        { href: `/${locale}/messages` as Route, label: t("navigation.messages") },
        { href: `/${locale}/notifications` as Route, label: t("navigation.notifications") },
      ]
    : [
        { href: `/${locale}` as Route, label: t("navigation.landing") },
        { href: `/${locale}/about` as Route, label: t("navigation.about") },
        { href: `/${locale}/explore` as Route, label: t("navigation.discover") },
        { href: `/${locale}/home` as Route, label: t("navigation.home") },
      ];

  return (
    <header className={`site-header${isApp ? " site-header--app" : ""}`}>
      <div className="site-header__inner">
        <Link className="site-brand" href={`/${locale}` as Route} aria-label={config.name}>
          <BrandMark />
          <span className="site-brand__word">XOWAAK</span>
        </Link>

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

        <div className="site-header__actions">
          <InstallAppButton locale={locale} />
          <LocaleSwitcher locale={locale} compact />
          <ThemeToggle locale={locale} />
          {isApp ? (
            <AccountMenu locale={locale} />
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
        </div>

        <nav
          id="mobile-product-navigation"
          className="site-nav site-nav--mobile"
          data-open={isOpen || undefined}
          aria-label={t("navigation.productNavigation")}
        >
          {!isApp &&
            links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          {isApp ? (
            <>
              <Link
                href={`/${locale}/products` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.products")}
              </Link>
              <Link
                href={`/${locale}/services` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.services")}
              </Link>
              <Link
                href={`/${locale}/jobs` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.jobs")}
              </Link>
              <Link
                href={`/${locale}/groups` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.groups")}
              </Link>
              <Link
                href={`/${locale}/map` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.map")}
              </Link>
              <Link
                href={`/${locale}/notifications` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.notifications")}
              </Link>
              <Link
                href={`/${locale}/settings` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.settings")}
              </Link>
              <Link
                href={`/${locale}/followers/requests` as Route}
                className="site-nav__mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {t("navigation.followRequests")}
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </nav>
      </div>
    </header>
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
