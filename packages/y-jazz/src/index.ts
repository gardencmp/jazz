import { cojsonInternals } from "cojson";
import { Account, CoFeed, Group, co } from "jazz-tools";
import { Doc as YDoc, applyUpdateV2, encodeStateAsUpdateV2 } from "yjs";

type YjsUpdate = string & { __yjsUpdate: true };

function encodeUpdate(update: Uint8Array) {
  return cojsonInternals.bytesToBase64url(update) as YjsUpdate;
}

function decodeUpdate(update: YjsUpdate) {
  return cojsonInternals.base64URLtoBytes(update) as Uint8Array;
}

export class YjsJazzDoc extends CoFeed.Of(co.json<YjsUpdate>()) {
  _currentDoc?: YDoc;

  static createFromYjsDoc(doc: YDoc, options: { owner: Account | Group }) {
    const feed = super.create(
      [encodeUpdate(encodeStateAsUpdateV2(doc))],
      options,
    );
    return feed;
  }

  get currentDoc() {
    if (!this._currentDoc) {
      this._currentDoc = new YDoc();
      this._currentDoc.on("updateV2", (update, origin) => {
        if (origin !== "jazzUpdate") {
          this.push(encodeUpdate(update));
        }
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
            applyUpdateV2(
              this.currentDoc,
              decodeUpdate(update.value),
              "jazzUpdate",
            );
          }
        }
      });
    }
    return this._currentDoc;
  }
}
