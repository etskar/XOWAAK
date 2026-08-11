"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main className="page-shell" aria-labelledby="route-title">
      <div className="page-card">
        <p className="eyebrow">{t("common.notFound")}</p>
        <h1 id="route-title">{t("errors.notFound")}</h1>
        <p>{t("errors.unavailable")}</p>
      </div>
    </main>
  );
}
