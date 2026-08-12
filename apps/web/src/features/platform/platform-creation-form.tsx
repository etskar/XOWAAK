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
import { createGroup, createJob, createProduct, createService } from "@/server/platform/actions";
import type { PlatformKind } from "@/features/platform/platform-view";

type CreationValues = Record<string, string>;

function initialValues(kind: PlatformKind): CreationValues {
  return kind === "groups"
    ? { name: "", description: "", visibility: "public", imageMediaAssetId: "" }
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

export function PlatformCreationForm({ locale, kind }: { locale: Locale; kind: PlatformKind }) {
  const messages = getPlatformMessages(locale);
  const router = useRouter();
  const [values, setValues] = useState<CreationValues>(() => initialValues(kind));
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const title =
    kind === "products"
      ? messages.createProduct
      : kind === "services"
        ? messages.createService
        : kind === "jobs"
          ? messages.createJob
          : messages.createGroup;

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    startTransition(() => {
      void (async () => {
        const action =
          kind === "products"
            ? createProduct
            : kind === "services"
              ? createService
              : kind === "jobs"
                ? createJob
                : createGroup;
        const result = await action(values);
        if (!result.ok) {
          setStatus(
            result.code === "profile_incomplete" ? messages.profileIncomplete : messages.saveError,
          );
          return;
        }
        router.push(`/${locale}/${kind}/${result.id}` as Route);
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

  return (
    <form className="platform-form" onSubmit={submit} noValidate>
      <Stack gap={5}>
        <div className="platform-form__heading">
          <p className="showcase-eyebrow">XOWAAK / CREATE</p>
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
          <Select
            label={messages.visibility}
            options={[
              { id: "public", label: messages.public },
              { id: "private", label: messages.private },
            ]}
            selectedKey={values.visibility}
            onSelectionChange={(key) => setValue("visibility", String(key))}
          />
        )}
        {locationFields}
        <MediaUpload
          locale={locale}
          bucket="platform-media"
          label={messages.title}
          helpText={messages.coordinatesHint}
          uploadLabel={messages.title}
          failedLabel={messages.saveError}
          accept="image/*"
          multiple={false}
          maxFiles={1}
          disabled={isPending}
          onAssetIdsChange={(assetIds) => setValue("imageMediaAssetId", assetIds[0] ?? "")}
        />
        <div className="platform-form__actions">
          <Link
            className="showcase-button showcase-button--secondary"
            href={`/${locale}/${kind}` as Route}
          >
            {messages.cancel}
          </Link>
          <Button type="submit" loading={isPending} isDisabled={isPending}>
            {messages.publish}
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
