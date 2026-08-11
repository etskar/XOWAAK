import { defaultLocale, type Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { LocaleSwitcher } from "@/features/localization/locale-switcher";

type RoutePlaceholderProps = {
  title: string;
  description?: string;
  locale?: Locale;
};

export function RoutePlaceholder({
  title,
  description,
  locale = defaultLocale,
}: RoutePlaceholderProps) {
  const { t } = createTranslator(locale);

  return (
    <main className="page-shell" aria-labelledby="route-title">
      <div className="page-card">
        <LocaleSwitcher locale={locale} />
        <p className="eyebrow">{t("common.routeShell")}</p>
        <h1 id="route-title">{title}</h1>
        <p>{description ?? t("common.reserved")}</p>
      </div>
    </main>
  );
}
