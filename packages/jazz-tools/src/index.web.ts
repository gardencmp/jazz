import { setupInspector } from "./utils/export-account-inspector.js";

export * from "./exports.js";

export { cojsonInternals, MAX_RECOMMENDED_TX_SIZE, WasmCrypto } from "cojson";

setupInspector();
