import { Locator, Page, expect } from "@playwright/test";

export class EmployeeOnboardingPage {
  readonly page: Page;
  readonly shareButton: Locator;
  readonly backButton: Locator;
  readonly logoutButton: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shareButton = page.getByRole("button", {
      name: "Invite a co-worker",
    });
    this.backButton = page.getByRole("button", {
      name: "Back button",
    });
    this.logoutButton = page.getByRole("button", {
      name: "Log Out",
    });
    this.fileInput = page.getByTestId("file-upload");
  }

  async uploadFile(value: string) {
    // Start waiting for file chooser before clicking. Note no await.
    const fileChooserPromise = this.page.waitForEvent("filechooser");

    await this.fileInput.click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(value);
  }
  // await newPostPage.uploadFile("./public/jazz-logo-low-res.jpg");
  //
  async expectEmployeeName(petName: string) {
    await expect(
      this.page.getByRole("heading", {
        name: petName,
      }),
    ).toBeVisible();
  }

  async expectReactionSelectedByCurrentUser(emoji: string, selected: boolean) {
    await expect(
      this.page.getByRole("button", {
        name: emoji,
      }),
    ).toHaveAttribute("data-selected", String(selected));
  }

  async expectReactionByUser(emoji: string, userName: string) {
    await expect(this.page.getByText(`${emoji} ${userName}`)).toBeVisible();
  }

  async toggleReaction(emoji: string) {
    await this.page
      .getByRole("button", {
        name: emoji,
      })
      .click();
  }

  async getShareLink() {
    await this.shareButton.click();

    const inviteUrl = await this.page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    expect(inviteUrl).toBeTruthy();

    return inviteUrl;
  }

  async logout() {
    await this.logoutButton.click();
  }
}
