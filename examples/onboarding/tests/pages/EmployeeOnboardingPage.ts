import { Locator, Page, expect } from "@playwright/test";

export class EmployeeOnboardingPage {
  readonly page: Page;
  readonly shareButton: Locator;
  readonly backButton: Locator;
  readonly logoutButton: Locator;
  readonly finalConfirmationButton: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shareButton = page.getByRole("button", {
      name: /invite a co-worker/i,
    });
    this.backButton = page.getByRole("button", {
      name: /back/i,
    });
    this.logoutButton = page.getByRole("button", {
      name: /log out/i,
    });
    this.finalConfirmationButton = this.page.getByRole("button", {
      name: /confirmation by admin/i,
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

  async expectEmployeeName(name: string) {
    await expect(
      this.page.getByRole("heading", {
        name: name,
      }),
    ).toBeVisible();
  }

  async fillPersonalDetailsCardAndSave(ssn: string, address: string) {
    const nextStepButton = this.page.getByRole("button", {
      name: /upload step >/i,
    });
    await expect(nextStepButton).toBeDisabled();

    const ssnInput = this.page.getByLabel(/Social Security Number/i);
    await ssnInput.fill(ssn);

    const addressInput = this.page.getByLabel(/Address/i);
    await addressInput.fill(address);

    // save and hide the button
    await expect(nextStepButton).toBeEnabled();
    await nextStepButton.click();
    await expect(nextStepButton).not.toBeVisible();
  }

  async fillUploadCardAndSave(file: string) {
    const nextStepButton = this.page.getByRole("button", {
      name: /confirmation step >/i,
    });
    await expect(nextStepButton).toBeDisabled();

    await this.uploadFile(file);
    await expect(nextStepButton).toBeEnabled();
    await nextStepButton.click();
    await expect(nextStepButton).not.toBeVisible();
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
