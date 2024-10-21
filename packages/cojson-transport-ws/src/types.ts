export interface WebsocketEvents {
    close: { code: number; reason: string };
    message: { data: unknown };
    open: void;
}

export interface PingMsg {
    type: "ping";
    time: number;
    dc: string;
}

export interface AnyWebSocket {
    addEventListener<K extends keyof WebsocketEvents>(
        type: K,
        listener: (event: WebsocketEvents[K]) => void,
        options?: { once: boolean },
    ): void;
    removeEventListener<K extends keyof WebsocketEvents>(
        type: K,
        listener: (event: WebsocketEvents[K]) => void,
    ): void;
    close(): void;
    send(data: string): void;
    readyState: number;
    bufferedAmount: number;
}
