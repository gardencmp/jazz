import { Locator, Page } from "@playwright/test";

export class NewEmployeePage {
  readonly page: Page;
  readonly employeeNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.employeeNameInput = page.getByLabel(/employee name/i);
    this.submitButton = page.getByRole("button", {
      name: /create employee/i,
    });
  }

  async fillEmployeeName(value: string) {
    await this.employeeNameInput.clear();
    await this.employeeNameInput.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
