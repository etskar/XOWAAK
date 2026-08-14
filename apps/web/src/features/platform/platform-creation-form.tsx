"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Input, Select, Stack, Textarea } from "@/design-system";
import { MediaUpload } from "@/features/media/media-upload";
import type { Locale } from "@/config/locales";
import { getPlatformMessages } from "@/i18n/platform-messages";
import {
  createGroup,
  createJob,
  createProduct,
  createService,
  updateGroup,
  updateJob,
  updateProduct,
  updateService,
} from "@/server/platform/actions";
import type { PlatformKind } from "@/features/platform/platform-view";

export type PlatformFormValues = Record<string, string>;

export type PlatformFormProps = {
  locale: Locale;
  kind: PlatformKind;
  mode?: "create" | "edit";
  initialValues?: PlatformFormValues;
  existingImageUrl?: string | null;
  recordId?: string;
};

function initialValues(kind: PlatformKind): PlatformFormValues {
  return kind === "groups"
    ? { name: "", description: "", visibility: "public", type: "social", imageMediaAssetId: "" }
    : {
        title: "",
        description: "",
        category: "",
        price: "",
        currency: "USD",
        locationLabel: "",
        latitude: "",
        longitude: "",
        employerName: "",
        requirements: "",
        jobType: "other",
        salaryMin: "",
        salaryMax: "",
        imageMediaAssetId: "",
      };
}

export function PlatformCreationForm({
  locale,
  kind,
  mode = "create",
  initialValues: providedValues,
  existingImageUrl = null,
  recordId,
}: PlatformFormProps) {
  const messages = getPlatformMessages(locale);
  const router = useRouter();
  const [values, setValues] = useState<PlatformFormValues>(() =>
    providedValues ? { ...initialValues(kind), ...providedValues } : initialValues(kind),
  );
  const [stage, setStage] = useState<"edit" | "preview">("edit");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = mode === "edit";
  const title =
    kind === "products"
      ? isEditing
        ? messages.editProduct
        : messages.createProduct
      : kind === "services"
        ? isEditing
          ? messages.editService
          : messages.createService
        : kind === "jobs"
          ? isEditing
            ? messages.editJob
            : messages.createJob
          : isEditing
            ? messages.editGroup
            : messages.createGroup;

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (!recordId) {
      setStage("preview");
      return;
    }
    publish();
  }

  function publish() {
    startTransition(() => {
      void (async () => {
        const action =
          kind === "products"
            ? isEditing
              ? updateProduct
              : createProduct
            : kind === "services"
              ? isEditing
                ? updateService
                : createService
              : kind === "jobs"
                ? isEditing
                  ? updateJob
                  : createJob
                : isEditing
                  ? updateGroup
                  : createGroup;
        const payload = isEditing
          ? { id: recordId, ...values }
          : values;
        const result = await action(payload);
        if (!result.ok) {
          setStatus(
            result.code === "profile_incomplete" ? messages.profileIncomplete : messages.saveError,
          );
          return;
        }
        router.push(`/${locale}/${kind}/${result.id}` as Route);
        router.refresh();
      })();
    });
  }

  const locationFields =
    kind !== "groups" ? (
      <div className="platform-form__location">
        <Input
          label={messages.location}
          value={values.locationLabel ?? ""}
          onChange={(value) => setValue("locationLabel", value)}
          inputProps={{ name: "locationLabel", type: "text", autoComplete: "address-level2" }}
        />
        <div className="platform-form__coordinates">
          <Input
            label={messages.latitude}
            value={values.latitude ?? ""}
            onChange={(value) => setValue("latitude", value)}
            inputProps={{ name: "latitude", type: "number", inputMode: "decimal", step: "any" }}
          />
          <Input
            label={messages.longitude}
            value={values.longitude ?? ""}
            onChange={(value) => setValue("longitude", value)}
            inputProps={{ name: "longitude", type: "number", inputMode: "decimal", step: "any" }}
          />
        </div>
        <p className="platform-form__hint">{messages.coordinatesHint}</p>
      </div>
    ) : null;

  if (stage === "preview") {
    return (
      <div className="platform-form" data-locale={locale}>
        <Stack gap={5}>
          <div className="platform-form__heading">
            <p className="showcase-eyebrow">XOWAAK / PREVIEW</p>
            <h1 className="ds-text-h2">{title}</h1>
          </div>
          <article className="post-preview-card">
            <p className="post-preview-card__content" dir="auto">
              {values.name || values.title}
            </p>
            {values.description && (
              <p className="post-preview-card__content" dir="auto">
                {values.description}
              </p>
            )}
            {(values.category || values.employerName) && (
              <p className="post-preview-card__content" dir="auto">
                {[values.category, values.employerName].filter(Boolean).join(" · ")}
              </p>
            )}
            {(values.price || values.salaryMin || values.salaryMax) && (
              <p className="post-preview-card__content" dir="auto">
                {[
                  values.price ? `${values.price} ${values.currency}` : null,
                  values.salaryMin ? `${messages.salaryMin}: ${values.salaryMin}` : null,
                  values.salaryMax ? `${messages.salaryMax}: ${values.salaryMax}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {values.locationLabel && (
              <p className="post-preview-card__content" dir="auto">
                {values.locationLabel}
              </p>
            )}
          </article>
          <div className="platform-form__actions">
            <Button variant="secondary" onPress={() => setStage("edit")} isDisabled={isPending}>
              {messages.backToEdit}
            </Button>
            <Button type="button" onPress={publish} loading={isPending} isDisabled={isPending}>
              {messages.publish}
            </Button>
          </div>
          {status && (
            <p className="settings-status" role="alert">
              {status}
            </p>
          )}
        </Stack>
      </div>
    );
  }

  return (
    <form className="platform-form" onSubmit={submit} noValidate>
      <Stack gap={5}>
        <div className="platform-form__heading">
          <p className="showcase-eyebrow">XOWAAK / {isEditing ? "EDIT" : "CREATE"}</p>
          <h1 className="ds-text-h2">{title}</h1>
        </div>
        {kind === "groups" ? (
          <Input
            label={messages.title}
            value={values.name}
            onChange={(value) => setValue("name", value)}
            isRequired
            inputProps={{ name: "name", type: "text" }}
          />
        ) : (
          <Input
            label={messages.title}
            value={values.title}
            onChange={(value) => setValue("title", value)}
            isRequired
            inputProps={{ name: "title", type: "text" }}
          />
        )}
        <Textarea
          label={messages.description}
          value={values.description}
          onChange={(value) => setValue("description", value)}
          textareaClassName="platform-form__textarea"
        />
        {kind !== "groups" && (
          <Input
            label={messages.category}
            value={values.category ?? ""}
            onChange={(value) => setValue("category", value)}
            inputProps={{ name: "category", type: "text" }}
          />
        )}
        {kind === "jobs" && (
          <>
            <Input
              label={messages.employer}
              value={values.employerName ?? ""}
              onChange={(value) => setValue("employerName", value)}
              inputProps={{ name: "employerName", type: "text" }}
            />
            <Textarea
              label={messages.requirements}
              value={values.requirements ?? ""}
              onChange={(value) => setValue("requirements", value)}
            />
          </>
        )}
        {kind !== "groups" && (
          <div className="platform-form__inline">
            <Input
              label={messages.price}
              value={values.price ?? ""}
              onChange={(value) => setValue("price", value)}
              inputProps={{
                name: "price",
                type: "number",
                inputMode: "decimal",
                min: "0",
                step: "0.01",
              }}
            />
            <Input
              label={messages.currency}
              value={values.currency ?? "USD"}
              onChange={(value) => setValue("currency", value)}
              inputProps={{ name: "currency", type: "text", maxLength: 3 }}
            />
          </div>
        )}
        {kind === "jobs" && (
          <>
            <Select
              label={messages.jobType}
              options={Object.entries(messages.jobTypes).map(([id, label]) => ({ id, label }))}
              selectedKey={values.jobType}
              onSelectionChange={(key) => setValue("jobType", String(key))}
            />
            <div className="platform-form__inline">
              <Input
                label={messages.salaryMin}
                value={values.salaryMin ?? ""}
                onChange={(value) => setValue("salaryMin", value)}
                inputProps={{
                  name: "salaryMin",
                  type: "number",
                  inputMode: "decimal",
                  min: "0",
                  step: "0.01",
                }}
              />
              <Input
                label={messages.salaryMax}
                value={values.salaryMax ?? ""}
                onChange={(value) => setValue("salaryMax", value)}
                inputProps={{
                  name: "salaryMax",
                  type: "number",
                  inputMode: "decimal",
                  min: "0",
                  step: "0.01",
                }}
              />
            </div>
          </>
        )}
        {kind === "groups" && (
          <>
            <Select
              label={messages.visibility}
              options={[
                { id: "public", label: messages.public },
                { id: "private", label: messages.private },
              ]}
              selectedKey={values.visibility}
              onSelectionChange={(key) => setValue("visibility", String(key))}
            />
            <Select
              label={messages.groupType}
              options={[
                { id: "social", label: messages.social },
                { id: "channel", label: messages.channel },
              ]}
              selectedKey={values.type ?? "social"}
              onSelectionChange={(key) => setValue("type", String(key))}
            />
          </>
        )}
        {locationFields}
        <MediaUpload
          locale={locale}
          bucket="platform-media"
          label={messages.image}
          helpText={messages.coordinatesHint}
          uploadLabel={messages.image}
          failedLabel={messages.saveError}
          accept="image/*"
          multiple={false}
          maxFiles={1}
          disabled={isPending}
          onAssetIdsChange={(assetIds) => setValue("imageMediaAssetId", assetIds[0] ?? "")}
        />
        {isEditing && existingImageUrl && !values.imageMediaAssetId && (
          <div className="media-upload__current">
            <span className="media-upload__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={existingImageUrl} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="media-upload__meta">{messages.image}</span>
          </div>
        )}
        <div className="platform-form__actions">
          <Link
            className="showcase-button showcase-button--secondary"
            href={(isEditing ? `/${locale}/${kind}/${recordId}` : `/${locale}/${kind}`) as Route}
          >
            {messages.cancel}
          </Link>
          <Button type="submit" loading={isPending} isDisabled={isPending}>
            {isEditing ? messages.publish : messages.preview}
          </Button>
        </div>
        {status && (
          <p className="settings-status" role="alert">
            {status}
          </p>
        )}
      </Stack>
    </form>
  );
}