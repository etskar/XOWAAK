"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";

type Theme = "light" | "dark";

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56m11.02 11.02 1.56 1.56M2 12h2.2m15.6 0H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.3 15.3A8.5 8.5 0 0 1 8.7 3.7 8.5 8.5 0 1 0 20.3 15.3Z" />
    </svg>
  );
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("xowaak-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const nextTheme = stored === "dark" || stored === "light" ? stored : preferred;
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggle() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("xowaak-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={t("common.toggleTheme")}
    >
      <span className="theme-toggle__icon">{theme === "dark" ? <SunIcon /> : <MoonIcon />}</span>
      <span className="sr-only">{t("common.toggleTheme")}</span>
    </button>
  );
}
