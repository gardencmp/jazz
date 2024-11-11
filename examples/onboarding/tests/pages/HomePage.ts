import { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly newEmployeeLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEmployeeLink = page.getByRole("button", {
      name: "Add New Employee",
    });
    this.logoutButton = page.getByRole("button", {
      name: "Log Out",
    });
  }

  async navigateToEmployeeOnboardingPage(employeeName: string) {
    await this.page
      .getByRole("link", {
        name: employeeName,
      })
      .click();
  }

  async navigateToNewEmployee() {
    await this.newEmployeeLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
