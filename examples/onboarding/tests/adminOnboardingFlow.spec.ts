import { test } from "@playwright/test";
import { EmployeeOnboardingPage } from "./pages/EmployeeOnboardingPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NewEmployeePage } from "./pages/NewEmployeePage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("Admin onboarding flow", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto("/");
  await loginPage.fillUsername("Onboarding HR");
  await loginPage.signup();
  const homePage = new HomePage(page);

  await homePage.navigateToNewEmployee();

  const newEmployeePage = new NewEmployeePage(page);

  await newEmployeePage.fillEmployeeName("Paul");
  await newEmployeePage.submit();
});

/*
test("create a new post and share", async ({ page }) => {
  const postPage = new EmployeeOnboardingPage(page);

  await postPage.expectEmployeeName("Yoshi");

  const invitation = await postPage.getShareLink();

  await sleep(1000);

  await postPage.logout();

  await loginPage.expectLoaded();

  await loginPage.fillUsername("Luigi");
  await loginPage.signup();

  await page.goto(invitation);

  await postPage.expectEmployeeName("Yoshi");
  await postPage.expectReactionSelectedByCurrentUser("😍", false);
  await postPage.toggleReaction("😍");
  await postPage.expectReactionSelectedByCurrentUser("😍", true);

  await postPage.logout();
  await loginPage.expectLoaded();
  await loginPage.loginAs("S. Mario");

  await homePage.navigateToPost("Yoshi");
  await postPage.expectEmployeeName("Yoshi");
  await postPage.expectReactionByUser("😍", "Luigi");
});
*/
