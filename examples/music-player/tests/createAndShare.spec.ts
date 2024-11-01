import { test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("create a new playlist and share", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillUsername("S. Mario");
    await loginPage.signup();

    const homePage = new HomePage(page);

    // The example song should be loaded
    await homePage.expectMusicTrack("Example song");
    await homePage.editTrackTitle("Example song", "Super Mario World");

    await homePage.createPlaylist();
    await homePage.editPlaylistTitle("Save the princess");

    await homePage.navigateToPlaylist("All tracks");
    await homePage.addTrackToPlaylist("Super Mario World", "Save the princess");

    await homePage.navigateToPlaylist("Save the princess");
    await homePage.expectMusicTrack("Super Mario World");

    const url = await homePage.getShareLink();

    await sleep(4000); // Wait for the sync to complete

    await homePage.logout();

    await loginPage.goto();
    await loginPage.fillUsername("Luigi");
    await loginPage.signup();

    await page.goto(url);

    await homePage.expectMusicTrack("Super Mario World");
    await homePage.playMusicTrack("Super Mario World");
    await homePage.expectActiveTrackPlaying();
});
