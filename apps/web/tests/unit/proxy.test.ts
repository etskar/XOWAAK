import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "../../proxy";

describe("authentication proxy", () => {
  it("allows public routes without Supabase configuration", async () => {
    const response = await proxy(new NextRequest("http://localhost/en"));

    expect(response.status).toBe(200);
  });

  it("redirects protected routes to the matching locale sign-in page", async () => {
    const response = await proxy(new NextRequest("http://localhost/ar/home"));
    const location = response.headers.get("location");

    expect(response.status).toBe(307);
    expect(location).toContain("/ar/auth/sign-in");
    expect(location).toContain("error=auth_unavailable");
    expect(location).toContain("next=%2Far%2Fhome");
  });
});
