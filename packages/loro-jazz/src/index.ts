import { cojsonInternals } from "cojson";
import { Account, CoFeed, Group, co } from "jazz-tools";
import { LoroDoc } from "loro-crdt";

type LoroUpdate = string & { __loroUpdate: true };

function encodeUpdate(update: Uint8Array) {
  return cojsonInternals.bytesToBase64url(update) as LoroUpdate;
}

function decodeUpdate(update: LoroUpdate) {
  return cojsonInternals.base64URLtoBytes(update) as Uint8Array;
}

export class LoroJazzDoc extends CoFeed.Of(co.json<LoroUpdate>()) {
  _currentDoc?: LoroDoc;

  static createFromLoroDoc(doc: LoroDoc, options: { owner: Account | Group }) {
    const feed = super.create(
      [encodeUpdate(doc.export({ mode: "snapshot" }))],
      options,
    );
    return feed;
  }

  get currentDoc() {
    if (!this._currentDoc) {
      // TODO: find a way to map peer IDs to session IDs
      this._currentDoc = new LoroDoc();
      for (const updates of Object.values(this.perSession)) {
        for (const update of updates.all) {
          this._currentDoc.import(decodeUpdate(update.value));
        }
      }
      this._currentDoc.subscribeLocalUpdates((update) => {
        this.push(encodeUpdate(update));
      });
      const seenFeedItems: { [session: string]: number } = {};
      this.subscribe([], (feed) => {
        for (const [session, updates] of Object.entries(feed.perSession)) {
          const newUpdates = [...updates.all].slice(
            seenFeedItems[session] ?? 0,
          );
          seenFeedItems[session] =
            (seenFeedItems[session] ?? 0) + newUpdates.length;
          for (const update of newUpdates) {
            this.currentDoc.import(decodeUpdate(update.value));
          }
        }
      });
    }
    return this._currentDoc;
  }
}
