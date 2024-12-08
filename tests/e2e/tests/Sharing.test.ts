import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("Sharing", () => {
  test("should share simple coValues", async ({ page, browser }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create the root" }).click();
    await expect(page.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

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

    await page.getByRole("button", { name: "Create the root" }).click();
    await expect(page.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Add a child" }).click();

    await expect(page.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );

    const inviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    // The user should not have access to the internal values
    // because they are part of a different group
    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );
    await expect(newUserPage.getByTestId("values")).not.toContainText(
      "CoValue root ---> CoValue child 1",
    );

    // Extend the coMaps group with the coList group
    await page.getByRole("button", { name: "Share the children" }).click();

    // The user should now have access to the internal values
    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
  });

  test("should reveal internal values if another user extends the group", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create the root" }).click();
    await expect(page.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    const inviteLink = await page
      .getByTestId("invite-link-admin")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await newUserPage.getByRole("button", { name: "Add a child" }).click();
    await newUserPage.getByRole("button", { name: "Add a child" }).click();
    await newUserPage
      .getByRole("button", { name: "Reveal next level" })
      .click();
    await newUserPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await page.getByRole("button", { name: "Reveal next level" }).click();

    // The user should now have access to the internal values
    await expect(page.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
  });

  test("admin role is required to extend a group", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create the root" }).click();
    await expect(page.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    const inviteLink = await page
      .getByTestId("invite-link-writer")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await newUserPage.getByRole("button", { name: "Add a child" }).click();
    await newUserPage
      .getByRole("button", { name: "Share the children" })
      .click();

    // The group extension should fail
    await expect(page.getByTestId("values")).toContainText("CoValue root");
    await expect(page.getByTestId("values")).not.toContainText(
      "CoValue root ---> CoValue child 1",
    );
  });

  test("should not reveal new values after revoking access", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing");

    await page.getByRole("button", { name: "Create the root" }).click();
    await expect(page.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Add a child" }).click();
    await page.getByRole("button", { name: "Share the children" }).click();

    const inviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    // Create a new incognito instance and accept the invite
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(inviteLink!);

    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await page.getByRole("button", { name: "Revoke access" }).click();
    await page.getByRole("button", { name: "Add a child" }).click();
    await page.getByRole("button", { name: "Reveal next level" }).click();
    await page.getByRole("button", { name: "Share the children" }).click();
    await newUserPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    await expect(page.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
    await expect(newUserPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
    await expect(newUserPage.getByTestId("values")).not.toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
  });

  test("should load the missing childs when rotating keys", async ({
    page,
    browser,
  }) => {
    await page.goto("/sharing?userName=InitialOwner");

    const initialOwnerPage = page;
    const otherAdminPage = await (await browser.newContext()).newPage();
    otherAdminPage.goto("/?userName=OtherAdmin");
    const readerPage = await (await browser.newContext()).newPage();
    readerPage.goto("/?userName=Reader");

    await initialOwnerPage
      .getByRole("button", { name: "Create the root" })
      .click();
    await expect(initialOwnerPage.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    const adminInviteLink = await page
      .getByTestId("invite-link-admin")
      .textContent();
    const readerInviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    await otherAdminPage.goto(adminInviteLink!);
    await readerPage.goto(readerInviteLink!);

    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await initialOwnerPage.getByRole("button", { name: "Add a child" }).click();
    await initialOwnerPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );

    await otherAdminPage.getByRole("button", { name: "Add a child" }).click();
    await otherAdminPage
      .getByRole("button", { name: "Reveal next level" })
      .click();
    await otherAdminPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await readerPage.getByRole("button", { name: "Reveal next level" }).click();

    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> Level hidden",
    );
    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );

    // At this point, the initial owner should not know about the "CoValue child 2"
    // group, and to make things work it should load it before rotating the keys
    await initialOwnerPage
      .getByRole("button", { name: "Revoke access" })
      .click();

    // We add a new child from the other admin by extending "CoValue child 2" group
    // if the key has been rotated this new value should not be revealed to the reader
    await otherAdminPage.getByRole("button", { name: "Add a child" }).click();
    await otherAdminPage
      .getByRole("button", { name: "Reveal next level" })
      .click();
    await otherAdminPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await readerPage.getByRole("button", { name: "Reveal next level" }).click();

    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
    // The new child should not be revealed to the reader because it has been kicked out
    await expect(readerPage.getByTestId("values")).not.toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );
    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );

    await initialOwnerPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    await initialOwnerPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    // The new childs should be revealed to the initial owner
    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );
  });

  test("should kick out access from child groups even if they are not available when rotating keys", async ({
    page,
    browser,
    context,
  }) => {
    await page.goto("/sharing?userName=InitialOwner");

    const initialOwnerPage = page;
    const otherAdminPage = await (await browser.newContext()).newPage();
    otherAdminPage.goto("/?userName=OtherAdmin");
    const readerPage = await (await browser.newContext()).newPage();
    readerPage.goto("/?userName=Reader");

    await initialOwnerPage
      .getByRole("button", { name: "Create the root" })
      .click();
    await expect(initialOwnerPage.getByTestId("id")).not.toHaveText("", {
      timeout: 20_000,
    });

    const adminInviteLink = await page
      .getByTestId("invite-link-admin")
      .textContent();
    const readerInviteLink = await page
      .getByTestId("invite-link-reader")
      .textContent();

    await otherAdminPage.goto(adminInviteLink!);
    await readerPage.goto(readerInviteLink!);

    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root",
      {
        timeout: 20_000,
      },
    );

    await initialOwnerPage.getByRole("button", { name: "Add a child" }).click();
    await initialOwnerPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );
    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1",
    );

    await context.setOffline(true);

    await otherAdminPage.getByRole("button", { name: "Add a child" }).click();
    await otherAdminPage
      .getByRole("button", { name: "Reveal next level" })
      .click();
    await otherAdminPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await readerPage.getByRole("button", { name: "Reveal next level" }).click();

    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );

    // At this point, the initial owner should not know about the "CoValue child 2"
    // group, and to make things work it should load it before rotating the keys
    await initialOwnerPage
      .getByRole("button", { name: "Revoke access" })
      .click();

    await initialOwnerPage.waitForTimeout(1000);

    await context.setOffline(false);

    await initialOwnerPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );

    await initialOwnerPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    // We add a new child from the other admin by extending "CoValue child 2" group
    // if the key has been rotated this new value should not be revealed to the reader
    await initialOwnerPage.getByRole("button", { name: "Add a child" }).click();

    await initialOwnerPage
      .getByRole("button", { name: "Share the children" })
      .click();

    await readerPage.getByRole("button", { name: "Reveal next level" }).click();

    await expect(readerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2",
    );
    // The new child should not be revealed to the reader because it has been kicked out
    await expect(readerPage.getByTestId("values")).not.toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );
    await otherAdminPage
      .getByRole("button", { name: "Reveal next level" })
      .click();

    await expect(otherAdminPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );
    await expect(initialOwnerPage.getByTestId("values")).toContainText(
      "CoValue root ---> CoValue child 1 ---> CoValue child 2 ---> CoValue child 3",
    );
  });
});
