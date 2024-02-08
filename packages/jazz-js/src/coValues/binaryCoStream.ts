import {
    RawBinaryCoStream as RawBinaryCoStream,
    RawAccount as RawAccount,
    CoID,
    CoValueCore,
    RawControlledAccount,
} from "cojson";
import { ControlledAccount } from "./account.js";
import {
    Account,
    CoValueBase,
    CoValueSchemaBase,
    Group,
    ID,
    SimpleAccount,
} from "../index.js";
import { Schema } from "../schema.js";
import { Chunk, Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "../errors.js";
import { ControlledAccountCtx } from "../services.js";

export interface BinaryCoStream extends CoValueBase {
    id: ID<BinaryCoStream>;
    meta: BinaryCoStreamMeta;
    _raw: RawBinaryCoStream;

    start(options: {
        mimeType?: string;
        totalSizeBytes?: number;
        fileName?: string;
    }): void;
    push(data: ArrayBuffer | ArrayBufferView): void;
    end(): void;

    getChunks(options?: { allowUnfinished?: boolean }):
        | {
              chunks: Uint8Array[];
              mimeType?: string;
          }
        | undefined;
}

class BinaryCoStreamMeta {
    owner: Account | Group;
    core: CoValueCore;
    loadedAs: ControlledAccount;

    constructor(raw: RawBinaryCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
        this.core = raw.core;
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            raw.core.node.account as RawControlledAccount
        );
    }
}

export interface BinaryCoStreamSchema<Item extends Schema = Schema>
    extends Schema<BinaryCoStream>,
        CoValueSchemaBase<BinaryCoStream, RawBinaryCoStream> {
    _Type: "binarycostream";

    new (options: { owner: Account | Group }): BinaryCoStream;

    fromRaw(raw: RawBinaryCoStream): BinaryCoStream;

    load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined>;
}

export const BinaryCoStream = class BinaryCoStream implements BinaryCoStream {
    static _Type = "binarycostream" as const;
    static _Value: BinaryCoStream =
        "BinaryCoStream" as unknown as BinaryCoStream;
    static _RawValue: RawBinaryCoStream;
    id: ID<BinaryCoStream>;
    meta: BinaryCoStreamMeta;
    _raw: RawBinaryCoStream;

    constructor(
        options: { owner: Account | Group } | { fromRaw: RawBinaryCoStream }
    ) {
        let raw: RawBinaryCoStream;
        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else if (options.owner) {
            const rawOwner = options.owner._raw;
            raw = rawOwner.createBinaryStream();
        } else {
            throw new Error("Invalid options");
        }

        this._raw = raw;
        this.id = raw.id as unknown as ID<BinaryCoStream>;
        this.meta = new BinaryCoStreamMeta(raw);
    }

    static fromRaw(raw: RawBinaryCoStream): BinaryCoStream {
        return new BinaryCoStream({ fromRaw: raw });
    }

    static load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined> {
        return Effect.runPromise(
            Effect.provideService(
                this.loadEf(id, { onProgress }),
                ControlledAccountCtx,
                ControlledAccountCtx.of(as)
            )
        );
    }

    static loadEf(
        id: ID<BinaryCoStream>,
        options?: { onProgress?: (progress: number) => void }
    ): Effect.Effect<
        ControlledAccount,
        CoValueUnavailableError | UnknownCoValueLoadError,
        BinaryCoStream
    > {
        return Effect.gen(function* ($) {
            const as = yield* $(ControlledAccountCtx);
            const raw = yield* $(
                Effect.tryPromise({
                    try: () =>
                        as._raw.core.node.load(
                            id as unknown as CoID<RawBinaryCoStream>,
                            options?.onProgress
                        ),
                    catch: (cause) => new UnknownCoValueLoadError({ cause }),
                })
            );

            if (raw === "unavailable") {
                return yield* $(Effect.fail(new CoValueUnavailableError()));
            }

            return BinaryCoStream.fromRaw(raw);
        });
    }

    static subscribeEf(
        id: ID<BinaryCoStream>
    ): Stream.Stream<
        ControlledAccountCtx,
        CoValueUnavailableError | UnknownCoValueLoadError,
        BinaryCoStream
    > {
        throw new Error(
            "TODO: implement somehow with Scope and Stream.asyncScoped"
        );
    }

    static subscribe(
        id: ID<BinaryCoStream>,
        { as }: { as: ControlledAccount },
        onUpdate: (value: BinaryCoStream) => void
    ): () => void {
        let unsub: () => void = () => {
            stopImmediately = true;
        };
        let stopImmediately = false;
        void this.load(id, { as }).then((value) => {
            if (!value) return;
            unsub = value.subscribe(onUpdate);
            if (stopImmediately) {
                unsub();
            }
        });

        return () => {
            unsub();
        };
    }

    subscribeEf(): Stream.Stream<never, never, BinaryCoStream> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return Stream.asyncScoped((emit) =>
            Effect.gen(function* ($) {
                const unsub = self.subscribe((value) => {
                    void emit(Effect.succeed(Chunk.of(value)));
                });

                yield* $(Effect.addFinalizer(() => Effect.sync(unsub)));
            })
        );
    }

    subscribe(listener: (newValue: BinaryCoStream) => void): () => void {
        const subscribable = BinaryCoStream.fromRaw(this._raw);

        const unsub = subscribable._raw.subscribe((rawUpdate) => {
            if (!rawUpdate) return;
            listener(BinaryCoStream.fromRaw(rawUpdate));
        });

        return unsub;
    }

    start(options: {
        mimeType: string;
        totalSizeBytes?: number;
        fileName?: string;
    }) {
        this._raw.startBinaryStream(options);
    }

    push(data: Uint8Array) {
        this._raw.pushBinaryStreamChunk(data);
    }

    end() {
        this._raw.endBinaryStream();
    }

    getChunks(options?: { allowUnfinished?: boolean }):
        | {
              chunks: Uint8Array[];
              mimeType?: string;
          }
        | undefined {
        return this._raw.getBinaryChunks(options?.allowUnfinished);
    }

    toJSON() {
        return this.getChunks() || {};
    }
} satisfies BinaryCoStreamSchema;

export function isBinaryCoStreamSchema(
    value: unknown
): value is BinaryCoStreamSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "binarycostream"
    );
}

export function isBinaryCoStream(value: unknown): value is BinaryCoStream {
    return (
        typeof value === "object" &&
        value !== null &&
        isBinaryCoStreamSchema(value.constructor) &&
        "id" in value
    );
}
