"use client";

import Link from "next/link";
import type { Route } from "next";

import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { getAppMessages } from "@/i18n/app-messages";
import { useMenuRegistry } from "@/features/navigation/menu-registry";

const menuId = "user-menu";

export function UserMenu({
  locale,
  isAuthenticated,
}: {
  locale: Locale;
  isAuthenticated: boolean;
}) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const { openId, toggle, close } = useMenuRegistry();
  const isOpen = openId === menuId;
  const items = [
    { href: `/${locale}/profile` as Route, label: app.myProfile },
    { href: `/${locale}/settings/profile` as Route, label: app.editProfile },
    { href: `/${locale}/settings/language` as Route, label: t("identity.nav.language") },
    { href: `/${locale}/settings/appearance` as Route, label: t("identity.nav.appearance") },
    { href: `/${locale}/settings` as Route, label: app.help },
  ];

  if (!isAuthenticated) {
    return (
      <div className="site-header__auth">
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
      </div>
    );
  }

  return (
    <div className="user-menu">
      <button
        className="user-menu__trigger"
        type="button"
        aria-label={app.accountMenuTitle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => toggle(menuId)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M5 19.5c1.4-2.8 4-4 7-4s5.6 1.2 7 4"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="user-menu__popover" role="menu" aria-label={app.accountMenuTitle}>
          <div className="user-menu__heading">
            <strong>{t("navigation.account")}</strong>
          </div>
          {items.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" onClick={close}>
              {item.label}
            </Link>
          ))}
          <form className="user-menu__signout" method="post" action={`/${locale}/auth/sign-out`}>
            <button type="submit">{t("navigation.signOut")}</button>
          </form>
        </div>
      )}
    </div>
  );
}