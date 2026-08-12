import Link from "next/link";
import type { Route } from "next";

import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";

export function AppNavigation({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const items = [
    { href: `/${locale}/home` as Route, label: t("navigation.home"), glyph: "⌂" },
    { href: `/${locale}/search` as Route, label: t("navigation.search"), glyph: "⌕" },
    { href: `/${locale}/messages` as Route, label: t("navigation.messages"), glyph: "··" },
    { href: `/${locale}/settings` as Route, label: t("navigation.settings"), glyph: "×" },
  ];

  return (
    <nav className="app-bottom-nav" aria-label={app.appNavigation}>
      <div className="app-bottom-nav__inner">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="app-bottom-nav__item">
            <span className="app-bottom-nav__glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
