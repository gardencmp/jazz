import https from "https";
import path from "path";
import {
  CoValue,
  WebSocketResponse,
  File,
  MutationEvent,
  covalues,
  events,
  addCoValue,
  updateCoValue,
  updateCoValueBinary,
  tlsCert,
  logger,
  port,
  CHUNK_SIZE,
} from "../util";
import { FileStreamManager } from "./filestream-manager";

import WebSocket from "ws";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";
import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import { lookup } from "mime-types";

// Serve up the client folder on page load
const rootDir = path.resolve(__dirname, "../..");
const staticDir =
  process.env.NODE_ENV === "production"
    ? path.join(rootDir, "dist", "public")
    : path.join(rootDir, "public");

const serveIndex = serveStatic(path.join(staticDir, "client", "ws"), {
  index: ["index.html", "index.htm"],
});

function sendFile(res: ServerResponse, filePath: string) {
  try {
    const fileStat = fs.statSync(filePath);

    res.writeHead(200, {
      "Content-Length": fileStat.size,
      "Content-Type": lookup(filePath) || "application/octet-stream",
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      logger.error(err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });
  } catch (err) {
    logger.error(err);
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("File Not Found");
  }
}

// Create the HTTPS server
const server = https.createServer(
  tlsCert,
  (req: IncomingMessage, res: ServerResponse) => {
    const prefix = "/faker";
    if (req.url?.startsWith(prefix)) {
      const file = req.url.substring(prefix.length, req.url.length);
      const filePath = path.join(
        __dirname,
        `../../node_modules/@faker-js/faker/dist/esm/${file}`,
      );

      // logger.info(`File ${file} fetching from path: ${filePath}`);
      sendFile(res, filePath);
    } else {
      // Serve other static content or handle other routes
      serveIndex(req, res, finalhandler(req, res));
    }
  },
);

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const fileManager = new FileStreamManager();

wss.on("connection", (ws: WebSocket) => {
  logger.debug("New WebSocket connection");

  ws.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);
      const { action, binary, payload } = data;
      const res = new WebSocketResponse(ws, wss);

      switch (action) {
        case "LIST":
          res.action("LIST");
          if (payload && payload === "all") {
            res.status(200).json(Object.values(covalues));
          } else {
            res.status(200).json(Object.keys(covalues));
          }
          break;

        case "GET":
          res.action("GET");
          const covalue: CoValue = covalues[payload.uuid];
          if (covalue) {
            if (binary) {
              const filePath = covalue.url?.path as string;
              if (!filePath) {
                res.status(404).json({ m: "CoValue binary file not found" });
                return;
              }

              await fileManager.chunkFileDownload(
                {
                  filePath,
                  range: payload.range,
                },
                {
                  type: 'websocket',
                  wsr: res,
                }
              );
            } else {
              // send textual CoValue
              res.status(200).json(covalue);
            }
          } else {
            res.status(404).json({ m: "CoValue not found" });
          }
          break;

        case "POST":
          res.action("POST");
          if (payload) {
            if (binary) {
              await fileManager.chunkFileUpload(payload, res);
            } else {
              addCoValue(covalues, payload);
              res.status(201).json({ m: "OK" });
            }
          } else {
            res.status(400).json({ m: "CoValue cannot be blank" });
          }
          break;

        case "PATCH":
          res.action("PATCH");
          const { uuid, ...partialCovalue } = payload;
          const existingCovalue = covalues[uuid];

          if (existingCovalue) {
            if (binary) {
              updateCoValueBinary(existingCovalue, partialCovalue);
            } else {
              updateCoValue(existingCovalue, partialCovalue);
            }
            res.status(204).json({ m: "OK" });

            // broadcast the mutation to clients
            const event = events.get(uuid) as MutationEvent;
            const { type } = event;
            logger.debug(
              `[Broadcast to ${
                wss.clients.size - 1
              } clients] Mutation event of type: '${type}' was found for: ${uuid}.`,
            );
            res.status(200).action("MUTATION").broadcast(event, ws);
          } else {
            res.status(404).json({ m: "CoValue not found" });
          }
          break;

        case "SUBSCRIBE":
          res.action("SUBSCRIBE");
          const subscriptionUuid = payload.uuid;
          const ua =
            payload.ua && payload.ua.length == 2
              ? payload.ua
              : `0${payload.ua}`;
          logger.debug(
            `[Client-#${ua}] Opening a subscription on: ${subscriptionUuid}.`,
          );

          // Clean up on close
          ws.on("close", () => {
            logger.debug(
              `[Client-#${ua}] Closed the WebSocket for: ${subscriptionUuid}.`,
            );
          });
          res.status(200).json({ m: "OK" });
          break;

        default:
          res.status(400).action("ERROR").json({ m: "Unknown action" });
      }
    } catch (error) {
      logger.error("Error processing WebSocket message:", error);
      new WebSocketResponse(ws, wss)
        .status(500)
        .action("ERROR")
        .json({ m: "Error processing request" });
    }
  });
});


// Start the server
server.listen(port, () => {
  logger.info(
    `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${port}`,
  );
  logger.info(
    `HTTP/1.1 WebSocket Server is running on: wss://localhost:${port}`,
  );
});
