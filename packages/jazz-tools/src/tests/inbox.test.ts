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

  it("should return the result of the message", async () => {
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

    const unsubscribe = receiverInbox.subscribe(Message, async (message) => {
      return Message.create(
        { text: "Responded from the inbox" },
        { owner: message._owner },
      );
    });

    // Setup inbox sender
    const inboxSender = await InboxSender.load<Message, Message>(
      receiver.id,
      sender,
    );
    const resultId = await inboxSender.sendMessage(message);

    const result = await Message.load(resultId, receiver, {});
    expect(result?.text).toBe("Responded from the inbox");

    unsubscribe();
  });

  it("should return the undefined if the subscription returns undefined", async () => {
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

    const unsubscribe = receiverInbox.subscribe(Message, async (message) => {});

    // Setup inbox sender
    const inboxSender = await InboxSender.load<Message>(receiver.id, sender);
    const result = await inboxSender.sendMessage(message);

    expect(result).toBeUndefined();

    unsubscribe();
  });

  it("should reject if the subscription throws an error", async () => {
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

    const unsubscribe = receiverInbox.subscribe(Message, async () => {
      return Promise.reject(new Error("Failed"));
    });

    // Setup inbox sender
    const inboxSender = await InboxSender.load<Message>(receiver.id, sender);

    await expect(inboxSender.sendMessage(message)).rejects.toThrow(
      "Error: Failed",
    );

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
    const promise = inboxSender.sendMessage(message);

    let failures = 0;

    // Subscribe to inbox messages
    const unsubscribe = receiverInbox.subscribe(
      Message,
      async () => {
        failures++;
        throw new Error("Failed");
      },
      { retries: 2 },
    );

    await expect(promise).rejects.toThrow();
    expect(failures).toBe(3);
    const [failed] = Object.values(receiverInbox.failed.items).flat();
    expect(failed?.value.errors.length).toBe(3);
    unsubscribe();
  });
});
