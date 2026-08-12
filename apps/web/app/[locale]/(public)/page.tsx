import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";
import { ShowcasePage } from "@/features/showcase/showcase-page";

type PublicHomePageProps = { params: Promise<{ locale: string }> };

export default async function PublicHomePage({ params }: PublicHomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  return <ShowcasePage locale={locale} />;
}
