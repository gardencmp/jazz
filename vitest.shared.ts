import * as path from "node:path"
import type { UserConfig } from "vitest/config"

const config: UserConfig = {
  test: {
    browser: {
      headless: true,
    },
    // sequence: {
    //   concurrent: true
    // },
    alias: {
      "cojson": path.join(__dirname, "packages/cojson/src"),
      "cojson-simple-sync": path.join(__dirname, "packages/cojson-simple-sync/src"),
      "cojson-storage-indexeddb": path.join(__dirname, "packages/cojson-storage-indexeddb/src"),
      "cojson-storage-sqlite": path.join(__dirname, "packages/cojson-storage-sqlite/src"),
      "cojson-transport-nodejs-ws": path.join(__dirname, "packages/cojson-transport-nodejs-ws/src"),
      "hash-slash": path.join(__dirname, "packages/hash-slash/src"),
      "jazz-autosub": path.join(__dirname, "packages/jazz-autosub/src"),
      "jazz-browser": path.join(__dirname, "packages/jazz-browser/src"),
      "jazz-browser-auth-local": path.join(__dirname, "packages/jazz-browser-auth-local/src"),
      "jazz-browser-auth-passphrase": path.join(__dirname, "packages/jazz-browser-auth-passphrase/src"),
      "jazz-browser-auth0": path.join(__dirname, "packages/jazz-browser-auth0/src"),
      "jazz-browser-media-images": path.join(__dirname, "packages/jazz-browser-media-images/src"),
      "jazz-nodejs": path.join(__dirname, "packages/jazz-nodejs/src"),
      "jazz-react": path.join(__dirname, "packages/jazz-react/src"),
      "jazz-react-auth-local": path.join(__dirname, "packages/jazz-react-auth-local/src"),
      "jazz-react-auth-passphrase": path.join(__dirname, "packages/jazz-react-auth-passphrase/src"),
    }
  }
}

export default config
