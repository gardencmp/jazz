import { unknownDataMessage } from "./exports.js";
import { SessionID } from "./ids.js";
import { CoValueContent, SyncMessage } from "./sync.js";

export const transformOutgoingMessageToPeer = (
  msg: SyncMessage,
  id: string,
): SyncMessage[] => {
  if (id.includes("indexedDB")) {
    return [msg];
  }

  const getSessionsObj = (msg: CoValueContent) =>
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
      if (msg.known === false)
        return [{ action: "known", id: msg.id, header: false, sessions: {} }];
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
      if (!msg.header) return unknownDataMessage(msg.id);

      if (msg.isCorrection) return { ...msg, action: "pull" };
      return { ...msg, action: "ack" };
    default:
      return msg;
  }
};
