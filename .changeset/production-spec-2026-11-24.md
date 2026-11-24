---
'@runpod/typescript-api-sdk': minor
---

Sync the v2 spec with production (2026-11-24). New catalog operations: `listCatalogSkills`, `getCatalogSkill`, `getCatalogSkillReadme`, `getCatalogSkillVariant`, `listCatalogRepos`, `getCatalogRepo`, `getCatalogRepoReadme` and `getCatalogTemplate`. `listPublicTemplates` now takes search, filter, order and pagination parameters, and returns a `pagination` block next to `templates`. `listGpuTypes` and `getGpuType` take `minVcpuCountPerGpu` and `minRamPerGpu`. The shared README response component is renamed from `TemplateReadme` to `Readme`. No operation, schema or field is removed.
