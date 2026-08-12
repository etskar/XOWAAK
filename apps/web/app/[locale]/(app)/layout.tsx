import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { AppNavigation } from "@/features/navigation/app-navigation";

export const dynamic = "force-dynamic";

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/home`);

  return (
    <div className="app-shell">
      <div className="app-shell__content">{children}</div>
      <AppNavigation locale={locale} />
    </div>
  );
}
