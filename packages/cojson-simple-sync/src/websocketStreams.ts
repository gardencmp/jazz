import { WebSocket } from "ws";
import { WritableStream, ReadableStream } from "isomorphic-streams";
import { SyncMessage } from "cojson";

let msgsInLastInterval = 0;
let msgsOutLastInterval = 0;
let txsInLastInterval = 0;
let txsOutLastInterval = 0;
let maxMsgsInPerS = 0;
let maxMsgsOutPerS = 0;
let maxTxsInPerS = 0;
let maxTxsOutPerS = 0;
let lastInterval = Date.now();
const interval = 10_000;

setInterval(() => {
    const dt = (Date.now() - lastInterval)/1000;

    maxMsgsInPerS = Math.max(maxMsgsInPerS, Math.round(msgsInLastInterval / dt));
    maxMsgsOutPerS = Math.max(maxMsgsOutPerS, Math.round(msgsOutLastInterval / dt));
    maxTxsInPerS = Math.max(maxTxsInPerS, Math.round(txsInLastInterval / dt));
    maxTxsOutPerS = Math.max(maxTxsOutPerS, Math.round(txsOutLastInterval / dt));

    if (msgsInLastInterval || msgsOutLastInterval || txsInLastInterval || txsOutLastInterval) {
        console.log("++++++++++++++++++++++++++++++");
        console.log(
            "DT",
            dt,
            "Msgs in:",
            msgsInLastInterval,
            "out:",
            msgsOutLastInterval,
            "txs in:",
            txsInLastInterval,
            "out:",
            txsOutLastInterval
        );
        console.log(
            "MAX/s",
            "Msgs in:",
            maxMsgsInPerS,
            "out:",
            maxMsgsOutPerS,
            "txs in:",
            maxTxsInPerS,
            "out:",
            maxTxsOutPerS
        );
    }

    msgsInLastInterval = 0;
    msgsOutLastInterval = 0;
    txsInLastInterval = 0;
    txsOutLastInterval = 0;
    lastInterval = Date.now();
}, interval);

export function websocketReadableStream<T>(ws: WebSocket) {
    ws.binaryType = "arraybuffer";

    return new ReadableStream<T>({
        start(controller) {
            ws.addEventListener("message", (event) => {
                if (typeof event.data !== "string")
                    return console.warn(
                        "Got non-string message from client",
                        event.data
                    );
                const msg = JSON.parse(event.data);
                msgsInLastInterval++;
                const syncMsg = msg as SyncMessage;
                if (syncMsg.action === "content") {
                    txsInLastInterval +=
                        (syncMsg.header ? 1 : 0) +
                        Object.values(syncMsg.new).reduce(
                            (sum, sess) => sess.newTransactions.length + sum,
                            0
                        );
                }
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
            ws.addEventListener("close", () => controller.close());
            ws.addEventListener("error", () =>
                controller.error(new Error("The WebSocket errored!"))
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
                    new Error("The WebSocket closed unexpectedly!")
                )
            );
            ws.addEventListener("error", () =>
                controller.error(new Error("The WebSocket errored!"))
            );

            if (ws.readyState === WebSocket.OPEN) {
                return;
            }

            return new Promise((resolve) => ws.once("open", resolve));
        },

        write(chunk) {
            msgsOutLastInterval++;
            const syncMsg = chunk as SyncMessage;
            if (syncMsg.action === "content") {
                txsOutLastInterval +=
                    (syncMsg.header ? 1 : 0) +
                    Object.values(syncMsg.new).reduce(
                        (sum, sess) => sess.newTransactions.length + sum,
                        0
                    );
            }
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
