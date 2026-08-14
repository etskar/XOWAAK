import { notFound, redirect } from "next/navigation";

import { isLocale, type Locale } from "@/config/locales";
import { getCurrentUser } from "@/server/auth/session";
import { getJob } from "@/server/platform/queries";
import { PlatformCreationForm } from "@/features/platform/platform-creation-form";

type EditJobPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { locale: localeParam, id } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/sign-in?next=/${locale}/jobs/${id}/edit`);

  const result = await getJob(id);
  if (result.status !== "ok" || !result.data) notFound();
  if (String(result.data.ownerUserId) !== user.id) redirect(`/${locale}/jobs/${id}`);

  const record = result.data;

  return (
    <main className="settings-page" data-locale={locale}>
      <PlatformCreationForm
        locale={locale}
        kind="jobs"
        mode="edit"
        recordId={id}
        existingImageUrl={record.imageUrl}
        initialValues={{
          title: record.title,
          description: record.description ?? "",
          employerName: record.employerName ?? "",
          requirements: record.requirements ?? "",
          jobType: record.jobType ?? "other",
          salaryMin: record.salaryMin !== null ? String(record.salaryMin) : "",
          salaryMax: record.salaryMax !== null ? String(record.salaryMax) : "",
          currency: record.currency,
          locationLabel: record.locationLabel ?? "",
          latitude: record.latitude !== null ? String(record.latitude) : "",
          longitude: record.longitude !== null ? String(record.longitude) : "",
        }}
      />
    </main>
  );
}