import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const primaryEmail = process.env.PROMPT4_PRIMARY_EMAIL;
const secondaryEmail = process.env.PROMPT4_SECONDARY_EMAIL;
const password = process.env.PROMPT4_TEST_PASSWORD;
const iconPath = path.resolve(process.cwd(), "public/icons/icon-192.png");

async function signIn(page: Page, email: string) {
  page.on("response", (response) => {
    if (response.url().includes("/auth/v1/token"))
      console.log(JSON.stringify({ authStatus: response.status() }));
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("supabase"))
      console.log(JSON.stringify({ authRequestFailed: request.failure()?.errorText }));
  });
  await page.goto("/en/auth/sign-in");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(password ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(1000);
  console.log(
    JSON.stringify({
      url: page.url(),
      status:
        (await page.locator(".auth-status").count()) > 0
          ? await page.locator(".auth-status").textContent()
          : null,
      pending:
        (await page.getByRole("button", { name: "Sign in" }).count()) > 0
          ? await page.getByRole("button", { name: "Sign in" }).isDisabled()
          : null,
      cookieNames: (await page.context().cookies()).map((cookie) => cookie.name),
    }),
  );
  await expect(page).toHaveURL(/\/en\/home/, { timeout: 30_000 });
}

async function completeProfile(page: Page, username: string, displayName: string) {
  await page.goto("/en/settings/profile");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Bio").fill(`${displayName} Prompt 4 test account`);
  await page.getByLabel("Location").fill("Berlin");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
}

async function uploadFirstMedia(page: Page) {
  await page.locator('.media-upload input[type="file"]').first().setInputFiles(iconPath);
  await expect(page.locator(".media-upload__list").first()).toContainText("icon-192.png");
}

test("verifies real Prompt 4 account workflows", async ({ page, browser }) => {
  test.setTimeout(120_000);
  page.on("console", (message) => {
    if (message.type() === "log" || message.type() === "error") console.log(message.text());
  });
  test.skip(
    !primaryEmail || !secondaryEmail || !password,
    "Prompt 4 test credentials are not configured",
  );

  await signIn(page, primaryEmail!);
  await completeProfile(page, "prompt4primary", "Prompt 4 Primary");
  const postContent = `Prompt 4 real post ${Date.now()}`;

  await page.goto("/en/home");
  await page.getByRole("textbox", { name: "Create a post" }).fill(postContent);
  await uploadFirstMedia(page);
  await page.getByRole("button", { name: "Publish post" }).click();
  const postCard = page.locator("article.post-card").filter({ hasText: postContent }).first();
  await expect(postCard.getByText(postContent)).toBeVisible();
  await postCard.getByRole("button", { name: /Like/ }).click();
  await expect(postCard.getByRole("button", { name: /Liked/ })).toBeVisible();
  await postCard.locator("summary").click();
  await postCard.getByRole("textbox", { name: "Comment" }).fill("Prompt 4 comment");
  await postCard.getByRole("button", { name: "Add comment" }).click();
  await expect(postCard.getByText("Prompt 4 comment")).toBeVisible();
  await postCard.getByRole("button", { name: /Share/ }).click();

  await page.goto("/en/products/new");
  await page.getByLabel("Title").fill("Prompt 4 Product");
  await page.getByLabel("Description").fill("Prompt 4 product record");
  await page.getByLabel("Location").fill("Berlin");
  await page.getByLabel("Latitude").fill("52.5200");
  await page.getByLabel("Longitude").fill("13.4050");
  await uploadFirstMedia(page);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/en\/products\/[0-9a-f-]+/, { timeout: 30_000 });
  const productUrl = page.url();
  await expect(page.getByRole("heading", { name: "Prompt 4 Product" })).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/en/services/new");
  await page.getByLabel("Title").fill("Prompt 4 Service");
  await page.getByLabel("Description").fill("Prompt 4 service record");
  await page.getByLabel("Location").fill("Berlin");
  await page.getByLabel("Latitude").fill("52.5200");
  await page.getByLabel("Longitude").fill("13.4050");
  await uploadFirstMedia(page);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/en\/services\/[0-9a-f-]+/);
  await expect(page.getByRole("heading", { name: "Prompt 4 Service" })).toBeVisible();

  await page.goto("/en/jobs/new");
  await page.getByLabel("Title").fill("Prompt 4 Job");
  await page.getByLabel("Description").fill("Prompt 4 job record");
  await page.getByLabel("Location").fill("Berlin");
  await page.getByLabel("Latitude").fill("52.5200");
  await page.getByLabel("Longitude").fill("13.4050");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/en\/jobs\/[0-9a-f-]+/);
  await expect(page.getByRole("heading", { name: "Prompt 4 Job" })).toBeVisible();

  await page.goto("/en/map");
  await expect(page.getByRole("link", { name: /Prompt 4 Product/ }).first()).toBeVisible();
  await page.goto("/en/search");
  await page.getByRole("textbox", { name: "Search XOWAAK" }).fill("Berlin");
  await expect(page.getByRole("link", { name: /Prompt 4 Product/ }).first()).toBeVisible();

  const secondary = await browser.newContext();
  const secondaryPage = await secondary.newPage();
  await signIn(secondaryPage, secondaryEmail!);
  await completeProfile(secondaryPage, "prompt4secondary", "Prompt 4 Secondary");

  await page.goto("/en/groups/new");
  await page.getByLabel("Title").fill("Prompt 4 Group");
  await page.getByLabel("Description").fill("Prompt 4 group record");
  await uploadFirstMedia(page);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/en\/groups\/[0-9a-f-]+/);
  const groupUrl = page.url();
  await expect(page.getByRole("heading", { name: "Prompt 4 Group" })).toBeVisible();
  await page.getByLabel("Invite by username").fill("prompt4secondary");
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("Invitation sent.")).toBeVisible();

  await secondaryPage.goto(groupUrl);
  await secondaryPage.getByRole("button", { name: "Accept invitation" }).click();
  await secondaryPage.getByLabel("Write a message...").fill("Prompt 4 group message");
  await secondaryPage.getByRole("button", { name: "Send message" }).click();
  await expect(secondaryPage.getByText("Prompt 4 group message")).toBeVisible();

  await secondaryPage.goto("/en/home");
  const secondaryPostCard = secondaryPage
    .locator("article.post-card")
    .filter({ hasText: postContent })
    .first();
  await secondaryPostCard.getByRole("button", { name: /Like/ }).click();
  await secondaryPage.goto(productUrl);
  await secondaryPage.getByRole("button", { name: "Save" }).click();

  await page.goto("/en/messages");
  await page.getByLabel("Username").fill("prompt4secondary");
  await page.getByRole("button", { name: "Open chat" }).click();
  await expect(page.getByRole("heading", { name: "Prompt 4 Secondary" })).toBeVisible();
  await page.getByLabel("Write a message...").fill("Prompt 4 direct message");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(
    page.getByRole("article").getByText("Prompt 4 direct message").first(),
  ).toBeVisible();

  await page.goto("/en/notifications");
  await expect(page.getByText(/liked your post|commented on your post/).first()).toBeVisible();
  await page.getByRole("button", { name: "Mark read" }).first().click();

  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/home\?error=forbidden/);
  await page.reload();
  await expect(page).toHaveURL(/\/en\/home\?error=forbidden/);
  await page.goto("/en/settings/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/auth\/sign-in/);
  await signIn(page, primaryEmail!);

  await secondary.close();
});
