import { Browser, expect, test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

async function createIsolatedPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  return page;
}

test("interaction between three users", async ({ browser, page }) => {
  const users = {
    guildMaster: page,
    player1: await createIsolatedPage(browser),
    player2: await createIsolatedPage(browser),
  };

  for (const [name, page] of Object.entries(users)) {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillUsername(name);
    await loginPage.signup();
  }

  await users.guildMaster.getByRole("button", { name: "Share" }).click();

  // Wait for the share to be completed
  await users.guildMaster.waitForFunction(() => {
    return Boolean(navigator.clipboard.readText());
  });

  const inviteLink = await users.guildMaster.evaluate(() => {
    return navigator.clipboard.readText();
  });

  // Invite users to the board
  await users.player1.goto(inviteLink);
  await users.player2.goto(inviteLink);

  // Player 1 submits a quest
  await users.player1.getByLabel("Quest Title").fill("Quest From Player 1");
  await users.player1
    .getByLabel("Quest Description")
    .fill("Quest Description From Player 1");
  await users.player1
    .getByRole("button", { name: "Submit Quest Proposal" })
    .click();

  // The guild master can see the quest proposal
  expect(users.guildMaster.getByText("Quest From Player 1")).toBeVisible();

  // The player their own quest proposal
  expect(users.player1.getByText("Quest From Player 1")).toBeVisible();

  // The player cannot see the other player's quest proposal
  expect(users.player2.getByText("Quest From Player 1")).not.toBeVisible();

  await users.guildMaster.getByRole("button", { name: "Approve" }).click();

  // Everyone can see the approved quests
  expect(users.guildMaster.getByText("Quest From Player 1")).toBeVisible();
  expect(users.player2.getByText("Quest From Player 1")).toBeVisible();
});
