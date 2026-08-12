import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { PlatformCreationForm } from "@/features/platform/platform-creation-form";

export const dynamic = "force-dynamic";

export default async function NewServicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  return (
    <main className="platform-page">
      <PlatformCreationForm locale={localeParam as Locale} kind="services" />
    </main>
  );
}
