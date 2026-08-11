import { expect, test } from "@playwright/test";

test("loads the English route shell", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveTitle("XOWAAK");
  await expect(page.getByRole("heading", { name: "XOWAAK" })).toBeVisible();
});

test("redirects the root route to the default locale", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en$/);
});

test("sets document direction for Arabic", async ({ page }) => {
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "XOWAAK");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ar");
});

test("protects the home route when auth is not configured", async ({ page }) => {
  await page.goto("/ar/home");

  await expect(page).toHaveURL(/\/ar\/auth\/sign-in\?next=%2Far%2Fhome&error=auth_unavailable/);
  await expect(page.getByRole("heading", { name: "تسجيل الدخول إلى XOWAAK" })).toBeVisible();
});

test("renders the localized sign-up route", async ({ page }) => {
  await page.goto("/en/auth/sign-up");

  await expect(page.getByRole("heading", { name: "Create your XOWAAK account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

test("protects localized settings routes", async ({ page }) => {
  await page.goto("/ar/settings/profile");

  await expect(page).toHaveURL(
    /\/ar\/auth\/sign-in\?next=%2Far%2Fsettings%2Fprofile&error=auth_unavailable/,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("keeps the public profile route available without inventing profile data", async ({
  page,
}) => {
  await page.goto("/ar/u/example");

  await expect(page.getByRole("heading", { name: "الملف الشخصي العام" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("switches auth route language and direction", async ({ page }) => {
  await page.goto("/en/auth/sign-up");

  await page.getByLabel("Language").selectOption("ar");

  await expect(page).toHaveURL(/\/ar\/auth\/sign-up$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "إنشاء حساب XOWAAK" })).toBeVisible();
});

test("switches a dynamic public profile route without changing the username", async ({ page }) => {
  await page.goto("/en/u/example");

  await page.getByLabel("Language").selectOption("ar");

  await expect(page).toHaveURL(/\/ar\/u\/example$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("covers the localized auth and settings route matrix", async ({ page }) => {
  test.setTimeout(90_000);

  const publicAuthRoutes = [
    "/en/auth/sign-in",
    "/ar/auth/sign-in",
    "/en/auth/sign-up",
    "/ar/auth/sign-up",
    "/en/auth/recovery",
    "/ar/auth/recovery",
    "/en/auth/update-password",
    "/ar/auth/update-password",
    "/en/auth/verification",
    "/ar/auth/verification",
  ];

  for (const route of publicAuthRoutes) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      route.startsWith("/ar") ? "ar" : "en",
    );
  }

  const protectedRoutes = [
    "/en/settings",
    "/ar/settings",
    "/en/settings/profile",
    "/ar/settings/profile",
    "/en/settings/privacy",
    "/ar/settings/privacy",
    "/en/settings/account",
    "/ar/settings/account",
    "/en/settings/security",
    "/ar/settings/security",
    "/en/settings/devices",
    "/ar/settings/devices",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    const locale = route.startsWith("/ar") ? "ar" : "en";
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/auth/sign-in\\?`));
  }
});

test("covers public social list routes and protected follow requests", async ({ page }) => {
  await page.goto("/ar/u/example/followers");
  await expect(page.getByRole("heading", { name: "المتابعون" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.goto("/en/u/example/following");
  await expect(page.getByRole("heading", { name: "Following" })).toBeVisible();

  await page.goto("/ar/followers/requests");
  await expect(page).toHaveURL(/\/ar\/auth\/sign-in\?/);
});

test("renders the localized post detail shell without fake persistence", async ({ page }) => {
  await page.goto("/ar/posts/example");

  await expect(page.getByRole("heading", { name: "المنشور" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
