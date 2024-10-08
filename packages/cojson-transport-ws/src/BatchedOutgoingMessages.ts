import { SyncMessage } from "cojson";

export const MAX_OUTGOING_MESSAGES_CHUNK_SIZE = 10;

export class BatchedOutgoingMessages {
    private messages: SyncMessage[] = [];
    private timeout: ReturnType<typeof setTimeout> | null = null;

    constructor(private send: (messages: SyncMessage[]) => void) { }

    push(msg: SyncMessage) {
        const { messages } = this;
        messages.push(msg);

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (messages.length > MAX_OUTGOING_MESSAGES_CHUNK_SIZE) {
            this.sendMessagesInBulk();
        } else {
            this.timeout = setTimeout(() => {
                this.sendMessagesInBulk();
            }, 0);
        }
    }

    sendMessagesInBulk() {
        this.send(this.messages);
        this.messages.length = 0;
    }

    close() {
        this.sendMessagesInBulk();
    }
}
