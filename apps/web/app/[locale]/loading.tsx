"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

export default function LocaleLoading() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main className="page-shell" aria-busy="true" aria-label={t("common.loading")}>
      <div className="page-card loading-card">
        <span className="loading-bar" aria-hidden="true" />
        <p>{t("common.loadingXowaak")}</p>
      </div>
    </main>
  );
}
