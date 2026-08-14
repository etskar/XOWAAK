import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getGroups, getJobs, getProducts, getServices } from "@/server/platform/queries";
import { getCurrentUser } from "@/server/auth/session";
import { ExploreView } from "@/features/explore/explore-view";

export const dynamic = "force-dynamic";

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const [products, services, jobs, groups] = await Promise.all([
    getProducts(4),
    getServices(4),
    getJobs(4),
    getGroups(4),
  ]);
  const user = await getCurrentUser();
  return (
    <ExploreView
      locale={locale}
      user={user}
      products={products}
      services={services}
      jobs={jobs}
      groups={groups}
    />
  );
}