import { SyncMessage } from "cojson";
import { PingMsg } from "./types.js";

export function addMessageToBacklog(backlog: string, message: SyncMessage) {
    if (!backlog) {
        return JSON.stringify(message);
    }
    return `${backlog}\n${JSON.stringify(message)}`;
}

export function deserializeMessages(messages: string) {
    try {
        return {
            ok: true,
            messages: messages.split("\n").map((msg) => JSON.parse(msg)) as
                | SyncMessage[]
                | PingMsg[],
        } as const;
    } catch (e) {
        console.error("Error while deserializing messages", e);
        return {
            ok: false,
            error: e,
        } as const;
    }
}
