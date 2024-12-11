import { Browser, Page, expect, test } from "@playwright/test";

test.describe("WriteOnly role", () => {
  test("should share simple coValues", async ({ page, browser }) => {
    await page.goto("/write-only");

    await page.getByRole("button", { name: "Create the list" }).click();
    await waitForReady(page);

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-writeOnly")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await waitForReady(newUserPage);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "");
  });

  test("writeOnly1 roles should be able to see only their own changes", async ({
    page,
    browser,
    context,
  }) => {
    const pages = {
      initialOwner: page,
      writeOnly1: await createIsolatedPage(browser),
      writeOnly2: await createIsolatedPage(browser),
      reader: await createIsolatedPage(browser),
    };

    await pages.initialOwner.goto("/write-only?userName=InitialOwner");
    await pages.writeOnly1.goto("/write-only?userName=WriteOnly");
    await pages.writeOnly2.goto("/write-only?userName=WriteOnly2");

    await pages.initialOwner
      .getByRole("button", { name: "Create the list" })
      .click();
    await waitForReady(pages.initialOwner);

    const writeOnlyInviteLink = await pages.initialOwner
      .getByTestId("invite-link-writeOnly")
      .textContent();

    await pages.writeOnly1.goto(writeOnlyInviteLink!);
    await pages.writeOnly2.goto(writeOnlyInviteLink!);

    await waitForReady(pages.writeOnly1);
    await waitForReady(pages.writeOnly2);

    await pages.writeOnly1
      .getByRole("button", { name: "Add a new item" })
      .click();
    await pages.writeOnly2
      .getByRole("button", { name: "Add a new item" })
      .click();

    await pages.writeOnly1.getByRole("textbox").fill("From WriteOnly1");
    await pages.writeOnly2.getByRole("textbox").fill("From WriteOnly2");

    await expect(pages.initialOwner.getByText("From WriteOnly1")).toBeVisible();
    await expect(pages.initialOwner.getByText("From WriteOnly2")).toBeVisible();

    await expect(pages.writeOnly1.getByText("From WriteOnly1")).toBeVisible();
    await expect(
      pages.writeOnly1.getByText("From WriteOnly2"),
    ).not.toBeVisible();

    await expect(
      pages.writeOnly2.getByText("From WriteOnly1"),
    ).not.toBeVisible();
    await expect(pages.writeOnly2.getByText("From WriteOnly2")).toBeVisible();

    const readerInviteLink = await pages.initialOwner
      .getByTestId("invite-link-reader")
      .textContent();

    await pages.reader.goto(readerInviteLink!);
    await waitForReady(pages.reader);

    await expect(pages.reader.getByText("From WriteOnly1")).toBeVisible();
    await expect(pages.reader.getByText("From WriteOnly2")).toBeVisible();
  });
});

async function waitForReady(page: Page) {
  await expect(page.getByTestId("id")).not.toHaveText("", {
    timeout: 20_000,
  });
}

async function createIsolatedPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  return page;
}
