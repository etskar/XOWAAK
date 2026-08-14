import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { getLandingMessages } from "@/i18n/landing-messages";
import { ShowcasePage } from "@/features/showcase/showcase-page";

type PublicHomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PublicHomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const landing = getLandingMessages(locale);
  const title = `${landing.hero.title} — XOWAAK`;
  const description = landing.hero.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
    },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "XOWAAK",
      locale,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <ShowcasePage locale={locale} />;
}
