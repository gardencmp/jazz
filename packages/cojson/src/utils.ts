import type { PeerState } from "./PeerState";
import type { SyncMessage } from "./sync";

export function logSyncMessage(
  direction: "to" | "from",
  peer: PeerState,
  msg: SyncMessage,
) {
  const directionBox = `background-color: ${direction === "to" ? "yellow" : "red"}; color: ${direction === "to" ? "black" : "white"}; padding: 1px 2px; margin-bottom: 4px; font-style: italic; border: 1px solid hotpink`;

  console.log(
    `%c${direction === "to" ? "node --->" : "node <----"} ${peer.role}`,
    directionBox,
    msg.action,
    msg.id,
    `header:`,
    (msg as any).header,
    `sessions:`,
    (msg as any).sessions,
  );
}
