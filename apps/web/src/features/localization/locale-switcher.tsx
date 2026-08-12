"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getLocaleConfig, locales, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { getLocaleFromPathname, replacePathLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  locale: Locale;
  compact?: boolean;
};

export function LocaleSwitcher({ locale, compact = false }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const searchParams = useSearchParams();
  const currentLocale = getLocaleFromPathname(pathname);
  const { t } = createTranslator(currentLocale);

  function handleChange(nextLocale: Locale) {
    const nextPath = replacePathLocale(pathname, nextLocale);
    const query = searchParams.toString();
    router.replace(`${nextPath}${query ? `?${query}` : ""}` as Route);
  }

  return (
    <label className="locale-switcher">
      <span className="sr-only">{t("common.language")}</span>
      <select
        aria-label={t("common.language")}
        value={currentLocale}
        onChange={(event) => handleChange(event.target.value as Locale)}
      >
        {locales.map((option) => {
          const config = getLocaleConfig(option);
          return (
            <option key={config.code} value={config.code}>
              {compact ? config.code.toUpperCase() : config.nativeName}
            </option>
          );
        })}
      </select>
    </label>
  );
}
