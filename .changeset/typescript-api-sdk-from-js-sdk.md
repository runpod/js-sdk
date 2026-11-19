---
'@runpod/typescript-api-sdk': minor
---

`@runpod/typescript-api-sdk` now releases from `runpod/js-sdk`. Releases up to 0.8.0 were published from `runpod/runpod-mcp`. The package now also ships `spec/openapi.yaml`, so consumers such as the MCP server can generate from the same spec.

Resync the vendored v2 OpenAPI spec with production as of 2026-11-18 and regenerate the schema. New in the spec: template READMEs (`/v2/templates/{id}/readme`, `/v2/catalog/templates/{id}/readme`), tags and their resources (`/v2/tags`), cost centers (`/v2/cost-centers`), the account balance (`/v2/billing/balance`), the account limits (`/v2/account/limits`), and replacing a container registry credential's username and password. Creating a Pod, creating an endpoint and updating an endpoint take the updated request schemas from production.

Breaking type change: `components['schemas']['TagFilterKey']` is renamed to `TagKey`, following the production spec. Replace each `components['schemas']['TagFilterKey']` reference with `components['schemas']['TagKey']`. The shape is the same.
