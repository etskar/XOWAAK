import { z } from "zod";

const optionalCoordinate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().finite().optional(),
);

const locationFields = {
  locationLabel: z.string().trim().max(240, "Location is too long.").optional().default(""),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
};

const mediaFields = {
  imageMediaAssetId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().uuid().optional(),
  ),
};

const withCoordinates = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ ...shape, ...locationFields, ...mediaFields }).superRefine((value, context) => {
    const coordinates = value as { latitude?: number; longitude?: number };
    const hasLatitude = coordinates.latitude !== undefined;
    const hasLongitude = coordinates.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: "custom",
        path: [hasLatitude ? "longitude" : "latitude"],
        message: "Both coordinates are required.",
      });
    }
  });

export const productSchema = withCoordinates({
  title: z.string().trim().min(1, "Enter a product title.").max(180, "Product title is too long."),
  description: z
    .string()
    .trim()
    .max(5000, "Product description is too long.")
    .optional()
    .default(""),
  category: z.string().trim().max(120, "Category is too long.").optional().default(""),
  price: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().finite().min(0).optional(),
  ),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a three-letter currency code.")
    .default("USD"),
});

export const serviceSchema = withCoordinates({
  title: z.string().trim().min(1, "Enter a service title.").max(180, "Service title is too long."),
  description: z
    .string()
    .trim()
    .max(5000, "Service description is too long.")
    .optional()
    .default(""),
  category: z.string().trim().max(120, "Category is too long.").optional().default(""),
  price: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().finite().min(0).optional(),
  ),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a three-letter currency code.")
    .default("USD"),
});

export const jobSchema = withCoordinates({
  title: z.string().trim().min(1, "Enter a job title.").max(180, "Job title is too long."),
  employerName: z.string().trim().max(180, "Employer name is too long.").optional().default(""),
  description: z.string().trim().max(10000, "Job description is too long.").optional().default(""),
  requirements: z.string().trim().max(10000, "Requirements are too long.").optional().default(""),
  jobType: z
    .enum(["full_time", "part_time", "contract", "temporary", "internship", "other"])
    .optional(),
  salaryMin: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().finite().min(0).optional(),
  ),
  salaryMax: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().finite().min(0).optional(),
  ),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a three-letter currency code.")
    .default("USD"),
}).superRefine((value, context) => {
  if (
    value.salaryMin !== undefined &&
    value.salaryMax !== undefined &&
    value.salaryMin > value.salaryMax
  ) {
    context.addIssue({
      code: "custom",
      path: ["salaryMax"],
      message: "Maximum salary must be greater than minimum salary.",
    });
  }
});

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Enter a group name.").max(160, "Group name is too long."),
  description: z.string().trim().max(5000, "Group description is too long.").optional().default(""),
  visibility: z.enum(["public", "private"]).default("public"),
  ...mediaFields,
});

export type PlatformLocationInput = z.infer<typeof productSchema>;
