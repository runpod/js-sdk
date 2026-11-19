# Development

This package lives in the
[js-sdk repository](https://github.com/runpod/js-sdk) at
`packages/typescript-api-sdk/`, as a pnpm workspace package. Install from the
repository root with Node 20+ and pnpm 10; installing also builds this package
(its `prepare` script). Python 3.11 is needed
for the spec scripts, with its dependency pinned in `scripts/requirements.txt`.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r packages/typescript-api-sdk/scripts/requirements.txt
pnpm install --frozen-lockfile    # from the repository root
pnpm check                        # this package's checks, from the root
```

Or run them one at a time from `packages/typescript-api-sdk/`:

```bash
pnpm generate:check
pnpm test:spec
pnpm test:scripts
pnpm typecheck
pnpm test
pnpm test:package               # builds, packs, installs in a temporary consumer
pnpm test:examples              # uses built dist and mocked responses
```

`test:package` accesses npm to install the tarball's dependencies and the locked
TypeScript compiler. Other tests above use no live Runpod API and require no key.
Task is an optional command runner; `Taskfile.yml` provides shortcuts and loads
`.env`. Merely having an API key set does not enable live tests. Explicitly opt in
with `RUNPOD_LIVE_TESTS=1` and `RUNPOD_API_KEY` to run the read-only catalog smoke.
Do not put these credentials into ordinary CI.

## Updating the API contract

From the repository root:

```bash
pnpm spec:check                 # compare against the public production spec, no credentials
pnpm spec:pull                  # validate before atomically replacing vendored YAML
pnpm generate                   # regenerate src/generated/schema.ts
```

`pnpm spec:check` compares whole normalized documents, including referenced
schemas and descriptions.

The source is `https://api.runpod.io/v2/openapi.json`; set `SPEC_URL` to pull
from another host. The checks never rewrite files, and network failures fail the
check rather than claiming the contract is current.

The **Production spec update** workflow runs daily at about 09:23 UTC and can be
dispatched manually. It pulls the production spec, regenerates this package's
types, runs the package checks, and opens or updates one PR on
`automation/production-spec`. No changes means no new PR.

`scripts/fix_spec.py` is the reviewed patch layer: auth response declarations,
placeholder examples, enum names, and public descriptions. Patches fail when
their upstream anchors change. Regenerate instead of editing vendored YAML or
`src/generated/schema.ts` by hand. The generator preserves YAML boolean-like
strings and preserves required properties through nested `allOf`/`$ref` inheritance; properties with defaults
remain optional unless the spec requires them. Generation also rejects query
encodings that need a different runtime serializer.

CI (`.github/workflows/ci.yml`) verifies generated freshness, Python
and TypeScript tests, and installed ESM/CJS consumers on Node 20, 22, and 24.

## The MCP tools

This package generates **types**. `spec/openapi.yaml` becomes
`src/generated/schema.ts`, a file of TypeScript declarations with no runtime
code. Everything around it (retries, deadlines, rate-limit metadata, the SSE
iterator) is written by hand.

[runpod-mcp](https://github.com/runpod/runpod-mcp) generates its **tool
definitions** from the `spec/openapi.yaml` that this package ships on npm, and
calls the API through this package. An API change reaches the MCP when it
moves to a release that contains the change.

## Release preparation

Use [Changesets](releases.md) to record release notes and compatibility changes.
