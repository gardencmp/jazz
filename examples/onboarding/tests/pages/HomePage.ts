import { Locator, Page, expect } from "@playwright/test";
import { NewEmployeePage } from "./NewEmployeePage";

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

  async expectEmployee([name, role]: [string, string]) {
    const liElement = this.page.locator(
      `li:has-text("${name}"):has-text("${role}")`,
    );
    await expect(liElement).toBeVisible();
  }

  async deleteEmployee(name: string) {
    const liElement = this.page.locator(`li:has-text("${name}")`);
    const deleteIcon = liElement.locator('span:has-text("🗑")');
    await deleteIcon.click();
  }

  async expectOnboardingCompleteForEmployee(name: string) {
    const liElement = this.page.locator(`li:has-text("${name}")`);
    const completionIcon = liElement.locator('span:has-text("✅")');
    await expect(completionIcon).toBeVisible();
  }

  async expectEmployeeDeleted(name: string) {
    const liElement = this.page.locator(`li:has-text("${name}")`);
    await expect(liElement).not.toBeVisible();
  }

  async navigateToEmployeeOnboardingPage(name: string) {
    await this.page
      .getByRole("link", {
        name,
      })
      .click();
  }

  async navigateToNewEmployee() {
    await this.newEmployeeLink.click();
  }

  async createEmployee(name: string) {
    await this.navigateToNewEmployee();
    const newEmployeePage = new NewEmployeePage(this.page);

    await newEmployeePage.fillEmployeeName(name);
    await newEmployeePage.submit();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
