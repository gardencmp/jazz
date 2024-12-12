import { Locator, Page, expect } from "@playwright/test";

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageInput = page.getByRole("textbox", {
      name: "Type a message and press Enter",
    });
    this.logoutButton = page.getByRole("button", {
      name: "Log out",
    });
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.messageInput.press("Enter");
  }

  async expectMessageRow(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.goto("/");
  }
}
