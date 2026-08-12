import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("loads the English route shell", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveTitle("XOWAAK");
  await expect(page.getByRole("heading", { name: "Make room for what matters." })).toBeVisible();
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

test("protects the home route while keeping Supabase auth configured", async ({ page }) => {
  await page.goto("/ar/home");

  await expect(page).toHaveURL(/\/ar\/auth\/sign-in\?next=%2Far%2Fhome(?:&|$)/);
  await expect(page.getByRole("heading", { name: "تسجيل الدخول إلى XOWAAK" })).toBeVisible();
  await expect(page.locator(".auth-unavailable")).toHaveCount(0);
});

test("renders the localized sign-up route", async ({ page }) => {
  await page.goto("/en/auth/sign-up");

  await expect(page.getByRole("heading", { name: "Create your XOWAAK account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.locator(".auth-unavailable")).toHaveCount(0);
});

test("uses the real Supabase auth client for an invalid sign-in without creating a user", async ({
  page,
}) => {
  await page.goto("/en/auth/sign-in");
  await page.getByRole("textbox", { name: "Email" }).fill("xowaak-auth-probe@example.invalid");
  await page.getByLabel("Password").fill("NotARealPassword123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator(".auth-unavailable")).toHaveCount(0);
  await expect(page.locator(".auth-status")).toBeVisible({ timeout: 20_000 });
});

test("protects localized settings routes", async ({ page }) => {
  await page.goto("/ar/settings/profile");

  await expect(page).toHaveURL(/\/ar\/auth\/sign-in\?next=%2Far%2Fsettings%2Fprofile(?:&|$)/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".auth-unavailable")).toHaveCount(0);
});

test("keeps the public profile route available without inventing profile data", async ({
  page,
}) => {
  await page.goto("/ar/u/example");
  await page.waitForSelector('main.profile-page, main[aria-labelledby="route-title"]');

  if (await page.locator("main.profile-page").count()) {
    await expect(page.getByRole("heading", { name: "الملف الشخصي العام" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "الصفحة المطلوبة غير موجودة." })).toBeVisible();
  }
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

test("renders every enabled language without changing the product shell", async ({ page }) => {
  const locales = ["es", "fr", "de", "tr", "pt", "zh"];

  for (const locale of locales) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page).toHaveTitle("XOWAAK");
  }
});

test("preserves query parameters while switching a dynamic route", async ({ page }) => {
  await page.goto("/en/u/example?tab=posts");

  await page.getByLabel("Language").selectOption("ar");

  await expect(page).toHaveURL(/\/ar\/u\/example\?tab=posts$/);
});

test("toggles the visual theme without changing the route", async ({ page }) => {
  await page.goto("/en");

  const themeToggle = page.getByRole("button", { name: "Toggle theme" });
  await themeToggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await themeToggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("opens the mobile navigation without horizontal movement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.locator("#mobile-product-navigation");
  await expect(mobileNavigation.getByRole("link", { name: "About XOWAAK" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Create account" })).toBeVisible();
});

test("exposes an installable PWA shell", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();

  expect(manifest.name).toBe("XOWAAK");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/en");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512" }),
    ]),
  );

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);
  expect(await serviceWorkerResponse.text()).toContain("xowaak-shell-v1");

  await page.goto("/en");
  const serviceWorkerScope = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.scope;
  });
  expect(serviceWorkerScope).toContain("/");
});

test("keeps the product within the viewport on narrow LTR and RTL screens", async ({ page }) => {
  for (const viewport of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width: viewport, height: 844 });

    for (const route of ["/en", "/ar", "/en/auth/sign-up", "/ar/auth/recovery"]) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${route} overflows at ${viewport}px`).toBeLessThanOrEqual(1);
    }
  }
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
    "/en/search",
    "/ar/search",
    "/en/messages",
    "/ar/messages",
    "/en/notifications",
    "/ar/notifications",
    "/en/products",
    "/ar/products",
    "/en/services",
    "/ar/services",
    "/en/jobs",
    "/ar/jobs",
    "/en/groups",
    "/ar/groups",
    "/en/map",
    "/ar/map",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    const locale = route.startsWith("/ar") ? "ar" : "en";
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/auth/sign-in\\?`));
    await expect(page.locator(".auth-unavailable")).toHaveCount(0);
  }
});

test("covers public social list routes and protected follow requests", async ({ page }) => {
  await page.goto("/ar/u/example/followers");
  await page.waitForSelector('main.social-list-page, main[aria-labelledby="route-title"]');
  if (await page.locator("main.social-list-page").count()) {
    await expect(page.getByRole("heading", { name: "المتابعون" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "الصفحة المطلوبة غير موجودة." })).toBeVisible();
  }
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.goto("/en/u/example/following");
  await page.waitForSelector('main.social-list-page, main[aria-labelledby="route-title"]');
  if (await page.locator("main.social-list-page").count()) {
    await expect(page.getByRole("heading", { name: "Following" })).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "The requested page was not found." }),
    ).toBeVisible();
  }

  await page.goto("/ar/followers/requests");
  await expect(page).toHaveURL(/\/ar\/auth\/sign-in\?/);
});

test("renders the localized post detail shell without fake persistence", async ({ page }) => {
  await page.goto("/ar/posts/example");
  await expect(
    page.getByRole("heading", { name: /^(المنشور|الصفحة المطلوبة غير موجودة\.)$/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
