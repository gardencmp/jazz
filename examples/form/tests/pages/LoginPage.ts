import { Locator, Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly signupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox");
    this.signupButton = page.getByRole("button", {
      name: "Sign up",
    });
  }

  async goto() {
    this.page.goto("/");
  }

  async fillUsername(value: string) {
    await this.usernameInput.clear();
    await this.usernameInput.fill(value);
  }

  async loginAs(value: string) {
    await this.page
      .getByRole("button", {
        name: value,
      })
      .click();
  }

  async signup() {
    await this.signupButton.click();
  }

  async expectLoaded() {
    await expect(this.signupButton).toBeVisible();
  }
}
