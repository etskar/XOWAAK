import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { ShowcasePage } from "@/features/showcase/showcase-page";

type AboutPageProps = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <ShowcasePage locale={locale} mode="about" />;
}
