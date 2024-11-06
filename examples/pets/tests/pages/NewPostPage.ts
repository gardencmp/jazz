import { Locator, Page } from "@playwright/test";

export class NewPostPage {
  readonly page: Page;
  readonly petNameInput: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.petNameInput = page.getByPlaceholder("Pet name");
    this.fileInput = page.getByTestId("file-upload");
    this.submitButton = page.getByRole("button", {
      name: "Submit Post",
    });
  }

  async fillPetName(value: string) {
    await this.petNameInput.clear();
    await this.petNameInput.fill(value);
  }

  async uploadFile(value: string) {
    // Start waiting for file chooser before clicking. Note no await.
    const fileChooserPromise = this.page.waitForEvent("filechooser");

    await this.fileInput.click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
