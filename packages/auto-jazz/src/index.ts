import * as A from "@automerge/automerge/next";
import { cojsonInternals } from "cojson";
import { Account, CoFeed, Group, co } from "jazz-tools";

type AutomergeUpdate = string & { __automergeUpdate: true };

function encodeUpdate(update: Uint8Array) {
  return cojsonInternals.bytesToBase64url(update) as AutomergeUpdate;
}

function decodeUpdate(update: AutomergeUpdate) {
  return cojsonInternals.base64URLtoBytes(update) as Uint8Array;
}

export class AutomergeJazzDoc<T> extends CoFeed.Of(co.json<AutomergeUpdate>()) {
  _currentDoc?: A.Doc<T>;

  static createFromAutomergeDoc<T>(
    doc: A.Doc<T>,
    options: { owner: Account | Group },
  ) {
    const feed = super.create([encodeUpdate(A.save(doc))], options);
    return feed;
  }

  get currentDoc() {
    if (!this._currentDoc) {
      // TODO: find a way to map Actor IDs to session IDs
      this._currentDoc = A.init(); //A.init(this._raw.core.node.currentSessionID);
      for (const updates of Object.values(this.perSession)) {
        for (const update of updates.all) {
          this._currentDoc = A.loadIncremental(
            this._currentDoc,
            decodeUpdate(update.value),
          );
        }
      }
    }
    return this._currentDoc;
  }

  change(changeFn: A.ChangeFn<T>) {
    const newDoc = A.change(this.currentDoc, changeFn);
    this._currentDoc = newDoc;
    const change = A.getLastLocalChange(newDoc);
    if (change) {
      this.push(encodeUpdate(change));
    }
  }
}
