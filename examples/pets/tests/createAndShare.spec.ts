import { test, expect } from "@playwright/test";

test("create a new post and share", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("textbox").fill("S. Mario");

    await page
        .getByRole("button", {
            name: "Sign Up as new account",
        })
        .click();

    await page
        .getByRole("link", {
            name: "New Post",
        })
        .click();

    await page.getByPlaceholder("Pet name").fill("Yoshi");

    // Start waiting for file chooser before clicking. Note no await.
    const fileChooserPromise = page.waitForEvent("filechooser");

    await page.getByTestId("file-upload").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("./public/jazz-logo.png");

    await page
        .getByRole("button", {
            name: "Submit Post",
        })
        .click();

    expect(
        page.getByRole("heading", {
            name: "Yoshi",
        }),
    ).toBeVisible();

    await page
        .getByRole("button", {
            name: "Share",
        })
        .click();

    await page
        .getByRole("button", {
            name: "Log out",
        })
        .click();

    await page.getByRole("textbox").clear();
    await page.getByRole("textbox").fill("Luigi");

    await page
        .getByRole("button", {
            name: "Sign Up as new account",
        })
        .click();

    const invitation = await page.evaluate(() =>
        navigator.clipboard.readText(),
    );

    await page.goto(invitation);
    await page.reload();

    await expect(
        page.getByRole("heading", {
            name: "Yoshi",
        }),
    ).toBeVisible();

    await expect(
        page.getByRole("button", {
            name: "😍",
        }),
    ).toHaveAttribute("data-selected", "false");

    await page
        .getByRole("button", {
            name: "😍",
        })
        .click();

    await expect(
        page.getByRole("button", {
            name: "😍",
        }),
    ).toHaveAttribute("data-selected", "true");
});
