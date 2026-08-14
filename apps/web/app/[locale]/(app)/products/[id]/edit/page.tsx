import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { getProduct } from "@/server/platform/queries";
import { PlatformCreationForm } from "@/features/platform/platform-creation-form";

type EditProductPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { locale: localeParam, id } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/products/${id}/edit`);

  const result = await getProduct(id);
  if (result.status !== "ok" || !result.data) notFound();
  if (String(result.data.ownerUserId) !== user.id) redirect(`/${locale}/products/${id}`);

  const record = result.data;

  return (
    <main className="settings-page" data-locale={locale}>
      <PlatformCreationForm
        locale={locale}
        kind="products"
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