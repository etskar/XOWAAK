import { describe, expect, it } from "vitest";

import { groupSchema, jobSchema, productSchema } from "@/domains/platform/validation";

describe("platform domain validation", () => {
  it("accepts a product with a complete coordinate pair", () => {
    const result = productSchema.safeParse({
      title: "A product",
      price: "12.50",
      latitude: "40.7",
      longitude: "-74",
    });
    expect(result.success).toBe(true);
  });

  it("rejects incomplete coordinates", () => {
    const result = productSchema.safeParse({ title: "A product", latitude: "40.7" });
    expect(result.success).toBe(false);
  });

  it("rejects an inverted job salary range", () => {
    const result = jobSchema.safeParse({ title: "A role", salaryMin: "100", salaryMax: "50" });
    expect(result.success).toBe(false);
  });

  it("accepts explicit group visibility", () => {
    const result = groupSchema.safeParse({ name: "A group", visibility: "private" });
    expect(result.success).toBe(true);
  });
});
