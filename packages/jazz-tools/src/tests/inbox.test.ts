import { describe, expect, it } from "vitest";
import { CoMap } from "../coValues/coMap";
import { Group } from "../coValues/group";
import { Inbox, InboxSender } from "../coValues/inbox";
import { co } from "../internal";
import { setupTwoNodes, waitFor } from "./utils";

class Message extends CoMap {
  text = co.string;
}

describe("Inbox", () => {
  it("should create inbox and allow message exchange between accounts", async () => {
    const { clientAccount: sender, serverAccount: receiver } =
      await setupTwoNodes();

    const receiverInbox = await Inbox.load(receiver);

    // Create a message from sender
    const message = Message.create(
      { text: "Hello" },
      {
        owner: Group.create({ owner: sender }),
      },
    );

    // Setup inbox sender
    const inboxSender = await InboxSender.load(receiver.id, sender);
    inboxSender.sendMessage(message);

    // Track received messages
    const receivedMessages: Message[] = [];
    let senderAccountID: unknown = undefined;

    // Subscribe to inbox messages
    const unsubscribe = receiverInbox.subscribe(
      Message,
      async (message, id) => {
        senderAccountID = id;
        receivedMessages.push(message);
      },
    );

    // Wait for message to be received
    await waitFor(() => receivedMessages.length === 1);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]?.text).toBe("Hello");
    expect(senderAccountID).toBe(sender.id);

    unsubscribe();
  });

  it("should mark messages as processed", async () => {
    const { clientAccount: sender, serverAccount: receiver } =
      await setupTwoNodes();

    const receiverInbox = await Inbox.load(receiver);

    // Create a message from sender
    const message = Message.create(
      { text: "Hello" },
      {
        owner: Group.create({ owner: sender }),
      },
    );

    // Setup inbox sender
    const inboxSender = await InboxSender.load(receiver.id, sender);
    inboxSender.sendMessage(message);

    // Track received messages
    const receivedMessages: Message[] = [];

    // Subscribe to inbox messages
    const unsubscribe = receiverInbox.subscribe(Message, async (message) => {
      receivedMessages.push(message);
    });

    // Wait for message to be received
    await waitFor(() => receivedMessages.length === 1);

    inboxSender.sendMessage(message);

    await waitFor(() => receivedMessages.length === 2);

    expect(receivedMessages.length).toBe(2);
    expect(receivedMessages[0]?.text).toBe("Hello");
    expect(receivedMessages[1]?.text).toBe("Hello");

    unsubscribe();
  });

  it("should unsubscribe correctly", async () => {
    const { clientAccount: sender, serverAccount: receiver } =
      await setupTwoNodes();

    const receiverInbox = await Inbox.load(receiver);

    // Create a message from sender
    const message = Message.create(
      { text: "Hello" },
      {
        owner: Group.create({ owner: sender }),
      },
    );

    // Setup inbox sender
    const inboxSender = await InboxSender.load(receiver.id, sender);
    inboxSender.sendMessage(message);

    // Track received messages
    const receivedMessages: Message[] = [];

    // Subscribe to inbox messages
    const unsubscribe = receiverInbox.subscribe(Message, async (message) => {
      receivedMessages.push(message);
    });

    // Wait for message to be received
    await waitFor(() => receivedMessages.length === 1);

    unsubscribe();

    inboxSender.sendMessage(message);

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]?.text).toBe("Hello");
  });

  it("should retry failed messages", async () => {
    const { clientAccount: sender, serverAccount: receiver } =
      await setupTwoNodes();

    const receiverInbox = await Inbox.load(receiver);

    // Create a message from sender
    const message = Message.create(
      { text: "Hello" },
      {
        owner: Group.create({ owner: sender }),
      },
    );

    // Setup inbox sender
    const inboxSender = await InboxSender.load(receiver.id, sender);
    inboxSender.sendMessage(message);

    let failures = 0;

    // Subscribe to inbox messages
    const unsubscribe = receiverInbox.subscribe(
      Message,
      async (message) => {
        failures++;
        throw new Error("Failed");
      },
      { retries: 2 },
    );

    await waitFor(() => failures === 3);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const [failed] = Object.values(receiverInbox.failed.items).flat();
    expect(failed?.value.errors.length).toBe(3);
    unsubscribe();
  });
});
