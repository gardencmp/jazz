import { SessionID } from "./ids.js";
import { ContentMessage, SyncMessage, emptyDataMessage } from "./sync.js";

export const transformOutgoingMessageToPeer = (
  msg: SyncMessage,
  id: string,
): SyncMessage[] => {
  if (id.includes("indexedDB")) {
    switch (msg.action) {
      case "known":
        return [{ ...msg, action: "ack" }];
      default:
        return [msg];
      // return [msg];
    }
  }

  const getSessionsObj = (msg: ContentMessage) =>
    Object.entries(msg.new).reduce<{ [sessionID: SessionID]: number }>(
      (acc, [session, content]) => {
        acc[session as SessionID] =
          content.after + content.newTransactions.length;
        return acc;
      },
      {},
    );

  switch (msg.action) {
    case "pull":
      // load
      return [{ ...msg, action: "load" }];
    case "push":
      // load + content
      return [
        {
          action: "load",
          id: msg.id,
          header: true,
          sessions: getSessionsObj(msg),
        },
        { ...msg, action: "content" },
      ];
    case "data":
      // known + content => no response expected
      return [
        {
          action: "known",
          id: msg.id,
          header: true,
          sessions: getSessionsObj(msg),
        },
        { ...msg, action: "content" },
      ];
    case "ack":
      // known => no response expected
      return [{ ...msg, action: "known" }];
    default:
      return [msg];
  }
};

export const transformIncomingMessageFromPeer = (
  msg: SyncMessage,
  id: string,
): SyncMessage => {
  if (id.includes("indexedDB")) {
    return msg;
  }

  switch (msg.action) {
    case "load":
      return { ...msg, action: "pull" };
    case "content":
      return { ...msg, action: "push" };
    case "known":
      if (!msg.header) return emptyDataMessage(msg.id);
      if (msg.isCorrection) return { ...msg, action: "pull" };
      return { ...msg, action: "ack" };
    default:
      return msg;
  }
};
