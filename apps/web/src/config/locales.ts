export type TextDirection = "ltr" | "rtl";

export type LocaleConfig = {
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  enabled: boolean;
};

export const localeConfigs = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
    enabled: true,
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    enabled: true,
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    enabled: true,
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
    enabled: true,
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
    enabled: true,
  },
  tr: {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    direction: "ltr",
    enabled: true,
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    direction: "ltr",
    enabled: true,
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    direction: "ltr",
    enabled: true,
  },
} as const satisfies Record<string, LocaleConfig>;

export const locales = ["en", "ar", "es", "fr", "de", "tr", "pt", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeDirections: Record<Locale, TextDirection> = {
  en: localeConfigs.en.direction,
  ar: localeConfigs.ar.direction,
  es: localeConfigs.es.direction,
  fr: localeConfigs.fr.direction,
  de: localeConfigs.de.direction,
  tr: localeConfigs.tr.direction,
  pt: localeConfigs.pt.direction,
  zh: localeConfigs.zh.direction,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale) && localeConfigs[value as Locale].enabled;
}

export const isSupportedLocale = isLocale;

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return localeConfigs[locale];
}

export function getDirection(locale: Locale): TextDirection {
  return getLocaleConfig(locale).direction;
}

export function isRTL(locale: Locale) {
  return getDirection(locale) === "rtl";
}

export function isLTR(locale: Locale) {
  return getDirection(locale) === "ltr";
}
