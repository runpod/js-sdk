# Changelog

All notable changes to `runpod-sdk` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The SDK no longer reads `package.json` at runtime. `createRequire(import.meta.url)`
  pulled in Node's `module` builtin and required a `file://` URL, which broke imports
  in Cloudflare Workers, Deno and browsers. The version is now a build-time constant.
  ([#20](https://github.com/runpod/js-sdk/issues/20), [#23](https://github.com/runpod/js-sdk/pull/23))

## [1.2.0-beta.2] - 2025-08-14

## [1.2.0-beta.1] - 2025-08-14

Published to npm from outside `main`; no corresponding commits on this branch.
Contents unknown — a maintainer should fill these in or deprecate the tags.

## [1.1.2] - 2025-07-09

### Fixed

- JSON import assertion error on Node.js 17.5+, by reading `package.json` through
  `createRequire` instead of an ESM JSON import.
  ([#14](https://github.com/runpod/js-sdk/pull/14))

  > **Note:** this fix introduced [#20](https://github.com/runpod/js-sdk/issues/20) —
  > it made the SDK unimportable in Cloudflare Workers, Deno and browsers. Users on
  > those runtimes should stay on 1.0.7 until the Unreleased fix above ships.

## [1.1.1] - 2025-06-13

### Fixed

- Corrected the `main` and `types` entry points in `package.json`, which pointed at
  paths that did not exist in the published package.
  ([#10](https://github.com/runpod/js-sdk/pull/10))

## [1.1.0] - 2025-06-10

### Changed

- Replaced `axios` with [`xior`](https://github.com/suhaotian/xior), moving HTTP
  transport onto `fetch`. ([#4](https://github.com/runpod/js-sdk/pull/4))

### Added

- `lowPriority` on `ExecutionPolicy`. ([#8](https://github.com/runpod/js-sdk/pull/8))

### Removed

- Unused dependencies. ([#7](https://github.com/runpod/js-sdk/pull/7))

## [1.0.7] - 2024-02-29

### Fixed

- Corrected the return type of `endpoint.run`.

## [1.0.6] - 2024-02-29

### Added

- A `User-Agent` header identifying the SDK and its version.
  ([#1](https://github.com/runpod/js-sdk/pull/1))

## [1.0.5] - 2023-12-01

### Added

- `objectPath` on `s3Config`.

## [1.0.4] - 2023-11-17

### Added

- Streaming via an async generator, exported as `stream`.
- Per-request timeouts on `runsync` and `statussync`.
- Additional endpoint parameters, for parity with the other Runpod SDKs.

## [1.0.3] - 2023-11-01

### Added

- Configurable `baseUrl` via `SdkOptions`, used when building endpoint URLs.

## [1.0.2] - 2023-10-31

### Fixed

- Exported types that were declared but not exported.
- An explicit error when the API key or endpoint ID is missing.

## [1.0.1] - 2023-10-31

## [1.0.0] - 2023-10-31

Initial release, migrated from the previous `node-sdk`.

### Added

- `runsync` / `statussync` polling.
- `executionTimeout` passed through unclamped.

---

### A note on provenance

This file was reconstructed after the fact. The repository has **no git tags and no
GitHub releases**, so entries were derived by cross-referencing npm publish dates
against commit dates on `main`:

- npm publish times come from the registry metadata for `runpod-sdk`
- change descriptions come from the commits and merged PRs in the matching window

Version boundaries before 1.1.0 are therefore inferred rather than authoritative, and
1.0.0–1.0.2 were all published on the same day. A maintainer should correct anything
misattributed. **Tagging future releases would make this unnecessary.**
