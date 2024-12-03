import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("Sharing", () => {
  test("should share simple coValues", async ({ page, browser }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create a new list!" }).click();

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });
  });

  test("should reveal internal values on group extension", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create a new list!" }).click();
    await page.getByRole("button", { name: "Add a new value!" }).click();

    await expect(page.getByTestId("values")).toHaveText("CoValue entry 0");

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });

    // The user should not have access to the internal values
    // because they are part of a different group
    await expect(newUserPage.getByTestId("values")).toHaveText("");

    // Extend the coMaps group with the coList group
    await page.getByRole("button", { name: "Share the co-maps!" }).click();

    // The user should now have access to the internal values
    await expect(newUserPage.getByTestId("values")).toHaveText(
      "CoValue entry 0",
    );
  });

  test("should reveal internal values if another user extends the group", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create a new list!" }).click();

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-admin")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });

    await newUserPage.getByRole("button", { name: "Add a new value!" }).click();
    await newUserPage
      .getByRole("button", { name: "Share the co-maps!" })
      .click();

    // The user should now have access to the internal values
    await expect(page.getByTestId("values")).toHaveText("CoValue entry 0");
  });

  test("admin role is required to extend a group", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create a new list!" }).click();

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-writer")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });

    await newUserPage.getByRole("button", { name: "Add a new value!" }).click();
    await newUserPage
      .getByRole("button", { name: "Share the co-maps!" })
      .click();

    // The group extension should fail
    await expect(page.getByTestId("values")).toHaveText("");
  });

  test("should not reveal new values after revoking access", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create a new list!" }).click();
    await page.getByRole("button", { name: "Add a new value!" }).click();

    await expect(page.getByTestId("values")).toHaveText("CoValue entry 0");

    await page.getByRole("button", { name: "Share the co-maps!" }).click();

    const id = await page.getByTestId("id").textContent();
    const inviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Revoke access!" }).click();
    await page.getByRole("button", { name: "Add a new value!" }).click();

    await expect(page.getByTestId("values")).toHaveText(
      "CoValue entry 0, CoValue entry 1",
    );

    // The user should not have access to the new value
    await expect(newUserPage.getByTestId("values")).toHaveText(
      "CoValue entry 0",
    );
  });
});
