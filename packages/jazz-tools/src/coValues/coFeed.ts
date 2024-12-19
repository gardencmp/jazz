/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  AgentID,
  BinaryStreamInfo,
  CojsonInternalTypes,
  JsonValue,
  RawAccountID,
  RawBinaryCoStream,
  RawCoStream,
  SessionID,
} from "cojson";
import { MAX_RECOMMENDED_TX_SIZE, cojsonInternals } from "cojson";
import type {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
  IfCo,
  Schema,
  SchemaFor,
  UnCo,
} from "../internal.js";
import {
  CoValueBase,
  ItemsSym,
  Ref,
  SchemaInit,
  co,
  ensureCoValueLoaded,
  inspect,
  isRefEncoded,
  loadCoValue,
  subscribeToCoValue,
  subscribeToExistingCoValue,
} from "../internal.js";
import { type Account } from "./account.js";
import { type Group } from "./group.js";
import { RegisteredSchemas } from "./registeredSchemas.js";

/** @deprecated Use CoFeedEntry instead */
export type CoStreamEntry<Item> = CoFeedEntry<Item>;

export type CoFeedEntry<Item> = SingleCoFeedEntry<Item> & {
  all: IterableIterator<SingleCoFeedEntry<Item>>;
};

/** @deprecated Use SingleCoFeedEntry instead */
export type SingleCoStreamEntry<Item> = SingleCoFeedEntry<Item>;

export type SingleCoFeedEntry<Item> = {
  value: NonNullable<Item> extends CoValue ? NonNullable<Item> | null : Item;
  ref: NonNullable<Item> extends CoValue ? Ref<NonNullable<Item>> : never;
  by?: Account | null;
  madeAt: Date;
  tx: CojsonInternalTypes.TransactionID;
};

/** @deprecated Use CoFeed instead */
export { CoFeed as CoStream };

/**
 * CoFeeds are collaborative logs of data.
 *
 * @categoryDescription Content
 * They are similar to `CoList`s, but with a few key differences:
 * - They are append-only
 * - They consist of several internal append-only logs, one per account session (tab, device, app instance, etc.)
 * - They expose those as a per-account aggregated view (default) or a precise per-session view
 *
 * ```ts
 * favDog.push("Poodle");
 * favDog.push("Schnowzer");
 * ```
 *
 * @category CoValues
 */
export class CoFeed<Item = any> extends CoValueBase implements CoValue {
  /**
   * Declare a `CoFeed` by subclassing `CoFeed.Of(...)` and passing the item schema using a `co` primitive or a `co.ref`.
   *
   * @example
   * ```ts
   * class ColorFeed extends CoFeed.Of(co.string) {}
   * class AnimalFeed extends CoFeed.Of(co.ref(Animal)) {}
   * ```
   *
   * @category Declaration
   */
  static Of<Item>(item: IfCo<Item, Item>): typeof CoFeed<Item> {
    return class CoFeedOf extends CoFeed<Item> {
      [co.items] = item;
    };
  }

  /**
   * The ID of this `CoFeed`
   * @category Content */
  declare id: ID<this>;
  /** @category Type Helpers */
  declare _type: "CoStream";
  static {
    this.prototype._type = "CoStream";
  }
  /** @category Internals */
  declare _raw: RawCoStream;

  /** @internal This is only a marker type and doesn't exist at runtime */
  [ItemsSym]!: Item;
  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _schema: any;
  /** @internal */
  get _schema(): {
    [ItemsSym]: SchemaFor<Item>;
  } {
    return (this.constructor as typeof CoFeed)._schema;
  }

  /**
   * The per-account view of this `CoFeed`
   *
   * @example
   * ```ts
   * // Access entries directly by account ID
   * const aliceEntries = feed[aliceAccount.id];
   * console.log(aliceEntries.value); // Latest value from Alice
   *
   * // Iterate through all accounts' entries
   * for (const [accountId, entries] of Object.entries(feed)) {
   *   console.log(`Latest entry from ${accountId}:`, entries.value);
   *
   *   // Access all entries from this account
   *   for (const entry of entries.all) {
   *     console.log(`Entry made at ${entry.madeAt}:`, entry.value);
   *   }
   * }
   * ```
   *
   * @category Content
   */
  [key: ID<Account>]: CoFeedEntry<Item>;

  /**
   * The current account's view of this `CoFeed`
   * @category Content
   */
  get byMe(): CoFeedEntry<Item> | undefined {
    if (this._loadedAs._type === "Account") {
      return this[this._loadedAs.id];
    } else {
      return undefined;
    }
  }

  /**
   * The per-session view of this `CoFeed`
   * @category Content
   */
  perSession!: {
    [key: SessionID]: CoFeedEntry<Item>;
  };

  /**
   * The current session's view of this `CoFeed`
   *
   * This is a shortcut for `this.perSession` where the session ID is the current session ID.
   *
   * @category Content
   */
  get inCurrentSession(): CoFeedEntry<Item> | undefined {
    if (this._loadedAs._type === "Account") {
      return this.perSession[this._loadedAs.sessionID!];
    } else {
      return undefined;
    }
  }

  constructor(
    options:
      | { init: Item[]; owner: Account | Group }
      | { fromRaw: RawCoStream },
  ) {
    super();

    if (options && "fromRaw" in options) {
      Object.defineProperties(this, {
        id: {
          value: options.fromRaw.id,
          enumerable: false,
        },
        _raw: { value: options.fromRaw, enumerable: false },
      });
    }

    return new Proxy(this, CoStreamProxyHandler as ProxyHandler<this>);
  }

  /**
   * Create a new `CoFeed`
   * @category Creation
   */
  static create<S extends CoFeed>(
    this: CoValueClass<S>,
    init: S extends CoFeed<infer Item> ? UnCo<Item>[] : never,
    options: { owner: Account | Group },
  ) {
    const instance = new this({ init, owner: options.owner });
    const raw = options.owner._raw.createStream();

    Object.defineProperties(instance, {
      id: {
        value: raw.id,
        enumerable: false,
      },
      _raw: { value: raw, enumerable: false },
    });

    if (init) {
      instance.push(...init);
    }
    return instance;
  }

  /**
   * Push items to this `CoFeed`
   *
   * Items are appended to the current session's log. Each session (tab, device, app instance)
   * maintains its own append-only log, which is then aggregated into the per-account view.
   *
   * @example
   * ```ts
   * // Adds items to current session's log
   * feed.push("item1", "item2");
   *
   * // View items from current session
   * console.log(feed.inCurrentSession);
   *
   * // View aggregated items from all sessions for current account
   * console.log(feed.byMe);
   * ```
   *
   * @category Content
   */
  push(...items: Item[]) {
    for (const item of items) {
      this.pushItem(item);
    }
  }

  private pushItem(item: Item) {
    const itemDescriptor = this._schema[ItemsSym] as Schema;

    if (itemDescriptor === "json") {
      this._raw.push(item as JsonValue);
    } else if ("encoded" in itemDescriptor) {
      this._raw.push(itemDescriptor.encoded.encode(item));
    } else if (isRefEncoded(itemDescriptor)) {
      this._raw.push((item as unknown as CoValue).id);
    }
  }

  /**
   * Get a JSON representation of the `CoFeed`
   * @category
   */
  toJSON(): {
    id: string;
    _type: "CoStream";
    [key: string]: unknown;
    in: { [key: string]: unknown };
  } {
    const itemDescriptor = this._schema[ItemsSym] as Schema;
    const mapper =
      itemDescriptor === "json"
        ? (v: unknown) => v
        : "encoded" in itemDescriptor
          ? itemDescriptor.encoded.encode
          : (v: unknown) => v && (v as CoValue).id;

    return {
      id: this.id,
      _type: this._type,
      ...Object.fromEntries(
        Object.entries(this).map(([account, entry]) => [
          account,
          mapper(entry.value),
        ]),
      ),
      in: Object.fromEntries(
        Object.entries(this.perSession).map(([session, entry]) => [
          session,
          mapper(entry.value),
        ]),
      ),
    };
  }

  /** @internal */
  [inspect](): {
    id: string;
    _type: "CoStream";
    [key: string]: unknown;
    in: { [key: string]: unknown };
  } {
    return this.toJSON();
  }

  /** @internal */
  static schema<V extends CoFeed>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this: { new (...args: any): V } & typeof CoFeed,
    def: { [ItemsSym]: V["_schema"][ItemsSym] },
  ) {
    this._schema ||= {};
    Object.assign(this._schema, def);
  }

  /**
   * Load a `CoFeed`
   * @category Subscription & Loading
   */
  static load<S extends CoFeed, Depth>(
    this: CoValueClass<S>,
    id: ID<S>,
    as: Account,
    depth: Depth & DepthsIn<S>,
  ): Promise<DeeplyLoaded<S, Depth> | undefined> {
    return loadCoValue(this, id, as, depth);
  }

  /**
   * Subscribe to a `CoFeed`, when you have an ID but don't have a `CoFeed` instance yet
   * @category Subscription & Loading
   */
  static subscribe<S extends CoFeed, Depth>(
    this: CoValueClass<S>,
    id: ID<S>,
    as: Account,
    depth: Depth & DepthsIn<S>,
    listener: (value: DeeplyLoaded<S, Depth>) => void,
  ): () => void {
    return subscribeToCoValue<S, Depth>(this, id, as, depth, listener);
  }

  /**
   * Ensure a `CoFeed` is loaded to the specified depth
   *
   * @returns A new instance of the same CoFeed that's loaded to the specified depth,
   * or undefined if it cannot be loaded that deeply
   * @category Subscription & Loading
   */
  ensureLoaded<S extends CoFeed, Depth>(
    this: S,
    depth: Depth & DepthsIn<S>,
  ): Promise<DeeplyLoaded<S, Depth> | undefined> {
    return ensureCoValueLoaded(this, depth);
  }

  /**
   * An instance method to subscribe to an existing `CoFeed`
   *
   * No need to provide an ID or Account since they're already part of the instance.
   * @category Subscription & Loading
   */
  subscribe<S extends CoFeed, Depth>(
    this: S,
    depth: Depth & DepthsIn<S>,
    listener: (value: DeeplyLoaded<S, Depth>) => void,
  ): () => void {
    return subscribeToExistingCoValue(this, depth, listener);
  }

  /**
   * Wait for the `CoFeed` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }) {
    return this._raw.core.waitForSync(options);
  }
}

/**
 * Converts a raw stream entry into a formatted CoFeed entry with proper typing and accessors.
 * @internal
 */
function entryFromRawEntry<Item>(
  accessFrom: CoValue,
  rawEntry: {
    by: RawAccountID | AgentID;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
    value: JsonValue;
  },
  loadedAs: Account | AnonymousJazzAgent,
  accountID: ID<Account> | undefined,
  itemField: Schema,
): Omit<CoFeedEntry<Item>, "all"> {
  return {
    get value(): NonNullable<Item> extends CoValue
      ? (CoValue & Item) | null
      : Item {
      if (itemField === "json") {
        return rawEntry.value as NonNullable<Item> extends CoValue
          ? (CoValue & Item) | null
          : Item;
      } else if ("encoded" in itemField) {
        return itemField.encoded.decode(rawEntry.value);
      } else if (isRefEncoded(itemField)) {
        return this.ref?.accessFrom(
          accessFrom,
          rawEntry.by + rawEntry.tx.sessionID + rawEntry.tx.txIndex + ".value",
        ) as NonNullable<Item> extends CoValue ? (CoValue & Item) | null : Item;
      } else {
        throw new Error("Invalid item field schema");
      }
    },
    get ref(): NonNullable<Item> extends CoValue
      ? Ref<NonNullable<Item>>
      : never {
      if (itemField !== "json" && isRefEncoded(itemField)) {
        const rawId = rawEntry.value;
        return new Ref(
          rawId as unknown as ID<CoValue>,
          loadedAs,
          itemField,
        ) as NonNullable<Item> extends CoValue ? Ref<NonNullable<Item>> : never;
      } else {
        return undefined as never;
      }
    },
    get by() {
      return (
        accountID &&
        new Ref<Account>(accountID as unknown as ID<Account>, loadedAs, {
          ref: RegisteredSchemas["Account"],
          optional: false,
        })?.accessFrom(
          accessFrom,
          rawEntry.by + rawEntry.tx.sessionID + rawEntry.tx.txIndex + ".by",
        )
      );
    },
    madeAt: rawEntry.at,
    tx: rawEntry.tx,
  };
}

/**
 * The proxy handler for `CoFeed` instances
 * @internal
 */
export const CoStreamProxyHandler: ProxyHandler<CoFeed> = {
  get(target, key, receiver) {
    if (typeof key === "string" && key.startsWith("co_")) {
      const rawEntry = target._raw.lastItemBy(key as RawAccountID);

      if (!rawEntry) return;
      const entry = entryFromRawEntry(
        receiver,
        rawEntry,
        target._loadedAs,
        key as unknown as ID<Account>,
        target._schema[ItemsSym],
      );

      Object.defineProperty(entry, "all", {
        get: () => {
          const allRawEntries = target._raw.itemsBy(key as RawAccountID);
          return (function* () {
            while (true) {
              const rawEntry = allRawEntries.next();
              if (rawEntry.done) return;
              yield entryFromRawEntry(
                receiver,
                rawEntry.value,
                target._loadedAs,
                key as unknown as ID<Account>,
                target._schema[ItemsSym],
              );
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          })() satisfies IterableIterator<SingleCoFeedEntry<any>>;
        },
      });

      return entry;
    } else if (key === "perSession") {
      return new Proxy({}, CoStreamPerSessionProxyHandler(target, receiver));
    } else {
      return Reflect.get(target, key, receiver);
    }
  },
  set(target, key, value, receiver) {
    if (key === ItemsSym && typeof value === "object" && SchemaInit in value) {
      (target.constructor as typeof CoFeed)._schema ||= {};
      (target.constructor as typeof CoFeed)._schema[ItemsSym] =
        value[SchemaInit];
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
  defineProperty(target, key, descriptor) {
    if (
      descriptor.value &&
      key === ItemsSym &&
      typeof descriptor.value === "object" &&
      SchemaInit in descriptor.value
    ) {
      (target.constructor as typeof CoFeed)._schema ||= {};
      (target.constructor as typeof CoFeed)._schema[ItemsSym] =
        descriptor.value[SchemaInit];
      return true;
    } else {
      return Reflect.defineProperty(target, key, descriptor);
    }
  },
  ownKeys(target) {
    const keys = Reflect.ownKeys(target);

    for (const accountID of target._raw.accounts()) {
      keys.push(accountID);
    }

    return keys;
  },
  getOwnPropertyDescriptor(target, key) {
    if (typeof key === "string" && key.startsWith("co_")) {
      return {
        configurable: true,
        enumerable: true,
        writable: false,
      };
    } else {
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  },
};

/**
 * The proxy handler for the per-session view of a `CoFeed`
 * @internal
 */
const CoStreamPerSessionProxyHandler = (
  innerTarget: CoFeed,
  accessFrom: CoFeed,
): ProxyHandler<Record<string, never>> => ({
  get(_target, key, receiver) {
    if (typeof key === "string" && key.includes("session")) {
      const sessionID = key as SessionID;
      const rawEntry = innerTarget._raw.lastItemIn(sessionID);

      if (!rawEntry) return;
      const by = cojsonInternals.accountOrAgentIDfromSessionID(sessionID);

      const entry = entryFromRawEntry(
        accessFrom,
        rawEntry,
        innerTarget._loadedAs,
        cojsonInternals.isAccountID(by)
          ? (by as unknown as ID<Account>)
          : undefined,
        innerTarget._schema[ItemsSym],
      );

      Object.defineProperty(entry, "all", {
        get: () => {
          const allRawEntries = innerTarget._raw.itemsIn(sessionID);
          return (function* () {
            while (true) {
              const rawEntry = allRawEntries.next();
              if (rawEntry.done) return;
              yield entryFromRawEntry(
                accessFrom,
                rawEntry.value,
                innerTarget._loadedAs,
                cojsonInternals.isAccountID(by)
                  ? (by as unknown as ID<Account>)
                  : undefined,
                innerTarget._schema[ItemsSym],
              );
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          })() satisfies IterableIterator<SingleCoFeedEntry<any>>;
        },
      });

      return entry;
    } else {
      return Reflect.get(innerTarget, key, receiver);
    }
  },
  ownKeys() {
    return innerTarget._raw.sessions();
  },
  getOwnPropertyDescriptor(target, key) {
    if (typeof key === "string" && key.startsWith("co_")) {
      return {
        configurable: true,
        enumerable: true,
        writable: false,
      };
    } else {
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  },
});

/** @deprecated Use FileStream instead */
export { FileStream as BinaryCoStream };

/**
 * FileStreams are `CoFeed`s that contain binary data, collaborative versions of `Blob`s.
 *
 * @categoryDescription Declaration
 * `FileStream` can be referenced in schemas.
 *
 * ```ts
 * import { co, FileStream } from "jazz-tools";
 *
 * class MyCoMap extends CoMap {
 *   file = co.ref(FileStream);
 * }
 * ```
 *
 * @category CoValues
 */
export class FileStream extends CoValueBase implements CoValue {
  /**
   * The ID of this `FileStream`
   * @category Content
   */
  declare id: ID<this>;
  /** @category Type Helpers */
  declare _type: "BinaryCoStream";
  /** @internal */
  declare _raw: RawBinaryCoStream;

  constructor(
    options:
      | {
          owner: Account | Group;
        }
      | {
          fromRaw: RawBinaryCoStream;
        },
  ) {
    super();

    let raw: RawBinaryCoStream;

    if ("fromRaw" in options) {
      raw = options.fromRaw;
    } else {
      const rawOwner = options.owner._raw;
      raw = rawOwner.createBinaryStream();
    }

    Object.defineProperties(this, {
      id: {
        value: raw.id,
        enumerable: false,
      },
      _type: { value: "BinaryCoStream", enumerable: false },
      _raw: { value: raw, enumerable: false },
    });
  }

  static create<S extends FileStream>(
    this: CoValueClass<S>,
    options: { owner: Account | Group },
  ) {
    return new this(options);
  }

  getChunks(options?: {
    allowUnfinished?: boolean;
  }):
    | (BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean })
    | undefined {
    return this._raw.getBinaryChunks(options?.allowUnfinished);
  }

  isBinaryStreamEnded(): boolean {
    return this._raw.isBinaryStreamEnded();
  }

  start(options: BinaryStreamInfo): void {
    this._raw.startBinaryStream(options);
  }

  push(data: Uint8Array): void {
    this._raw.pushBinaryStreamChunk(data);
  }

  end(): void {
    this._raw.endBinaryStream();
  }

  toBlob(options?: { allowUnfinished?: boolean }): Blob | undefined {
    const chunks = this.getChunks({
      allowUnfinished: options?.allowUnfinished,
    });

    if (!chunks) {
      return undefined;
    }

    // @ts-ignore
    return new Blob(chunks.chunks, { type: chunks.mimeType });
  }

  /**
   * Load a `FileStream` as a `Blob`
   *
   * @category Content
   */
  static async loadAsBlob(
    id: ID<FileStream>,
    as: Account,
    options?: {
      allowUnfinished?: boolean;
    },
  ): Promise<Blob | undefined> {
    let stream = await this.load(id, as, []);

    /**
     * If the user hasn't requested an incomplete blob and the
     * stream isn't complete wait for the stream download before progressing
     */
    if (!options?.allowUnfinished && !stream?.isBinaryStreamEnded()) {
      stream = await new Promise<FileStream>((resolve) => {
        const unsubscribe = subscribeToCoValue(this, id, as, [], (value) => {
          if (value.isBinaryStreamEnded()) {
            unsubscribe();
            resolve(value);
          }
        });
      });
    }

    return stream?.toBlob({
      allowUnfinished: options?.allowUnfinished,
    });
  }

  /**
   * Create a `FileStream` from a `Blob` or `File`
   *
   * @example
   * ```ts
   * import { co, FileStream } from "jazz-tools";
   *
   * const fileStream = await FileStream.createFromBlob(file, {owner: group})
   * ```
   * @category Content
   */
  static async createFromBlob(
    blob: Blob | File,
    options: {
      owner: Group | Account;
      onProgress?: (progress: number) => void;
    },
  ): Promise<FileStream> {
    const stream = this.create({ owner: options.owner });

    const start = Date.now();

    const data = new Uint8Array(await blob.arrayBuffer());
    stream.start({
      mimeType: blob.type,
      totalSizeBytes: blob.size,
      fileName: blob instanceof File ? blob.name : undefined,
    });
    const chunkSize = MAX_RECOMMENDED_TX_SIZE;

    let lastProgressUpdate = Date.now();

    for (let idx = 0; idx < data.length; idx += chunkSize) {
      stream.push(data.slice(idx, idx + chunkSize));

      if (Date.now() - lastProgressUpdate > 100) {
        options.onProgress?.(idx / data.length);
        lastProgressUpdate = Date.now();
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    stream.end();
    const end = Date.now();

    console.debug(
      "Finished creating binary stream in",
      (end - start) / 1000,
      "s - Throughput in MB/s",
      (1000 * (blob.size / (end - start))) / (1024 * 1024),
    );
    options.onProgress?.(1);

    return stream;
  }

  /**
   * Get a JSON representation of the `FileStream`
   * @category Content
   */
  toJSON(): {
    id: string;
    _type: "BinaryCoStream";
    mimeType?: string;
    totalSizeBytes?: number;
    fileName?: string;
    chunks?: Uint8Array[];
    finished?: boolean;
  } {
    return {
      id: this.id,
      _type: this._type,
      ...this.getChunks(),
    };
  }

  /** @internal */
  [inspect]() {
    return this.toJSON();
  }

  /**
   * Load a `FileStream`
   * @category Subscription & Loading
   */
  static load<B extends FileStream, Depth>(
    this: CoValueClass<B>,
    id: ID<B>,
    as: Account,
    depth: Depth & DepthsIn<B>,
  ): Promise<DeeplyLoaded<B, Depth> | undefined> {
    return loadCoValue(this, id, as, depth);
  }

  /**
   * Subscribe to a `FileStream`, when you have an ID but don't have a `FileStream` instance yet
   * @category Subscription & Loading
   */
  static subscribe<B extends FileStream, Depth>(
    this: CoValueClass<B>,
    id: ID<B>,
    as: Account,
    depth: Depth & DepthsIn<B>,
    listener: (value: DeeplyLoaded<B, Depth>) => void,
  ): () => void {
    return subscribeToCoValue<B, Depth>(this, id, as, depth, listener);
  }

  ensureLoaded<B extends FileStream, Depth>(
    this: B,
    depth: Depth & DepthsIn<B>,
  ): Promise<DeeplyLoaded<B, Depth> | undefined> {
    return ensureCoValueLoaded(this, depth);
  }

  /**
   * An instance method to subscribe to an existing `FileStream`
   * @category Subscription & Loading
   */
  subscribe<B extends FileStream, Depth>(
    this: B,
    depth: Depth & DepthsIn<B>,
    listener: (value: DeeplyLoaded<B, Depth>) => void,
  ): () => void {
    return subscribeToExistingCoValue(this, depth, listener);
  }

  /**
   * Wait for the `FileStream` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: { timeout?: number }) {
    return this._raw.core.waitForSync(options);
  }
}
