import { Locator, Page, expect } from "@playwright/test";

export class PostPage {
  readonly page: Page;
  readonly shareButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shareButton = page.getByRole("button", {
      name: "Share",
    });
    this.logoutButton = page.getByRole("button", {
      name: "Log out",
    });
  }

  async expectPetName(petName: string) {
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
