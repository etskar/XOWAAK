import { notFound } from "next/navigation";

import { Badge, Container } from "@/design-system";
import { isLocale, type Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { SearchExperience } from "@/features/platform/search-experience";

export const dynamic = "force-dynamic";

type SearchPageProps = { params: Promise<{ locale: string }> };

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);

  return (
    <main className="app-surface app-search-page">
      <Container size="lg">
        <div className="app-surface__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / {t("navigation.search")}</p>
            <h1 className="ds-text-h1">{app.searchTitle}</h1>
            <p>{app.searchDescription}</p>
          </div>
          <Badge variant="warning">{app.unavailable}</Badge>
        </div>
        <SearchExperience locale={locale} />
      </Container>
    </main>
  );
}
