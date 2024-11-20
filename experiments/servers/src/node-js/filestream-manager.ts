import fs from "fs";
import { Response } from "express";
import {
    CoValue,
    WebSocketResponse,
    File,
    covalues,
    addCoValue,
    logger,
    CHUNK_SIZE,
  } from "../util";

export interface UploadBody {
    uuid: string;  
    filename: string;
    chunk: string;
    chunks: string;
    base64: string;
}
  
  export interface UploadState {
    targetPath: string;
    receivedChunks: Set<number>;
    totalChunks: number;
    originalFilename: string;
  }

  interface StreamOptions {
    filePath: string;
    range?: string;
    fileName?: string;
  }
  
  interface StreamTarget {
    type: 'http' | 'websocket';
    res?: Response;
    wsr?: WebSocketResponse;
  }
  
export class FileStreamManager {

  private uploads: Map<string, UploadState>;

  constructor() {
    this.uploads = new Map<string, UploadState>();
  }
  
  // upload methods
  async chunkFileUpload(
    payload: UploadBody,
    res: WebSocketResponse | Response,
  ) {
    const { uuid, filename, base64, chunk, chunks } = payload;
    const chunkIndex = parseInt(chunk, 10);
    const totalChunks = parseInt(chunks, 10);

    if (!uuid || !filename || !base64 || chunkIndex == null || !totalChunks) {
        return res.status(400).json({ m: `Missing required fields. uuid: ${uuid}, filename: ${filename}, chunk: ${chunkIndex}, chunks: ${totalChunks}.` });
    }
  
    if (!this.uploads.has(uuid)) {
        const ext = filename.substring(
            filename.lastIndexOf("."),
            filename.length,
        );
        const targetPath = `public/uploads/${uuid}${ext}`;
  
        this.uploads.set(uuid, {
            targetPath,
            receivedChunks: new Set(),
            totalChunks,
            originalFilename: filename,
        });
  
        fs.writeFileSync(targetPath, "");
    }
  
    const uploadState = this.uploads.get(uuid)!;
  
    try {
        // Check if we already received this chunk
        if (uploadState.receivedChunks.has(chunkIndex)) {
          res.status(202).json({ m: `Chunk ${chunkIndex} already received` });
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
        if (uploadState.receivedChunks.size === totalChunks) {
          await this.handleCompletedUpload(uuid, uploadState);
          res.status(201).json({ m: "OK" });
        } else {
          res.status(200).json({ m: "OK" });
        }
    } catch (err: unknown) {
        const msg = `Error processing chunk ${chunkIndex} for file '${uploadState.originalFilename}'`;
        if (err instanceof Error) logger.error(err.stack);
        logger.error(msg, err);
        res.status(500).json({ m: msg });
    }
  }
  
  async handleCompletedUpload(
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
    this.uploads.delete(uuid);
  
    logger.debug(
        `Chunked upload of ${uploadState.totalChunks} chunks for file '${uploadState.originalFilename}' completed successfully.`,
    );
  }


// download methods
  validateFilePath(filePath: string): {
    valid: boolean;
    fileSize?: number;
    error?: string;
  } {
    try {
      if (!filePath) {
        return { valid: false, error: "File path is required" };
      }
      const stat = fs.statSync(filePath);
      return { valid: true, fileSize: stat.size };
    } catch (error) {
      return { valid: false, error: "File not found or inaccessible" };
    }
  }

  calculateRange(range: string | undefined, fileSize: number) {
    let start = 0;
    let end = fileSize - 1;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = Math.min(start + CHUNK_SIZE, fileSize - 1);
    }

    return { start, end, contentLength: end - start + 1 };
  }

  handleStreamError(
    error: Error,
    target: StreamTarget,
    fileStream: fs.ReadStream,
  ) {
    logger.error("Error in file stream:", error);
    fileStream.destroy();

    if (target.type === 'websocket' && target.wsr) {
      target.wsr.status(500).json({ m: "Error reading file" });
    } else if (target.type === 'http' && target.res) {
      target.res.status(500).json({ m: "Error reading file" });
    }
  }

  async chunkFileDownload(options: StreamOptions, target: StreamTarget): Promise<void> {
    const { filePath, range, fileName = "sample.zip" } = options;

    const validation = this.validateFilePath(filePath);
    if (!validation.valid) {
      if (target.type === 'websocket' && target.wsr) {
        target.wsr.status(404).json({ m: validation.error });
      } else if (target.type === 'http' && target.res) {
        target.res.status(404).json({ m: validation.error });
      }
      return;
    }

    const fileSize = validation.fileSize!;
    const { start, end, contentLength } = this.calculateRange(range, fileSize);

    if (target.type === 'websocket' && target.wsr) {
      target.wsr.status(202).json({
        fileName,
        contentLength,
        contentType: "application/octet-stream",
        fileSize,
        start,
        end,
      });
    } else if (target.type === 'http' && target.res) {
      target.res.writeHead(206, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': contentLength,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      });
    }

    logger.debug(
      `Streaming file '${filePath}' of size ${fileSize} (${
        fileSize / 1_000_000
      }MB) in ${CHUNK_SIZE / 1024}KB chunks...`
    );

    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: CHUNK_SIZE,
    });

    let bytesRead = 0;

    const sendChunk = () => {
      const chunk = fileStream.read(CHUNK_SIZE);
      if (chunk) {
        if (target.type === 'websocket' && target.wsr) {
          target.wsr.send(chunk, (error) => {
            if (error) {
              this.handleStreamError(error, target, fileStream);
              return;
            }
            bytesRead += chunk.length;
            if (bytesRead < fileSize) {
              setTimeout(sendChunk, 0);
            }
          });
        } else if (target.type === 'http' && target.res) {
          target.res.write(chunk, (error) => {
            if (error) {
              this.handleStreamError(error, target, fileStream);
              return;
            }
            bytesRead += chunk.length;
            if (bytesRead < fileSize) {
              setTimeout(sendChunk, 0);
            }
          });
        }
      } else if (!fileStream.readableEnded) {
        fileStream.once("readable", sendChunk);
      }
    };

    fileStream.on("end", () => {
      if (target.type === 'websocket' && target.wsr) {
        target.wsr.status(204).json({ m: "OK" });
      } else if (target.type === 'http' && target.res) {
        target.res.end();
      }
      logger.debug(
        `Streamed file '${filePath}' of size ${fileSize} (${
          fileSize / 1_000_000
        }MB) successfully.`
      );

    });

    fileStream.on("error", (error) => {
      this.handleStreamError(error, target, fileStream);
    });

    sendChunk();
  }
}