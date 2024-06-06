import { CoValueCore } from "../coValueCore.js";
import { JsonObject } from "../jsonValue.js";
import { DeletionOpPayload, InsertionOpPayload, OpID, RawCoList } from "./coList.js";

export type StringifiedOpID = string & { __stringifiedOpID: true };

export function stringifyOpID(opID: OpID): StringifiedOpID {
    return `${opID.sessionID}:${opID.txIndex}:${opID.changeIdx}` as StringifiedOpID;
}

type PlaintextIdxMapping = {
    opIDbeforeIdx: OpID[];
    opIDafterIdx: OpID[];
    idxAfterOpID: { [opID: StringifiedOpID]: number };
    idxBeforeOpID: { [opID: StringifiedOpID]: number };
};

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export class RawCoPlainText<
    Meta extends JsonObject | null = JsonObject | null,
> extends RawCoList<string, Meta> {
    /** @category 6. Meta */
    type = "coplaintext" as const;

    _cachedMapping: WeakMap<
        NonNullable<typeof this._cachedEntries>,
        PlaintextIdxMapping
    >;

    constructor(core: CoValueCore) {
        super(core);
        this._cachedMapping = new WeakMap();
    }

    get mapping() {
        const entries = this.entries();
        let mapping = this._cachedMapping.get(entries);
        if (mapping) {
            return mapping;
        }

        mapping = {
            opIDbeforeIdx: [],
            opIDafterIdx: [],
            idxAfterOpID: {},
            idxBeforeOpID: {},
        };

        let idxBefore = 0;

        for (const entry of entries) {
            const idxAfter = idxBefore + entry.value.length;

            mapping.opIDafterIdx[idxBefore] = entry.opID;
            mapping.opIDbeforeIdx[idxAfter] = entry.opID;
            mapping.idxAfterOpID[stringifyOpID(entry.opID)] = idxAfter;
            mapping.idxBeforeOpID[stringifyOpID(entry.opID)] = idxBefore;

            idxBefore = idxAfter;
        }

        this._cachedMapping.set(entries, mapping);
        return mapping;
    }

    toString() {
        return this.entries()
            .map((entry) => entry.value)
            .join("");
    }

    insertAfter(
        idx: number,
        text: string,
        privacy: "private" | "trusting" = "private"
    ) {
        const ops: InsertionOpPayload<string>[] = [];
        let prevOpId: OpID | "start" | undefined = this.mapping.opIDbeforeIdx[idx];
        if (!prevOpId) {
            if (idx === 0) {
                prevOpId = "start"
            } else {
                throw new Error("Invalid idx");
            }
        }
        const nextTxId = this.core.nextTransactionID();
        let changeIdx = 0;
        for (const grapheme of segmenter.segment(text)) {
            ops.push({
                op: "app",
                value: grapheme.segment,
                after: prevOpId,
            });
            prevOpId = {
                sessionID: nextTxId.sessionID,
                txIndex: nextTxId.txIndex,
                changeIdx,
            };
            changeIdx++;
        }
        this.core.makeTransaction(ops, privacy);

        this.rebuildFromCore();
    }

    deleteRange({from, to}: {from: number, to: number}, privacy: "private" | "trusting" = "private") {
        const ops: DeletionOpPayload[] = [];
        for (let idx = from; idx < to;) {
            const insertion = this.mapping.opIDafterIdx[idx];
            if (!insertion) {
                throw new Error("Invalid idx to delete " + (idx));
            }
            ops.push({
                op: "del",
                insertion,
            });
            console.log("deleting idx", idx)
            let nextIdx = idx + 1;
            while (!this.mapping.opIDbeforeIdx[nextIdx] && nextIdx < to) {
                nextIdx++;
            }
            idx = nextIdx;
        }
        this.core.makeTransaction(ops, privacy);

        this.rebuildFromCore();
    }
}
