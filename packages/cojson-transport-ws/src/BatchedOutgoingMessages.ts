import { SyncMessage } from "cojson";
import { addMessageToBacklog } from "./serialization.js";

export const MAX_OUTGOING_MESSAGES_CHUNK_BYTES = 25_000;

export class BatchedOutgoingMessages {
  private backlog: string = "";
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private send: (messages: string) => void) {}

  push(msg: SyncMessage) {
    const payload = addMessageToBacklog(this.backlog, msg);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    const maxChunkSizeReached =
      payload.length >= MAX_OUTGOING_MESSAGES_CHUNK_BYTES;
    const backlogExists = this.backlog.length > 0;

    if (maxChunkSizeReached && backlogExists) {
      this.sendMessagesInBulk();
      this.backlog = addMessageToBacklog("", msg);
      this.timeout = setTimeout(() => {
        this.sendMessagesInBulk();
      }, 0);
    } else if (maxChunkSizeReached) {
      this.backlog = payload;
      this.sendMessagesInBulk();
    } else {
      this.backlog = payload;
      this.timeout = setTimeout(() => {
        this.sendMessagesInBulk();
      }, 0);
    }
  }

  sendMessagesInBulk() {
    this.send(this.backlog);
    this.backlog = "";
  }

  close() {
    this.sendMessagesInBulk();
  }
}
