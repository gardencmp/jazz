import { Page, Locator } from "@playwright/test";

export class HomePage {
    readonly page: Page;
    readonly newPostLink: Locator;
    readonly logoutButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.newPostLink = page.getByRole("link", {
            name: "New Post",
        });
        this.logoutButton = page.getByRole("button", {
            name: "Log out",
        });
    }

    async navigateToPost(petName: string) {
        await this.page
            .getByRole("link", {
                name: petName,
            })
            .click();
    }

    async navigateToNewPost() {
        await this.newPostLink.click();
    }

    async logout() {
        await this.logoutButton.click();
    }
}
