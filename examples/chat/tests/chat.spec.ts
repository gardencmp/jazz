import { test } from "@playwright/test";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";

test("chat between two users", async ({ page }) => {
  const loginPage = new LoginPage(page);

  const mario = "S. Mario";
  const luigi = "Luigi";

  await loginPage.goto();
  await loginPage.fillUsername(mario);
  await loginPage.signup();

  const chatPage = new ChatPage(page);

  const message1ByMario = "Hello Luigi, are you ready to save the princess?";

  await chatPage.sendMessage(message1ByMario);
  await chatPage.expectMessageRow(message1ByMario);

  const roomURL = page.url();

  await chatPage.logout();

  await loginPage.expectLoaded();

  await loginPage.fillUsername(luigi);
  await loginPage.signup();

  await page.goto(roomURL);

  await chatPage.expectMessageRow(message1ByMario);

  const message2ByLuigi =
    "No, I'm not ready yet. I'm still trying to find the key to the castle.";

  await chatPage.sendMessage(message2ByLuigi);
  await chatPage.expectMessageRow(message2ByLuigi);

  await chatPage.logout();
  await loginPage.loginAs(mario);

  await page.goto(roomURL);

  await chatPage.expectMessageRow(message1ByMario);
  await chatPage.expectMessageRow(message2ByLuigi);
});
