import { mergeConfig, type UserConfigExport } from "vitest/config"
import shared from "../../vitest.shared.js"

const config: UserConfigExport = {
  test: {
    browser: {
      provider: "playwright",
      name: "chromium",
      enabled: true,
      headless: true,
    }
  }
}

export default mergeConfig(shared, config)
