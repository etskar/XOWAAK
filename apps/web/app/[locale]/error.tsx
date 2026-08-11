"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

type LocaleErrorProps = {
  reset: () => void;
};

export default function LocaleError({ reset }: LocaleErrorProps) {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? defaultLocale;
  const locale: Locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const { t } = createTranslator(locale);

  return (
    <main className="page-shell" role="alert" aria-labelledby="error-title">
      <div className="page-card">
        <p className="eyebrow">{t("errors.unexpected")}</p>
        <h1 id="error-title">{t("common.unexpectedError")}</h1>
        <p>{t("errors.reload")}</p>
        <button className="button" type="button" onClick={reset}>
          {t("common.retry")}
        </button>
      </div>
    </main>
  );
}
