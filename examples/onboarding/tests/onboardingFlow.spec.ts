import {
  Browser,
  BrowserContext,
  Page,
  chromium,
  expect,
  test,
} from "@playwright/test";
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
  let browser: Browser;
  let adminContext: BrowserContext;
  let writerContext: BrowserContext;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    adminContext = await browser.newContext();
    writerContext = await browser.newContext();
  });

  test.afterAll(async () => {
    await adminContext.close();
    await writerContext.close();
    await browser.close();
  });

  test("Create and delete flow", async () => {
    const adminPage = await adminContext.newPage();
    await login({ page: adminPage, userName: "HR specialist" });
    const adminHomePage = new HomePage(adminPage);
    await adminHomePage.createEmployee("Paul");
    await adminHomePage.createEmployee("Sean");
    await adminHomePage.expectEmployee(["Sean", "admin"]);
    await adminHomePage.expectEmployee(["Paul", "admin"]);
    await adminHomePage.deleteEmployee("Sean");
    await adminHomePage.expectEmployeeDeleted("Sean");

    await adminPage.close();
  });

  test("Onboard flow", async () => {
    const adminPage = await adminContext.newPage();
    const writerPage = await writerContext.newPage();

    const adminUser = "HR specialist";
    const writerUser = "Invitee";
    await login({ page: adminPage, userName: adminUser });
    await login({ page: writerPage, userName: writerUser });

    const adminHomePage = new HomePage(adminPage);
    await adminHomePage.createEmployee("Paul");
    await adminHomePage.expectEmployee(["Paul", "admin"]);
    await adminHomePage.navigateToEmployeeOnboardingPage("Paul");
    const adminOnboardingPage = new EmployeeOnboardingPage(adminPage);

    // create invitation
    const invitation = await adminOnboardingPage.getShareLink();

    // Wait for the invitation to be synced
    await writerPage.waitForTimeout(1000);

    //fill out by invitee (writer)
    await writerPage.goto(invitation);

    const writerHomePage = new HomePage(writerPage);
    await writerHomePage.expectEmployee(["Paul", "write"]);
    await writerHomePage.navigateToEmployeeOnboardingPage("Paul");
    const writerOnboardingPage = new EmployeeOnboardingPage(writerPage);
    await writerOnboardingPage.expectEmployeeName("Paul");
    await writerOnboardingPage.fillPersonalDetailsCardAndSave(
      "123-45-6789",
      "123 Elm Street",
    );
    await writerOnboardingPage.fillUploadCardAndSave(
      "./public/jazz-logo-low-res.jpg",
    );

    // invitee cannot confirm the onboarding completion
    expect(
      writerOnboardingPage.finalConfirmationButton.isDisabled(),
    ).toBeTruthy();

    // final confirmation step by admin
    await scrollToBottom(adminPage);
    await adminOnboardingPage.finalConfirmationButton.click();
    await adminOnboardingPage.backButton.click();
    await adminHomePage.expectOnboardingCompleteForEmployee("Paul");
  });
});
