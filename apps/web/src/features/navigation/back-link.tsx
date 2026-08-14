"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";

import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

export function BackLink({ locale, fallback }: { locale: Locale; fallback: string }) {
  const router = useRouter();
  const { t } = createTranslator(locale);

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback as Route);
    }
  }

  return (
    <button type="button" className="back-link" onClick={goBack}>
      <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4 6 10l6 6" />
      </svg>
      {t("common.back")}
    </button>
  );
}