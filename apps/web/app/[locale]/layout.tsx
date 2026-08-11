import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { appConfig } from "@/config/app";
import { getDirection, isLocale, locales, type Locale } from "@/config/locales";
import { getSiteMetadata } from "@/config/metadata";
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

  return (
    <html lang={locale} dir={getDirection(locale)} data-theme="light">
      <body>
        <a className="skip-link" href="#route-title">
          Skip to content
        </a>
        <div data-app-name={appConfig.name}>{children}</div>
      </body>
    </html>
  );
}
