import { expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("create and edit an order", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.fillUsername("Alice");
  await loginPage.signup();

  // start an order
  await page.getByRole("link", { name: "Add new order" }).click();
  await page.getByLabel("Base tea").selectOption("Oolong");

  // test draft indicator
  await page.getByRole("link", { name: /Back to all orders/ }).click();
  await expect(page.getByText("You have a draft")).toBeVisible();

  // fill out the rest of order form
  await page.getByRole("link", { name: "Add new order" }).click();
  await page.getByLabel("Pearl").check();
  await page.getByLabel("Taro").check();
  await page.getByLabel("Delivery date").fill("2024-12-21");
  await page.getByLabel("With milk?").check();
  await page.getByLabel("Special instructions").fill("25% sugar");
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForURL("/");

  // the draft indicator should be gone because the order was submitted
  await expect(page.getByText("You have a draft")).toHaveCount(0);

  // check if order was created correctly
  const firstOrder = page.getByRole("link", { name: "Oolong milk tea" });
  await expect(firstOrder).toHaveText(/25% sugar/);
  await expect(firstOrder).toHaveText(/12\/21\/2024/);
  await expect(firstOrder).toHaveText(/with pearl, taro/);

  // edit order
  await firstOrder.click();
  await page.getByLabel("Base tea").selectOption("Jasmine");
  await page.getByLabel("Red bean").check();
  await page.getByLabel("Brown sugar").check();
  await page.getByLabel("Delivery date").fill("2024-12-25");
  await page.getByLabel("With milk?").uncheck();
  await page.getByLabel("Special instructions").fill("10% sugar");
  await page.getByRole("link", { name: /Back to all orders/ }).click();

  // check if order was edited correctly
  const editedOrder = page.getByRole("link", { name: "Jasmine tea" });
  await expect(editedOrder).toHaveText(/10% sugar/);
  await expect(editedOrder).toHaveText(/12\/25\/2024/);
  await expect(editedOrder).toHaveText(
    /with pearl, taro, red bean, brown sugar/,
  );
});
