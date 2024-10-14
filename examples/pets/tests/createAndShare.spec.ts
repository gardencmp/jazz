import { test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { NewPostPage } from "./pages/NewPostPage";
import { PostPage } from "./pages/PostPage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("create a new post and share", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillUsername("S. Mario");
    await loginPage.signup();

    const homePage = new HomePage(page);

    await homePage.navigateToNewPost();

    const newPostPage = new NewPostPage(page);

    await newPostPage.fillPetName("Yoshi");
    await newPostPage.uploadFile("./public/jazz-logo-low-res.jpg");
    await newPostPage.submit();

    const postPage = new PostPage(page);

    await postPage.expectPetName("Yoshi");

    const invitation = await postPage.getShareLink();

    await sleep(1000);

    await postPage.logout();

    await loginPage.expectLoaded();

    await loginPage.fillUsername("Luigi");
    await loginPage.signup();

    await page.goto(invitation);

    await postPage.expectPetName("Yoshi");
    await postPage.expectReactionSelectedByCurrentUser("😍", false);
    await postPage.toggleReaction("😍");
    await postPage.expectReactionSelectedByCurrentUser("😍", true);

    await postPage.logout();
    await loginPage.expectLoaded();
    await loginPage.loginAs("S. Mario");

    await homePage.navigateToPost("Yoshi");
    await postPage.expectPetName("Yoshi");
    await postPage.expectReactionByUser("😍", "Luigi");
});
