import { CoValueCore } from "./coValueCore.js";
import { CoValueState } from "./coValueState.js";
import { RawCoID } from "./ids.js";

export class CoValuesStore {
  coValues = new Map<RawCoID, CoValueState>();

  get(id: RawCoID) {
    let entry = this.coValues.get(id);

    if (!entry) {
      entry = CoValueState.Unknown(id);
      this.coValues.set(id, entry);
    }

    return entry;
  }

  setAsAvailable(id: RawCoID, coValue: CoValueCore) {
    const entry = this.get(id);
    entry.dispatch({
      type: "available",
      coValue,
    });
  }

  getEntries() {
    return this.coValues.entries();
  }

  getValues() {
    return this.coValues.values();
  }

  getKeys() {
    return this.coValues.keys();
  }
}
