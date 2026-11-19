---
'runpod-sdk': major
'@runpod/typescript-api-sdk': major
---

2.0.0: `runpod-sdk` and `@runpod/typescript-api-sdk` now release together from `runpod/js-sdk`, always at the same version.

`@runpod/typescript-api-sdk` is the typed REST v2 client generated from the OpenAPI spec. Its API is unchanged from 0.8.0. The package now also ships `spec/openapi.yaml`. The jump from 0.8.0 to 2.0.0 aligns its version with `runpod-sdk`.

`runpod-sdk` re-exports everything from `@runpod/typescript-api-sdk` and keeps the Serverless job client. Breaking changes from 1.x:

- Node.js 20 or later is required. The package ships ESM and CommonJS builds.
- Requests use the built-in `fetch`. The `ramda` and `xior` dependencies are gone.
- An HTTP error now throws `RunpodServerlessError`, with `status`, `statusText` and `body`, in place of the `xior` error.
- The exported `run`, `runSync`, `status`, `stream`, `health` and `purgeQueue` functions are no longer curried. Call them with all arguments. `statusSync` and `cancel` are now exported too.
- `runSync` no longer logs each poll to the console.

New in `runpod-sdk`: `runpod.api` is a typed REST v2 client for pods, endpoints, templates, network volumes, and more. The `endpoint(id)` methods keep their 1.x names and arguments.
