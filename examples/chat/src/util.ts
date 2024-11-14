// This is only for demo purposes for https://jazz.tools
// This is NOT needed to make the chat work

import { Chat } from "@/schema.ts";
import { Account, CoValue, ID } from "jazz-tools";

export function waitForUpload(id: ID<CoValue>, me: Account) {
  const syncManager = me._raw.core.node.syncManager;
  const peers = syncManager.getPeers();

  return Promise.all(
    peers.map((peer) => syncManager.waitForUploadIntoPeer(peer.id, id)),
  );
}

export function onChatLoad(chat: Chat, me: Account) {
  if (window.parent) {
    waitForUpload(chat.id, me).then(() => {
      window.parent.postMessage(
        { type: "chat-load", id: "/chat/" + chat.id },
        "*",
      );
    });
  }
}
