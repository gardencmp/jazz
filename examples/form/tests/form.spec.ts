import { test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("create a new post and share", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.fillUsername("S. Mario");
  await loginPage.signup();
});
