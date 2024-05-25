import { WebSocket } from "ws";
import { WritableStream, ReadableStream } from "isomorphic-streams";

export function websocketReadableStream<T>(ws: WebSocket) {
    ws.binaryType = "arraybuffer";

    return new ReadableStream<T>({
        start(controller) {
            ws.addEventListener("message", (event) => {
                if (typeof event.data !== "string")
                    return console.warn(
                        "Got non-string message from client",
                        event.data,
                    );
                const msg = JSON.parse(event.data);
                if (msg.type === "ping") {
                    // console.debug(
                    //     "Got ping from",
                    //     msg.dc,
                    //     "latency",
                    //     Date.now() - msg.time,
                    //     "ms"
                    // );
                    return;
                }
                controller.enqueue(msg);
            });
            ws.addEventListener("close", () => {
                try {
                    controller.close();
                } catch (ignore) {
                    // will throw if already closed, with no way to check before-hand
                }
            });
            ws.addEventListener("error", () =>
                controller.error(new Error("The WebSocket errored!")),
            );
        },

        cancel() {
            ws.close();
        },
    });
}

export function websocketWritableStream<T>(ws: WebSocket) {
    return new WritableStream<T>({
        start(controller) {
            ws.addEventListener("close", () =>
                controller.error(
                    new Error("The WebSocket closed unexpectedly!"),
                ),
            );
            ws.addEventListener("error", () =>
                controller.error(new Error("The WebSocket errored!")),
            );

            if (ws.readyState === WebSocket.OPEN) {
                return;
            }

            return new Promise((resolve) =>
                ws.addEventListener("open", resolve, { once: true }),
            );
        },

        write(chunk) {
            ws.send(JSON.stringify(chunk));
            // Return immediately, since the web socket gives us no easy way to tell
            // when the write completes.
        },

        close() {
            return closeWS(1000);
        },

        abort(reason) {
            return closeWS(4000, reason && reason.message);
        },
    });

    function closeWS(code: number, reasonString?: string) {
        return new Promise<void>((resolve, reject) => {
            ws.onclose = (e) => {
                if (e.wasClean) {
                    resolve();
                } else {
                    reject(new Error("The connection was not closed cleanly"));
                }
            };
            ws.close(code, reasonString);
        });
    }
}
