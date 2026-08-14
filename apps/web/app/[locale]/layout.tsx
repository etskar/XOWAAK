import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { appConfig } from "@/config/app";
import { getDirection, isLocale, locales, type Locale } from "@/config/locales";
import { getSiteMetadata } from "@/config/metadata";
import { createTranslator } from "@/i18n/translate";
import { SiteFooter } from "@/features/navigation/site-header";
import { SiteHeaderContainer } from "@/features/navigation/site-header-container";
import { PwaRegister } from "@/features/pwa/pwa-register";
import "../globals.css";

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d161d" },
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return getSiteMetadata(localeParam as Locale);
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const { t } = createTranslator(locale);

  return (
    <html lang={locale} dir={getDirection(locale)} data-theme="light">
      <body>
        <a className="skip-link" href="#main-content">
          {t("common.skipToContent")}
        </a>
        <div className="site-root" data-app-name={appConfig.name}>
          <PwaRegister />
          <Suspense fallback={<div className="site-header__fallback" aria-hidden="true" />}>
            <SiteHeaderContainer locale={locale} />
          </Suspense>
          <div id="main-content">{children}</div>
          <Suspense fallback={null}>
            <SiteFooter locale={locale} />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
