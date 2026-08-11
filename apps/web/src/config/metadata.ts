import type { Metadata } from "next";

import type { Locale } from "@/config/locales";

const metadataCopy: Record<Locale, { description: string }> = {
  en: {
    description: "XOWAAK digital ecosystem foundation",
  },
  ar: {
    description: "الأساس التقني لمنظومة XOWAAK الرقمية",
  },
};

export function getSiteMetadata(locale: Locale): Metadata {
  const { description } = metadataCopy[locale];

  return {
    title: "XOWAAK",
    description,
    applicationName: "XOWAAK",
    openGraph: {
      type: "website",
      title: "XOWAAK",
      description,
      siteName: "XOWAAK",
      locale,
    },
    twitter: {
      card: "summary",
      title: "XOWAAK",
      description,
    },
  };
}
