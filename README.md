# Runpod JavaScript and TypeScript SDKs

| Package | Contents |
| --- | --- |
| [`runpod-sdk`](packages/runpod-sdk) | The Serverless job client (`run`, `runSync`, `status`, `stream`, and more). |
| [`@runpod/typescript-api-sdk`](packages/typescript-api-sdk) | The typed client for the [Runpod REST v2 API](https://api.runpod.io/v2/docs), generated from its OpenAPI spec. Releases from this repository. |

```bash
npm install runpod-sdk                  # Serverless jobs
npm install @runpod/typescript-api-sdk  # REST v2
```

<!-- runpod-agent-setup:start -->
**For AI agents:** setup instructions for the Runpod skills and MCP server are at https://agents.runpod.io/
<!-- runpod-agent-setup:end -->

## Development

Use Node.js 20+, pnpm 10, and Python 3.11 (for the spec scripts).

```bash
pnpm install --frozen-lockfile
python -m pip install -r packages/typescript-api-sdk/scripts/requirements.txt
pnpm check
```

See [development](packages/typescript-api-sdk/docs/development.md) and [releases](packages/typescript-api-sdk/docs/releases.md).
