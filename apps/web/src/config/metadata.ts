import type { Metadata } from "next";

import type { Locale } from "@/config/locales";

const metadataCopy: Record<Locale, { description: string }> = {
  en: {
    description: "A considered digital ecosystem for identity, connection, and room to move.",
  },
  ar: {
    description: "منظومة رقمية مدروسة للهوية والتواصل ومساحة للحركة.",
  },
  es: {
    description: "Un espacio digital considerado para identidad y conexión.",
  },
  fr: {
    description: "Un espace numérique pensé pour l’identité et le lien.",
  },
  de: {
    description: "Ein bewusster digitaler Raum für Identität und Verbindung.",
  },
  tr: {
    description: "Kimlik ve bağlantı için düşünülmüş bir dijital alan.",
  },
  pt: {
    description: "Um espaço digital pensado para identidade e conexão.",
  },
  zh: {
    description: "为身份与连接而思考的数字空间。",
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
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/icons/icon-192.png",
    },
    appleWebApp: {
      capable: true,
      title: "XOWAAK",
      statusBarStyle: "black-translucent",
    },
  };
}
