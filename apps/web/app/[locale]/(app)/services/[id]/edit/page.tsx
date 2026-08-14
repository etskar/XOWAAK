import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { getServicesById } from "@/server/platform/queries";
import { PlatformCreationForm } from "@/features/platform/platform-creation-form";

type EditServicePageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { locale: localeParam, id } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/services/${id}/edit`);

  const result = await getServicesById(id);
  if (result.status !== "ok" || !result.data) notFound();
  if (String(result.data.providerUserId) !== user.id) redirect(`/${locale}/services/${id}`);

  const record = result.data;

  return (
    <main className="settings-page" data-locale={locale}>
      <PlatformCreationForm
        locale={locale}
        kind="services"
        mode="edit"
        recordId={id}
        existingImageUrl={record.imageUrl}
        initialValues={{
          title: record.title,
          description: record.description ?? "",
          category: record.category ?? "",
          price: record.price !== null ? String(record.price) : "",
          currency: record.currency,
          locationLabel: record.locationLabel ?? "",
          latitude: record.latitude !== null ? String(record.latitude) : "",
          longitude: record.longitude !== null ? String(record.longitude) : "",
        }}
      />
    </main>
  );
}