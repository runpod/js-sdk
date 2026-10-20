README-dev.md

Before publishing, bump **both**:

- `version` in `package.json`
- `SDK_VERSION` in `src/index.ts` — it is reported in the `User-Agent` header

```bash
yarn build # if you forget this typescript type defs will not be refreshed
npm login
npm publish
```
