import { expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("create a new order", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.fillUsername("Alice");
  await loginPage.signup();

  await page.getByRole("link", { name: "Add new order" }).click();

  // fill out order form
  await page.getByLabel("Base tea").selectOption("Oolong");
  await page.getByLabel("Pearl").check();
  await page.getByLabel("Taro").check();
  await page.getByLabel("Delivery date").fill("2024-12-21");
  await page.getByLabel("With milk?").check();
  await page.getByLabel("Special instructions").click();
  await page.getByLabel("Special instructions").fill("25% sugar");
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForURL("/");

  const firstOrder = page.getByRole("link", { name: "Oolong milk tea" });

  // check if order was created correctly
  await expect(firstOrder).toHaveText(/25% sugar/);
  await expect(firstOrder).toHaveText(/12\/21\/2024/);
  await expect(firstOrder).toHaveText(/with pearl, taro/);
});
