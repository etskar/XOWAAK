import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { appConfig } from "@/config/app";
import { getDirection, isLocale, locales, type Locale } from "@/config/locales";
import { getSiteMetadata } from "@/config/metadata";
import { createTranslator } from "@/i18n/translate";
import { SiteFooter } from "@/features/navigation/site-header";
import { SiteHeaderContainer } from "@/features/navigation/site-header-container";
import { isAppExperiencePath } from "@/features/navigation/routes";
import { PwaRegister } from "@/features/pwa/pwa-register";
import { getCurrentUser } from "@/server/auth/session";
import "../globals.css";

export const viewport: Viewport = {
  colorScheme: "light dark",
  viewportFit: "cover",
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
  const headerStore = await headers();
  const pathname = headerStore.get("x-xowaak-pathname") ?? "";
  const isAppExperience = isAppExperiencePath(pathname, locale);
  const user = await getCurrentUser();
  const showPublicFooter = !isAppExperience || !user;

  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("xowaak-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})();`,
          }}
        />
      </head>
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
          {showPublicFooter && (
            <Suspense fallback={null}>
              <SiteFooter locale={locale} />
            </Suspense>
          )}
        </div>
      </body>
    </html>
  );
}
