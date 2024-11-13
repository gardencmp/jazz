import { CoID, RawCoValue } from "../coValue.js";
import { CoValueHeader, Transaction } from "../coValueCore.js";
import { Signature } from "../crypto/crypto.js";
import { RawCoID } from "../ids.js";
import { connectedPeers } from "../streamUtils.js";
import {
  CoValueKnownState,
  IncomingSyncStream,
  NewContentMessage,
  OutgoingSyncQueue,
  Peer,
} from "../sync.js";
import {
  BlockFilename,
  FileSystem,
  WalEntry,
  WalFilename,
  readChunk,
  readHeader,
  textDecoder,
  writeBlock,
  writeToWal,
} from "./FileSystem.js";
import {
  chunkToKnownState,
  contentSinceChunk,
  mergeChunks,
} from "./chunksAndKnownStates.js";
export type { BlockFilename, WalFilename } from "./FileSystem.js";

const MAX_N_LEVELS = 3;

export type CoValueChunk = {
  header?: CoValueHeader;
  sessionEntries: {
    [sessionID: string]: {
      after: number;
      lastSignature: Signature;
      transactions: Transaction[];
    }[];
  };
};

export class LSMStorage<WH, RH, FS extends FileSystem<WH, RH>> {
  currentWal: WH | undefined;
  coValues: {
    [id: RawCoID]: CoValueChunk | undefined;
  };
  fileCache: string[] | undefined;
  headerCache = new Map<
    BlockFilename,
    { [id: RawCoID]: { start: number; length: number } }
  >();
  blockFileHandles = new Map<
    BlockFilename,
    Promise<{ handle: RH; size: number }>
  >();

  constructor(
    public fs: FS,
    public fromLocalNode: IncomingSyncStream,
    public toLocalNode: OutgoingSyncQueue,
  ) {
    this.coValues = {};
    this.currentWal = undefined;

    let nMsg = 0;

    const processMessages = async () => {
      for await (const msg of fromLocalNode) {
        console.log("Storage msg start", nMsg);
        try {
          if (msg === "Disconnected" || msg === "PingTimeout") {
            throw new Error("Unexpected Disconnected message");
          }
          if (msg.action === "done") {
            return;
          }

          if (msg.action === "content") {
            await this.handleNewContent(msg);
          } else if (msg.action === "load" || msg.action === "known") {
            await this.sendNewContent(msg.id, msg, undefined);
          }
        } catch (e) {
          console.error(
            new Error(
              `Error reading from localNode, handling msg\n\n${JSON.stringify(
                msg,
                (k, v) =>
                  k === "changes" || k === "encryptedChanges"
                    ? v.slice(0, 20) + "..."
                    : v,
              )}`,
              { cause: e },
            ),
          );
        }
        console.log("Storage msg end", nMsg);
        nMsg++;
      }
    };

    processMessages().catch((e) =>
      console.error("Error in processMessages in storage", e),
    );

    setTimeout(
      () =>
        this.compact().catch((e) => {
          console.error("Error while compacting", e);
        }),
      20000,
    );
  }

  async sendNewContent(
    id: RawCoID,
    known: CoValueKnownState | undefined,
    asDependencyOf: RawCoID | undefined,
  ) {
    let coValue = this.coValues[id];

    if (!coValue) {
      coValue = await this.loadCoValue(id, this.fs);
    }

    if (!coValue) {
      this.toLocalNode
        .push({
          id: id,
          action: "known",
          header: false,
          sessions: {},
          asDependencyOf,
        })
        .catch((e) => console.error("Error while pushing known", e));

      return;
    }

    if (!known?.header && coValue.header?.ruleset.type === "ownedByGroup") {
      await this.sendNewContent(
        coValue.header.ruleset.group,
        undefined,
        asDependencyOf || id,
      );
    } else if (!known?.header && coValue.header?.ruleset.type === "group") {
      const dependedOnAccountsAndGroups = new Set();
      for (const session of Object.values(coValue.sessionEntries)) {
        for (const entry of session) {
          for (const tx of entry.transactions) {
            if (tx.privacy === "trusting") {
              const parsedChanges = JSON.parse(tx.changes);
              for (const change of parsedChanges) {
                if (change.op === "set" && change.key.startsWith("co_")) {
                  dependedOnAccountsAndGroups.add(change.key);
                }
                if (
                  change.op === "set" &&
                  change.key.startsWith("parent_co_")
                ) {
                  dependedOnAccountsAndGroups.add(
                    change.key.replace("parent_", ""),
                  );
                }
              }
            }
          }
        }
      }
      for (const accountOrGroup of dependedOnAccountsAndGroups) {
        await this.sendNewContent(
          accountOrGroup as CoID<RawCoValue>,
          undefined,
          asDependencyOf || id,
        );
      }
    }

    const newContentMessages = contentSinceChunk(id, coValue, known).map(
      (message) => ({ ...message, asDependencyOf }),
    );

    const ourKnown: CoValueKnownState = chunkToKnownState(id, coValue);

    this.toLocalNode
      .push({
        action: "known",
        ...ourKnown,
        asDependencyOf,
      })
      .catch((e) => console.error("Error while pushing known", e));

    for (const message of newContentMessages) {
      if (Object.keys(message.new).length === 0) continue;
      this.toLocalNode
        .push(message)
        .catch((e) => console.error("Error while pushing new content", e));
    }

    this.coValues[id] = coValue;
  }

  async withWAL(handler: (wal: WH) => Promise<void>) {
    if (!this.currentWal) {
      this.currentWal = await this.fs.createFile(
        `wal-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
      );
    }
    await handler(this.currentWal);
  }

  async handleNewContent(newContent: NewContentMessage) {
    const coValue = this.coValues[newContent.id];

    const newContentAsChunk: CoValueChunk = {
      header: newContent.header,
      sessionEntries: Object.fromEntries(
        Object.entries(newContent.new).map(([sessionID, newInSession]) => [
          sessionID,
          [
            {
              after: newInSession.after,
              lastSignature: newInSession.lastSignature,
              transactions: newInSession.newTransactions,
            },
          ],
        ]),
      ),
    };

    if (!coValue) {
      if (newContent.header) {
        // console.log("Creating in WAL", newContent.id);
        await this.withWAL((wal) =>
          writeToWal(wal, this.fs, newContent.id, newContentAsChunk),
        );

        this.coValues[newContent.id] = newContentAsChunk;
      } else {
        console.warn("Incontiguous incoming update for " + newContent.id);
        return;
      }
    } else {
      const merged = mergeChunks(coValue, newContentAsChunk);
      if (merged === "nonContigous") {
        console.warn(
          "Non-contigous new content for " + newContent.id,
          Object.entries(coValue.sessionEntries).map(([session, entries]) =>
            entries.map((entry) => ({
              session: session,
              after: entry.after,
              length: entry.transactions.length,
            })),
          ),
          Object.entries(newContentAsChunk.sessionEntries).map(
            ([session, entries]) =>
              entries.map((entry) => ({
                session: session,
                after: entry.after,
                length: entry.transactions.length,
              })),
          ),
        );
      } else {
        // console.log("Appending to WAL", newContent.id);
        await this.withWAL((wal) =>
          writeToWal(wal, this.fs, newContent.id, newContentAsChunk),
        );

        this.coValues[newContent.id] = merged;
      }
    }
  }

  async getBlockHandle(
    blockFile: BlockFilename,
    fs: FS,
  ): Promise<{ handle: RH; size: number }> {
    if (!this.blockFileHandles.has(blockFile)) {
      this.blockFileHandles.set(blockFile, fs.openToRead(blockFile));
    }

    return this.blockFileHandles.get(blockFile)!;
  }

  async loadCoValue(id: RawCoID, fs: FS): Promise<CoValueChunk | undefined> {
    const files = this.fileCache || (await fs.listFiles());
    this.fileCache = files;
    const blockFiles = (
      files.filter((name) => name.startsWith("L")) as BlockFilename[]
    ).sort();

    let result;

    for (const blockFile of blockFiles) {
      let cachedHeader:
        | { [id: RawCoID]: { start: number; length: number } }
        | undefined = this.headerCache.get(blockFile);

      const { handle, size } = await this.getBlockHandle(blockFile, fs);

      // console.log("Attempting to load", id, blockFile);

      if (!cachedHeader) {
        cachedHeader = {};
        const header = await readHeader(blockFile, handle, size, fs);
        for (const entry of header) {
          cachedHeader[entry.id] = {
            start: entry.start,
            length: entry.length,
          };
        }

        this.headerCache.set(blockFile, cachedHeader);
      }
      const headerEntry = cachedHeader[id];

      // console.log("Header entry", id, headerEntry);

      if (headerEntry) {
        const nextChunk = await readChunk(handle, headerEntry, fs);
        if (result) {
          const merged = mergeChunks(result, nextChunk);

          if (merged === "nonContigous") {
            console.warn(
              "Non-contigous chunks while loading " + id,
              result,
              nextChunk,
            );
          } else {
            result = merged;
          }
        } else {
          result = nextChunk;
        }
      }

      // await fs.close(handle);
    }

    return result;
  }

  async compact() {
    const fileNames = await this.fs.listFiles();

    const walFiles = fileNames.filter((name) =>
      name.startsWith("wal-"),
    ) as WalFilename[];
    walFiles.sort();

    const coValues = new Map<RawCoID, CoValueChunk>();

    console.log("Compacting WAL files", walFiles);
    if (walFiles.length === 0) return;

    const oldWal = this.currentWal;
    this.currentWal = undefined;

    if (oldWal) {
      await this.fs.close(oldWal);
    }

    for (const fileName of walFiles) {
      const { handle, size }: { handle: RH; size: number } =
        await this.fs.openToRead(fileName);
      if (size === 0) {
        await this.fs.close(handle);
        continue;
      }
      const bytes = await this.fs.read(handle, 0, size);

      const decoded = textDecoder.decode(bytes);
      const lines = decoded.split("\n");

      for (const line of lines) {
        if (line.length === 0) continue;
        const chunk = JSON.parse(line) as WalEntry;

        const existingChunk = coValues.get(chunk.id);

        if (existingChunk) {
          const merged = mergeChunks(existingChunk, chunk);
          if (merged === "nonContigous") {
            console.log(
              "Non-contigous chunks in " + chunk.id + ", " + fileName,
              existingChunk,
              chunk,
            );
          } else {
            coValues.set(chunk.id, merged);
          }
        } else {
          coValues.set(chunk.id, chunk);
        }
      }

      await this.fs.close(handle);
    }

    const highestBlockNumber = fileNames.reduce((acc, name) => {
      if (name.startsWith("L" + MAX_N_LEVELS)) {
        const num = parseInt(name.split("-")[1]!);
        if (num > acc) {
          return num;
        }
      }
      return acc;
    }, 0);

    console.log([...coValues.keys()], fileNames, highestBlockNumber);

    await writeBlock(coValues, MAX_N_LEVELS, highestBlockNumber + 1, this.fs);

    for (const walFile of walFiles) {
      await this.fs.removeFile(walFile);
    }
    this.fileCache = undefined;

    const fileNames2 = await this.fs.listFiles();

    const blockFiles = (
      fileNames2.filter((name) => name.startsWith("L")) as BlockFilename[]
    ).sort();

    const blockFilesByLevelInOrder: {
      [level: number]: BlockFilename[];
    } = {};

    for (const blockFile of blockFiles) {
      const level = parseInt(blockFile.split("-")[0]!.slice(1));
      if (!blockFilesByLevelInOrder[level]) {
        blockFilesByLevelInOrder[level] = [];
      }
      blockFilesByLevelInOrder[level]!.push(blockFile);
    }

    console.log(blockFilesByLevelInOrder);

    for (let level = MAX_N_LEVELS; level > 0; level--) {
      const nBlocksDesired = Math.pow(2, level);
      const blocksInLevel = blockFilesByLevelInOrder[level];

      if (blocksInLevel && blocksInLevel.length > nBlocksDesired) {
        console.log("Compacting blocks in level", level, blocksInLevel);

        const coValues = new Map<RawCoID, CoValueChunk>();

        for (const blockFile of blocksInLevel) {
          const { handle, size }: { handle: RH; size: number } =
            await this.getBlockHandle(blockFile, this.fs);

          if (size === 0) {
            continue;
          }
          const header = await readHeader(blockFile, handle, size, this.fs);
          for (const entry of header) {
            const chunk = await readChunk(handle, entry, this.fs);

            const existingChunk = coValues.get(entry.id);

            if (existingChunk) {
              const merged = mergeChunks(existingChunk, chunk);
              if (merged === "nonContigous") {
                console.log(
                  "Non-contigous chunks in " + entry.id + ", " + blockFile,
                  existingChunk,
                  chunk,
                );
              } else {
                coValues.set(entry.id, merged);
              }
            } else {
              coValues.set(entry.id, chunk);
            }
          }
        }

        let levelBelow = blockFilesByLevelInOrder[level - 1];
        if (!levelBelow) {
          levelBelow = [];
          blockFilesByLevelInOrder[level - 1] = levelBelow;
        }

        const highestBlockNumberInLevelBelow = levelBelow.reduce(
          (acc, name) => {
            const num = parseInt(name.split("-")[1]!);
            if (num > acc) {
              return num;
            }
            return acc;
          },
          0,
        );

        const newBlockName = await writeBlock(
          coValues,
          level - 1,
          highestBlockNumberInLevelBelow + 1,
          this.fs,
        );
        levelBelow.push(newBlockName);

        // delete blocks that went into this one
        for (const blockFile of blocksInLevel) {
          const handle = await this.getBlockHandle(blockFile, this.fs);
          await this.fs.close(handle.handle);
          await this.fs.removeFile(blockFile);
          this.blockFileHandles.delete(blockFile);
        }
      }
    }

    setTimeout(
      () =>
        this.compact().catch((e) => {
          console.error("Error while compacting", e);
        }),
      5000,
    );
  }

  static asPeer<WH, RH, FS extends FileSystem<WH, RH>>({
    fs,
    trace,
    localNodeName = "local",
  }: {
    fs: FS;
    trace?: boolean;
    localNodeName?: string;
  }): Peer {
    const [localNodeAsPeer, storageAsPeer] = connectedPeers(
      localNodeName,
      "storage",
      {
        peer1role: "client",
        peer2role: "storage",
        trace,
        crashOnClose: true,
      },
    );

    new LSMStorage(fs, localNodeAsPeer.incoming, localNodeAsPeer.outgoing);

    // return { ...storageAsPeer, priority: 200 };
    return storageAsPeer;
  }
}
