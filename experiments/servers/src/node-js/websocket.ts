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
} from "../util";

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

interface WebSocketMessage {
  uuid: string;
  formdata: {
    filename: string;
    base64: string;
    chunk: number;
    chunks: number;
  };
}

interface UploadState {
  targetPath: string;
  receivedChunks: Set<number>;
  totalChunks: number;
  originalFilename: string;
}

const uploads = new Map<string, UploadState>();
const CHUNK_SIZE = 100 * 1024; // 100KB chunk

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
            res.status(200).end(Object.values(covalues));
          } else {
            res.status(200).end(Object.keys(covalues));
          }
          break;

        case "GET":
          res.action("GET");
          const covalue: CoValue = covalues[payload.uuid];
          if (covalue) {
            if (binary) {
              const filePath = covalue.url?.path as string;
              if (!filePath) {
                res.status(404).end({ m: "CoValue binary file not found" });
                return;
              }

              const stat = fs.statSync(filePath);
              const fileSize = stat.size;

              logger.debug(
                `Streaming file '${filePath}' of size ${fileSize} (${
                  fileSize / 1_000_000
                }MB) in 100KB chunks ...`,
              );

              let start = 0;
              let end = fileSize - 1;

              const range = payload.range;
              if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                start = parseInt(parts[0], 10);
                end = Math.min(start + CHUNK_SIZE, fileSize - 1);
              }
              const contentLength = end - start + 1;
              // const fileStream = fs.createReadStream(filePath, { start, end });

              res.status(202).end({
                fileName: "sample.zip",
                contentLength,
                contentType: "application/octet-stream",
                fileSize,
                start,
                end,
              });

              // fileStream.on('data', (chunk) => {
              //   ws.send(chunk);
              // });

              let bytesRead = 0;
              const fileStream = fs.createReadStream(filePath, {
                highWaterMark: CHUNK_SIZE,
              });

              function sendChunk() {
                const chunk = fileStream.read(CHUNK_SIZE);
                if (chunk) {
                  ws.send(chunk, (error) => {
                    if (error) {
                      logger.error("Error sending chunk:", error);
                      fileStream.destroy();
                      return;
                    }
                    bytesRead += chunk.length;
                    if (bytesRead < fileSize) {
                      setTimeout(sendChunk, 0);
                    }
                  });
                } else if (!fileStream.readableEnded) {
                  fileStream.once("readable", sendChunk);
                }
              }

              fileStream.on("end", () => {
                res.status(204).end({ m: "OK" });
              });

              fileStream.on("error", (error) => {
                res.status(500).end({ m: "Error reading file" });
                fileStream.destroy();
              });

              sendChunk();
            } else {
              res.status(200).end(covalue);
            }
          } else {
            res.status(404).end({ m: "CoValue not found" });
          }
          break;

        case "POST":
          res.action("POST");
          if (payload) {
            if (binary) {
              // logger.debug(`POST / Create binary CoValue - testing ...`);
              await handleFileChunk(res, payload);
            } else {
              // logger.debug(`POST / Create CoValue ${JSON.stringify(payload)}`);
              addCoValue(covalues, payload);
              res.status(201).end({ m: "OK" });
            }
          } else {
            res.status(400).end({ m: "CoValue cannot be blank" });
          }
          break;

        case "PATCH":
          res.action("PATCH");
          const { uuid, ...partialCovalue } = payload;
          const existingCovalue = covalues[uuid];

          if (existingCovalue) {
            // logger.debug(`PATCH: ${JSON.stringify(payload)}`);
            if (binary) {
              updateCoValueBinary(existingCovalue, partialCovalue);
            } else {
              updateCoValue(existingCovalue, partialCovalue);
            }
            res.status(204).end({ m: "OK" });

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
            res.status(404).end({ m: "CoValue not found" });
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
          res.status(200).end({ m: "OK" });
          break;

        default:
          res.status(400).action("ERROR").end({ m: "Unknown action" });
      }
    } catch (error) {
      logger.error("Error processing WebSocket message:", error);
      new WebSocketResponse(ws, wss)
        .status(500)
        .action("ERROR")
        .end({ m: "Error processing request" });
    }
  });
});

async function handleFileChunk(
  res: WebSocketResponse,
  payload: WebSocketMessage,
) {
  const { uuid, formdata } = payload;
  const { filename, base64, chunk: chunkIndex, chunks: totalChunks } = formdata;

  if (!uploads.has(uuid)) {
      const ext = filename.substring(
          filename.lastIndexOf("."),
          filename.length,
      );
      const targetPath = `public/uploads/${uuid}${ext}`;

      uploads.set(uuid, {
          targetPath,
          receivedChunks: new Set(),
          totalChunks,
          originalFilename: filename,
      });

      fs.writeFileSync(targetPath, "");
  }

  const uploadState = uploads.get(uuid)!;

  try {
      // Check if we already received this chunk
      if (uploadState.receivedChunks.has(chunkIndex)) {
        res.status(202).end({ m: `Chunk ${chunkIndex} already received` });
        return;
      }

      // Write chunk to file at the correct position
      const writeStream = fs.createWriteStream(uploadState.targetPath, {
        flags: "r+",
        start: chunkIndex * CHUNK_SIZE,
      });

      const buffer = Buffer.from(base64, "base64");
      writeStream.write(buffer);
      writeStream.end();

      // Mark chunk as received
      uploadState.receivedChunks.add(chunkIndex);

      // Check if upload is complete
      logger.debug(`Received chunk ${uploadState.receivedChunks.size} of ${totalChunks} with size ${buffer.length}`);
      if (uploadState.receivedChunks.size === +totalChunks) {
        await handleCompletedUpload(res, uuid, uploadState);
        res.status(201).end({ m: "OK" });
      } else {
        res.status(200).end({ m: "OK" });
      }
  } catch (err: unknown) {
      const msg = `Error processing chunk ${chunkIndex} for file '${uploadState.originalFilename}'`;
      if (err instanceof Error) logger.error(err.stack);
      logger.error(msg, err);
      res.status(500).end({ m: msg });
  }
}

async function handleCompletedUpload(
  res: WebSocketResponse,
  uuid: string,
  uploadState: UploadState,
) {
  const file: File = {
      name: uploadState.originalFilename,
      path: uploadState.targetPath,
  };

  const covalue: CoValue = {
      uuid,
      lastUpdated: new Date(),
      author: "",
      title: "",
      summary: "",
      preview: "",
      url: file,
  };

  addCoValue(covalues, covalue);
  uploads.delete(uuid);

  logger.debug(
      `Chunked upload of ${uploadState.totalChunks} chunks for file '${uploadState.originalFilename}' completed successfully.`,
  );
}

// Start the server
server.listen(port, () => {
  logger.info(
    `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${port}`,
  );
  logger.info(
    `HTTP/1.1 WebSocket Server is running on: wss://localhost:${port}`,
  );
});
