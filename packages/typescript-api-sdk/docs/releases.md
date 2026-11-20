# Versioning and releases

Changesets records the release impact of a change independently of commit
messages. Manual squash merges are supported.

## Contributor workflow

1. Run `pnpm changeset` for changes to the published SDK.
2. Select the package, choose a bump, and describe the user-visible change.
3. Commit the generated `.changeset/*.md` file with your implementation.
4. Review the compatibility impact and changeset before merging the PR.

Use `pnpm changeset status` to inspect pending releases. For an intentional
change without a release, `pnpm changeset --empty` records that decision.
Repository-only documentation, CI, and tests normally need no package release.
The release workflow opens or updates a version PR from pending changesets;
ordinary SDK CI does not require a changeset on every PR.

## Choosing a version bump

The SDK version describes client compatibility, independently of REST API v2.
API v2 does not mean this package must start at version 2.

| Bump | Use for |
| --- | --- |
| Patch | Compatible bug fixes and corrections to shipped documentation |
| Minor | Compatible new endpoints, options, or capabilities |
| Major | Removed or renamed exports/endpoints, incompatible type changes, new required inputs, or dropping a supported Node version |

Review generated TypeScript changes as part of the public interface. A schema
correction can break existing consumers even when the server behavior has not
changed. Enum and union changes also need compatibility review; do not assign a
patch simply because the change came from generation.

Document breaking changes and migration steps in the changeset. Prerelease publishing requires a separate
reviewed change to select a version suffix and a non-`latest` npm tag.

## Release flow

This package releases from the
[js-sdk repository](https://github.com/runpod/js-sdk) through its **Release**
workflow (`.github/workflows/release.yml`). On every push to `main`,
Changesets opens or updates one "Version Packages" PR. Merging that PR runs
`changeset publish`, which publishes each package whose version is not yet on
npm and tags it `<package>@<version>` (for example
`@runpod/typescript-api-sdk@0.10.0`). Releases up to 0.9.0 were published from
[runpod-mcp](https://github.com/runpod/runpod-mcp). Tags from before that move
are plain `v<version>`, in the archived `runpod/typescript-api-sdk` repository.

Publishing authenticates with npm trusted publishing (OIDC) through
`pnpm publish`. The package needs `runpod/js-sdk`, workflow `release.yml`, as
its trusted publisher on npmjs.com; see
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Generated spec updates

The **Production spec update** workflow pulls the production spec daily,
regenerates `src/generated/schema.ts`, and opens one PR on
`automation/production-spec`. When the spec changed, that PR carries a
changeset with a minor bump. Edit it before merging if the change needs a
different bump (see the table above).
