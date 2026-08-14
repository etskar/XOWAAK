"use client";

import Link from "next/link";
import type { Route } from "next";

import { Avatar } from "@/design-system";
import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { getAppMessages } from "@/i18n/app-messages";
import { useMenuRegistry } from "@/features/navigation/menu-registry";

const menuId = "user-menu";

export function UserMenu({
  locale,
  isAuthenticated,
  avatarUrl = null,
  displayName = null,
}: {
  locale: Locale;
  isAuthenticated: boolean;
  avatarUrl?: string | null;
  displayName?: string | null;
}) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const { openId, toggle, close } = useMenuRegistry();
  const isOpen = openId === menuId;
  const items = [
    { href: `/${locale}/profile` as Route, label: app.myProfile },
    { href: `/${locale}/settings/profile` as Route, label: app.editProfile },
    { href: `/${locale}/settings` as Route, label: t("navigation.settings") },
    { href: `/${locale}/settings/language` as Route, label: t("identity.nav.language") },
    { href: `/${locale}/settings/appearance` as Route, label: t("identity.nav.appearance") },
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
        <Avatar
          name={displayName?.trim() ? displayName : "X"}
          src={avatarUrl ?? undefined}
          alt={app.accountMenuTitle}
          size="sm"
        />
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
