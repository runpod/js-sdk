import { describe, it, expect } from "vitest"
import runpodSdk from "../dist/src/index.js"

describe("JSON import fix (Node.js 17.5+ compatibility)", () => {
  it("should import SDK without ERR_IMPORT_ATTRIBUTE_MISSING error", () => {
    // This test validates our fix for the Discord issue:
    // TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]: Module needs an import attribute of "type: json"
    //
    // Before fix: import pkg from "../package.json" -> FAILS in Node.js 17.5+
    // After fix: createRequire pattern -> WORKS in all Node.js versions
    //
    // If this test passes, the createRequire fix is working.
    // If it fails, it means the JSON import is broken again.

    expect(() => {
      const sdk = runpodSdk("test-api-key")
      expect(sdk).toBeDefined()
    }).not.toThrow()
  })

  it("should successfully load package.json version for User-Agent", () => {
    // The SDK loads package.json to get version
    // This was the specific line that caused the JSON import error
    const sdk = runpodSdk("test-api-key")
    const endpoint = sdk.endpoint("test-endpoint")

    // If package.json loading failed, endpoint creation would fail
    expect(endpoint).toBeDefined()
    expect(endpoint?.endpointId).toBe("test-endpoint")
  })
})
