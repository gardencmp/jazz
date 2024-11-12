import { CryptoProvider, StreamingHash } from "../crypto/crypto.js";
import { RawCoID } from "../ids.js";
import { CoValueChunk } from "./index.js";

export type BlockFilename = `L${number}-${string}-${string}-H${number}.jsonl`;

export type BlockHeader = { id: RawCoID; start: number; length: number }[];

export type WalEntry = { id: RawCoID } & CoValueChunk;

export type WalFilename = `wal-${number}.jsonl`;

export interface FileSystem<WriteHandle, ReadHandle> {
  crypto: CryptoProvider;
  createFile(filename: string): Promise<WriteHandle>;
  append(handle: WriteHandle, data: Uint8Array): Promise<void>;
  close(handle: ReadHandle | WriteHandle): Promise<void>;
  closeAndRename(handle: WriteHandle, filename: BlockFilename): Promise<void>;
  openToRead(filename: string): Promise<{ handle: ReadHandle; size: number }>;
  read(handle: ReadHandle, offset: number, length: number): Promise<Uint8Array>;
  listFiles(): Promise<string[]>;
  removeFile(filename: BlockFilename | WalFilename): Promise<void>;
}

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export async function readChunk<RH, FS extends FileSystem<unknown, RH>>(
  handle: RH,
  header: { start: number; length: number },
  fs: FS,
): Promise<CoValueChunk> {
  const chunkBytes = await fs.read(handle, header.start, header.length);

  const chunk = JSON.parse(textDecoder.decode(chunkBytes));
  return chunk;
}

export async function readHeader<RH, FS extends FileSystem<unknown, RH>>(
  filename: string,
  handle: RH,
  size: number,
  fs: FS,
): Promise<BlockHeader> {
  const headerLength = Number(filename.match(/-H(\d+)\.jsonl$/)![1]!);

  const headerBytes = await fs.read(handle, size - headerLength, headerLength);

  const header = JSON.parse(textDecoder.decode(headerBytes));
  return header;
}

export async function writeBlock<WH, RH, FS extends FileSystem<WH, RH>>(
  chunks: Map<RawCoID, CoValueChunk>,
  level: number,
  blockNumber: number,
  fs: FS,
): Promise<BlockFilename> {
  if (chunks.size === 0) {
    throw new Error("No chunks to write");
  }

  const blockHeader: BlockHeader = [];

  let offset = 0;

  const file = await fs.createFile(
    "wipBlock" + Math.random().toString(36).substring(7) + ".tmp.jsonl",
  );
  const hash = new StreamingHash(fs.crypto);

  const chunksSortedById = Array.from(chunks).sort(([id1], [id2]) =>
    id1.localeCompare(id2),
  );

  for (const [id, chunk] of chunksSortedById) {
    const encodedBytes = hash.update(chunk);
    const encodedBytesWithNewline = new Uint8Array(encodedBytes.length + 1);
    encodedBytesWithNewline.set(encodedBytes);
    encodedBytesWithNewline[encodedBytes.length] = 10;
    await fs.append(file, encodedBytesWithNewline);
    const length = encodedBytesWithNewline.length;
    blockHeader.push({ id, start: offset, length });
    offset += length;
  }

  const headerBytes = textEncoder.encode(JSON.stringify(blockHeader));
  await fs.append(file, headerBytes);

  // console.log(
  //     "full file",
  //     yield* $(
  //         fs.read(file as unknown as RH, 0, offset + headerBytes.length),
  //     ),
  // );

  const filename: BlockFilename = `L${level}-${(blockNumber + "").padStart(
    3,
    "0",
  )}-${hash.digest().replace("hash_", "").slice(0, 15)}-H${
    headerBytes.length
  }.jsonl`;
  // console.log("renaming to" + filename);
  await fs.closeAndRename(file, filename);

  return filename;

  // console.log("Wrote block", filename, blockHeader);
  // console.log("IDs in block", blockHeader.map(e => e.id));
}

export async function writeToWal<WH, RH, FS extends FileSystem<WH, RH>>(
  handle: WH,
  fs: FS,
  id: RawCoID,
  chunk: CoValueChunk,
) {
  const walEntry: WalEntry = {
    id,
    ...chunk,
  };
  const bytes = textEncoder.encode(JSON.stringify(walEntry) + "\n");
  console.log("writing to WAL", handle, id, bytes.length);
  return fs.append(handle, bytes);
}
