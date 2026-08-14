import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { getGroup } from "@/server/platform/queries";
import { PlatformCreationForm } from "@/features/platform/platform-creation-form";

type EditGroupPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { locale: localeParam, id } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/groups/${id}/edit`);

  const result = await getGroup(id);
  if (result.status !== "ok" || !result.data) notFound();
  if (String(result.data.ownerUserId) !== user.id) redirect(`/${locale}/groups/${id}`);

  const record = result.data;

  return (
    <main className="settings-page" data-locale={locale}>
      <PlatformCreationForm
        locale={locale}
        kind="groups"
        mode="edit"
        recordId={id}
        existingImageUrl={record.imageUrl}
        initialValues={{
          name: record.name,
          description: record.description ?? "",
          visibility: record.visibility,
          type: record.type,
        }}
      />
    </main>
  );
}