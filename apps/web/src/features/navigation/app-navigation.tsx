"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { cx } from "@/design-system/utils/cx";

type NavItemProps = {
  href: Route;
  label: string;
  isActive: boolean;
  children: React.ReactNode;
};

function NavItem({ href, label, isActive, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cx("app-bottom-nav__item", isActive && "app-bottom-nav__item--active")}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="app-bottom-nav__icon" aria-hidden="true">
        {children}
      </span>
      <span className="app-bottom-nav__label">{label}</span>
    </Link>
  );
}

function isNavActive(pathname: string, locale: Locale, href: Route) {
  const prefix = `/${locale}`;
  const path = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const target = href.slice(prefix.length);
  if (target === "/home") return path === "/home";
  if (target === "/marketplace") {
    return (
      path === "/marketplace" ||
      path.startsWith("/marketplace/") ||
      path === "/products" ||
      path.startsWith("/products/") ||
      path === "/services" ||
      path.startsWith("/services/")
    );
  }
  return path === target || path.startsWith(`${target}/`);
}

export function AppNavigation({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const pathname = usePathname() ?? `/${locale}`;

  const items = [
    {
      href: `/${locale}/home` as Route,
      label: t("navigation.home"),
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-5h-4v5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
          />
        </svg>
      ),
    },
    {
      href: `/${locale}/marketplace` as Route,
      label: app.marketplace,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 8.5h14l-1 11a1.5 1.5 0 0 1-1.5 1.3h-9A1.5 1.5 0 0 1 6 19.5l-1-11Z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M8.5 10.5V6.5a3.5 3.5 0 0 1 7 0v4"
          />
        </svg>
      ),
    },
    {
      href: `/${locale}/groups` as Route,
      label: t("navigation.groups"),
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="9" cy="8.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M3.5 19c1.1-2.6 3.1-3.9 5.5-3.9s4.4 1.3 5.5 3.9"
          />
          <circle cx="16.5" cy="9.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M15.5 15.6c2.3.2 4.1 1.4 5 3.4"
          />
        </svg>
      ),
    },
    {
      href: `/${locale}/jobs` as Route,
      label: t("navigation.jobs"),
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect
            x="4"
            y="7.5"
            width="16"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"
          />
        </svg>
      ),
    },
    {
      href: `/${locale}/messages` as Route,
      label: t("navigation.messages"),
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3.5V6Z"
          />
        </svg>
      ),
    },
    {
      href: `/${locale}/profile` as Route,
      label: app.myProfile,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M5 19.5c1.4-2.8 4-4 7-4s5.6 1.2 7 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="app-bottom-nav" aria-label={app.appNavigation}>
      <div className="app-bottom-nav__inner">
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={isNavActive(pathname, locale, item.href)}
          >
            {item.icon}
          </NavItem>
        ))}
      </div>
    </nav>
  );
}