import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { SettingsShell } from "@/features/settings/settings-shell";

type SettingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <SettingsShell locale={localeParam as Locale}>{children}</SettingsShell>;
}
