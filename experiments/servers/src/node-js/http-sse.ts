import express, { Request, Response } from "express";
import https from "https";
import spdy from "spdy";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import multer from "multer";
import {
  CoValue,
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

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public/client/http"));
app.use(
  "/faker",
  express.static(
    path.join(__dirname, "../../node_modules/@faker-js/faker/dist/esm"),
  ),
);

app.get("/covalue", (req: Request, res: Response) => {
  const all = req.query.all as string;

  if (all) {
    res.json(Object.values(covalues));
  } else {
    res.json(Object.keys(covalues));
  }
});

app.get("/covalue/:uuid", (req: Request, res: Response) => {
  const { uuid } = req.params;

  const covalue = covalues[uuid];
  if (!covalue) {
    return res.status(404).json({ m: "CoValue not found" });
  }

  res.json(covalue);
});

app.get("/covalue/:uuid/binary", (req: Request, res: Response) => {
  const { uuid } = req.params;

  const covalue: CoValue = covalues[uuid];
  if (!covalue) {
    return res.status(404).json({ m: "CoValue not found." });
  }

  const filePath = covalue.url?.path as string;
  if (!filePath) {
    return res.status(404).json({ m: "CoValue binary file not found." });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const chunkSize = 100 * 1024; // 100KB chunk

  const range = req.headers.range;

  logger.debug(
    `Streaming file '${filePath}' of size ${fileSize} (${
      fileSize / 1_000_000
    }MB) in 100KB chunks ...`,
  );
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = Math.min(start + chunkSize, fileSize - 1);

    const contentLength = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "application/octet-stream",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "application/octet-stream",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.post("/covalue", (req: Request, res: Response) => {
  const covalue = req.body;

  if (!covalue) {
    return res.status(400).json({ m: "CoValue cannot be blank" });
  }

  addCoValue(covalues, covalue);
  res.status(201).json({ m: "OK" });
});

const upload = multer({ dest: "public/uploads" });
interface ChunkRequest extends Request {
  body: {
    uuid: string;
    chunk: string;
    chunks: string;
  };
}
app.post(
  "/covalue/binary",
  upload.single("file"),
  (req: ChunkRequest, res: Response) => {
    const { uuid, chunk, chunks } = req.body;
    const chunkIndex = parseInt(chunk, 10);
    const totalChunks = parseInt(chunks, 10);

    if (!req.file) {
      return res
        .status(400)
        .json({ m: "No file was specified in the upload." });
    }

    const originalName = req.file.originalname;
    const ext = originalName.substring(
      originalName.lastIndexOf("."),
      originalName.length,
    );
    const filename = `${uuid}${ext}`;
    const tempPath = req.file.path;
    const targetPath = `public/uploads/${filename}`;

    // Append the chunk to the target file
    try {
      fs.appendFileSync(targetPath, fs.readFileSync(tempPath));
      fs.unlinkSync(tempPath);
    } catch (err) {
      const msg = `Error processing chunked upload for file '${filename}'.`;
      logger.error(msg, err);
      return res.status(500).json({ m: msg });
    }

    if (chunkIndex === totalChunks - 1) {
      // This was the last chunk
      logger.debug(
        `Upload of ${totalChunks} chunks of file '${filename}' completed successfully.`,
      );
      const file: File = { name: filename, path: targetPath };
      const covalue: CoValue = {
        uuid: uuid,
        lastUpdated: new Date(),
        author: "",
        title: "",
        summary: "",
        preview: "",
        url: file,
      };
      addCoValue(covalues, covalue);
      res.status(201).json({ m: "OK" });
    } else {
      res.status(200).json({ m: "OK" });
    }
  },
);

app.patch("/covalue/:uuid", (req: Request, res: Response) => {
  const { uuid } = req.params;
  const partialCovalue = req.body as Partial<CoValue>;

  const covalue = covalues[uuid];
  if (!covalue) {
    return res.status(404).json({ m: "CoValue not found" });
  }

  updateCoValue(covalue, partialCovalue);
  res.status(204).send();

  // broadcast the mutation to subscribers
  broadcast(uuid);
});

app.patch("/covalue/:uuid/binary", (req: Request, res: Response) => {
  const { uuid } = req.params;
  const partialCovalue = req.body as Partial<CoValue>;

  const covalue = covalues[uuid];
  if (!covalue) {
    return res.status(404).json({ m: "CoValue not found" });
  }

  updateCoValueBinary(covalue, partialCovalue);
  res.status(204).send();

  // broadcast the mutation to subscribers
  broadcast(uuid);
});

interface Client {
  userAgentId: string;
  res: Response;
}
let clients: Client[] = [];

function broadcast(uuid: string): void {
  const event = events.get(uuid) as MutationEvent;
  const { type, ...data } = event;
  logger.debug(
    `[Broadcast to ${clients.length} clients] Mutation event of type: '${type}' was found for: ${uuid}.`,
  );

  clients.forEach((client) => {
    client.res.write(`event: ${type}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

app.get("/covalue/:uuid/subscribe/:ua", (req: Request, res: Response) => {
  const { uuid, ua } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  logger.debug(`[Client-#${ua}] Opening an event stream on: ${uuid}.`);
  const client: Client = {
    userAgentId: ua,
    res,
  };
  clients.push(client);

  // Clean up when the connection is closed
  req.on("close", () => {
    logger.debug(`[Client-#${ua}] Closed the event stream for: ${uuid}.`);
    clients = clients.filter((client) => client.userAgentId !== ua);
    res.end();
  });
});

export function createHTTPServer(isHttp2: boolean) {
  if (isHttp2) {
    // Start a HTTPS server using HTTP/2
    const server = spdy.createServer(tlsCert, app);
    server.listen(port, () => {
      logger.info(
        `HTTP/2 + TLSv1.3 Server is running on: https://localhost:${port}`,
      );
    });
  } else {
    // Start a HTTPS server using HTTP/1.1
    const server = https.createServer(tlsCert, app);
    server.listen(port, () => {
      logger.info(
        `HTTP/1.1 + TLSv1.3 Server is running on: https://localhost:${port}`,
      );
    });
  }
}
