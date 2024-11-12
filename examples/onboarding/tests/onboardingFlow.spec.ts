import { Page, expect, test } from "@playwright/test";
import { EmployeeOnboardingPage } from "./pages/EmployeeOnboardingPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

const login = async ({
  page,
  userName,
  loginAs = false,
}: {
  page: Page;
  userName: string;
  loginAs?: boolean;
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto("/");
  if (loginAs) {
    await loginPage.loginAs(userName);
  } else {
    await loginPage.fillUsername(userName);
    await loginPage.signup();
  }
};

test.describe("Admin onboarding flow", () => {
  test("Create and delete flow", async ({ page }) => {
    await login({ page, userName: "HR specialist" });

    const homePage = new HomePage(page);
    await homePage.createEmployee("Paul");
    await homePage.createEmployee("Sean");
    await homePage.expectEmployee(["Sean", "admin"]);
    await homePage.expectEmployee(["Paul", "admin"]);
    await homePage.deleteEmployee("Sean");
    await homePage.expectEmployeeDeleted("Sean");
  });

  test("Onboard flow", async ({ page }) => {
    const adminUser = "HR specialist";
    const writerUser = "Invitee";
    await login({ page, userName: adminUser });

    const homePage = new HomePage(page);
    await homePage.createEmployee("Paul");
    await homePage.expectEmployee(["Paul", "admin"]);
    await homePage.navigateToEmployeeOnboardingPage("Paul");
    const onboardingPage = new EmployeeOnboardingPage(page);

    // create invitation
    const invitation = await onboardingPage.getShareLink();
    await onboardingPage.logout();

    //fill out by invitee (writer)
    await login({ page, userName: writerUser });
    await page.goto(invitation);
    await page.waitForTimeout(1000);
    await homePage.expectEmployee(["Paul", "write"]);
    await homePage.navigateToEmployeeOnboardingPage("Paul");
    await onboardingPage.expectEmployeeName("Paul");
    await onboardingPage.fillPersonalDetailsCardAndSave(
      "123-45-6789",
      "123 Elm Street",
    );
    await onboardingPage.fillUploadCardAndSave(
      "./public/jazz-logo-low-res.jpg",
    );

    // invitee cannot confirm the onboarding completion
    expect(onboardingPage.finalConfirmationButton.isDisabled()).toBeTruthy();

    // final step by admin
    await onboardingPage.logout();
    await login({ page, userName: adminUser, loginAs: true });
    await page.waitForTimeout(1000);
    await homePage.expectEmployee(["Paul", "admin"]);
    await homePage.navigateToEmployeeOnboardingPage("Paul");

    await scrollToBottom(page);
    // await page.screenshot({ path: "screenshot.png", fullPage: true });
    await onboardingPage.finalConfirmationButton.click();
    await onboardingPage.backButton.click();
    await homePage.expectOnboardingCompleteForEmployee("Paul");
  });
});
