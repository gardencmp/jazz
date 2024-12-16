import { describe, expect, it, onTestFinished, vi } from "vitest";
import { Account, CoFeed, CoList, CoMap, co } from "../index.web.js";
import {
  type DepthsIn,
  FileStream,
  Group,
  createCoValueObservable,
  subscribeToCoValue,
} from "../internal.js";
import { setupAccount, waitFor } from "./utils.js";

class ChatRoom extends CoMap {
  messages = co.ref(MessagesList);
  name = co.string;
}

class Message extends CoMap {
  text = co.string;
  reactions = co.ref(ReactionsStream);
  attachment = co.optional.ref(FileStream);
}

class MessagesList extends CoList.Of(co.ref(Message)) {}
class ReactionsStream extends CoFeed.Of(co.string) {}

function createChatRoom(me: Account | Group, name: string) {
  return ChatRoom.create(
    { messages: MessagesList.create([], { owner: me }), name },
    { owner: me },
  );
}

function createMessage(me: Account | Group, text: string) {
  return Message.create(
    { text, reactions: ReactionsStream.create([], { owner: me }) },
    { owner: me },
  );
}

describe("subscribeToCoValue", () => {
  it("subscribes to a CoMap", async () => {
    const { me, meOnSecondPeer } = await setupAccount();

    const chatRoom = createChatRoom(me, "General");
    const updateFn = vi.fn();

    const unsubscribe = subscribeToCoValue(
      ChatRoom,
      chatRoom.id,
      meOnSecondPeer,
      {},
      updateFn,
    );

    onTestFinished(unsubscribe);

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: chatRoom.id,
        messages: null,
        name: "General",
      }),
    );

    updateFn.mockClear();

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: chatRoom.id,
        name: "General",
        messages: expect.any(Array),
      }),
    );

    updateFn.mockClear();
    chatRoom.name = "Lounge";

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: chatRoom.id,
        name: "Lounge",
        messages: expect.any(Array),
      }),
    );
  });

  it("shouldn't fire updates until the declared load depth isn't reached", async () => {
    const { me, meOnSecondPeer } = await setupAccount();

    const chatRoom = createChatRoom(me, "General");
    const updateFn = vi.fn();

    const unsubscribe = subscribeToCoValue(
      ChatRoom,
      chatRoom.id,
      meOnSecondPeer,
      {
        messages: [],
      },
      updateFn,
    );

    onTestFinished(unsubscribe);

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    expect(updateFn).toHaveBeenCalledTimes(1);
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: chatRoom.id,
        name: "General",
        messages: expect.any(Array),
      }),
    );
  });

  it("should fire updates when a ref entity is updates", async () => {
    const { me, meOnSecondPeer } = await setupAccount();

    const chatRoom = createChatRoom(me, "General");
    const message = createMessage(
      me,
      "Hello Luigi, are you ready to save the princess?",
    );
    chatRoom.messages?.push(message);

    const updateFn = vi.fn();

    const unsubscribe = subscribeToCoValue(
      ChatRoom,
      chatRoom.id,
      meOnSecondPeer,
      {
        messages: [{}],
      },
      updateFn,
    );

    onTestFinished(unsubscribe);

    await waitFor(() => {
      const lastValue = updateFn.mock.lastCall[0];

      expect(lastValue?.messages?.[0]?.text).toBe(message.text);
    });

    message.text = "Nevermind, she was gone to the supermarket";
    updateFn.mockClear();

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    const lastValue = updateFn.mock.lastCall[0];
    expect(lastValue?.messages?.[0]?.text).toBe(
      "Nevermind, she was gone to the supermarket",
    );
  });

  it("should handle the updates as immutable changes", async () => {
    const { me, meOnSecondPeer } = await setupAccount();

    const chatRoom = createChatRoom(me, "General");
    const message = createMessage(
      me,
      "Hello Luigi, are you ready to save the princess?",
    );
    const message2 = createMessage(me, "Let's go!");
    chatRoom.messages?.push(message);
    chatRoom.messages?.push(message2);

    const updateFn = vi.fn();

    const unsubscribe = subscribeToCoValue(
      ChatRoom,
      chatRoom.id,
      meOnSecondPeer,
      {
        messages: [
          {
            reactions: [],
          },
        ],
      },
      updateFn,
    );

    onTestFinished(unsubscribe);

    await waitFor(() => {
      const lastValue = updateFn.mock.lastCall[0];

      expect(lastValue?.messages?.[0]?.text).toBe(message.text);
    });

    const initialValue = updateFn.mock.lastCall[0];
    const initialMessagesList = initialValue?.messages;
    const initialMessage1 = initialValue?.messages[0];
    const initialMessage2 = initialValue?.messages[1];
    const initialMessageReactions = initialValue?.messages[0].reactions;

    message.reactions?.push("👍");

    updateFn.mockClear();

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    const lastValue = updateFn.mock.lastCall[0];
    expect(lastValue).not.toBe(initialValue);
    expect(lastValue.messages).not.toBe(initialMessagesList);
    expect(lastValue.messages[0]).not.toBe(initialMessage1);
    expect(lastValue.messages[0].reactions).not.toBe(initialMessageReactions);

    // This shouldn't change
    expect(lastValue.messages[1]).toBe(initialMessage2);

    // TODO: The initial should point at that snapshot in time
    // expect(lastValue.messages).not.toBe(initialValue.messages);
    // expect(lastValue.messages[0]).not.toBe(initialValue.messages[0]);
    // expect(lastValue.messages[1]).toBe(initialValue.messages[1]);
    // expect(lastValue.messages[0].reactions).not.toBe(initialValue.messages[0].reactions);
  });

  it("should keep the same identity on the ref entities when a property is updated", async () => {
    const { me, meOnSecondPeer } = await setupAccount();

    const chatRoom = createChatRoom(me, "General");
    const message = createMessage(
      me,
      "Hello Luigi, are you ready to save the princess?",
    );
    const message2 = createMessage(me, "Let's go!");
    chatRoom.messages?.push(message);
    chatRoom.messages?.push(message2);

    const updateFn = vi.fn();

    const unsubscribe = subscribeToCoValue(
      ChatRoom,
      chatRoom.id,
      meOnSecondPeer,
      {
        messages: [
          {
            reactions: [],
          },
        ],
      },
      updateFn,
    );

    onTestFinished(unsubscribe);

    await waitFor(() => {
      const lastValue = updateFn.mock.lastCall[0];

      expect(lastValue?.messages?.[0]?.text).toBe(message.text);
      expect(lastValue?.messages?.[1]?.text).toBe(message2.text);
    });

    const initialValue = updateFn.mock.lastCall[0];
    chatRoom.name = "Me and Luigi";

    updateFn.mockClear();

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalled();
    });

    const lastValue = updateFn.mock.lastCall[0];
    expect(lastValue).not.toBe(initialValue);
    expect(lastValue.name).toBe("Me and Luigi");

    expect(lastValue.messages).toBe(initialValue.messages);
    expect(lastValue.messages[0]).toBe(initialValue.messages[0]);
    expect(lastValue.messages[1]).toBe(initialValue.messages[1]);
  });
});

describe("createCoValueObservable", () => {
  class TestMap extends CoMap {
    color = co.string;
  }

  function createTestMap(me: Account | Group) {
    return TestMap.create({ color: "red" }, { owner: me });
  }

  it("should return undefined when there are no subscribers", async () => {
    const observable = createCoValueObservable();

    expect(observable.getCurrentValue()).toBeUndefined();
  });

  it("should update currentValue when subscribed", async () => {
    const { me, meOnSecondPeer } = await setupAccount();
    const testMap = createTestMap(me);
    const observable = createCoValueObservable<TestMap, DepthsIn<TestMap>>();
    const mockListener = vi.fn();

    const unsubscribe = observable.subscribe(
      TestMap,
      testMap.id,
      meOnSecondPeer,
      {},
      () => {
        mockListener();
      },
    );

    testMap.color = "blue";

    await waitFor(() => mockListener.mock.calls.length > 0);

    expect(observable.getCurrentValue()).toMatchObject({
      id: testMap.id,
      color: "blue",
    });

    unsubscribe();
  });

  it("should reset to undefined after unsubscribe", async () => {
    const { me, meOnSecondPeer } = await setupAccount();
    const testMap = createTestMap(me);
    const observable = createCoValueObservable<TestMap, DepthsIn<TestMap>>();
    const mockListener = vi.fn();

    const unsubscribe = observable.subscribe(
      TestMap,
      testMap.id,
      meOnSecondPeer,
      {},
      () => {
        mockListener();
      },
    );

    await waitFor(() => mockListener.mock.calls.length > 0);
    expect(observable.getCurrentValue()).toBeDefined();

    unsubscribe();
    expect(observable.getCurrentValue()).toBeUndefined();
  });
});
