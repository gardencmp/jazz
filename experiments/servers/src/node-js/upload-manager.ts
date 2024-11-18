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

export class FileUploadManager {

  private uploads: Map<string, UploadState>;

  constructor() {
    this.uploads = new Map<string, UploadState>();
  }
  
  async handleFileChunk(
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
}
  