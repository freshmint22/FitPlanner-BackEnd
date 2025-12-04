Title: chore: migrate JWT handling to `jose` and remove `jsonwebtoken`

Summary
-------
This PR migrates runtime JWT verification to the `jose` library and removes `jsonwebtoken` from production dependencies. Tests were updated to sign tokens using a light HMAC helper so they do not rely on ESM imports. The change addresses a security advisory affecting `jsonwebtoken` and modernizes JWT handling.

What changed
------------
- Added `jose` as a runtime dependency and use dynamic import in `src/middleware/auth.ts` to verify JWTs with `jwtVerify` (HS256).
- Implemented a robust fallback manual HS256 verification path to cover environments where dynamic ESM import might fail.
- Replaced test token creation in `src/__tests__/users.list.integration.test.ts` with a Node `crypto` HMAC helper that produces valid HS256 tokens.
- Removed `jsonwebtoken` and its type packages from `package.json` and updated `package-lock.json`.
- Adjusted CI workflow (`.github/workflows/ci.yml`) to fix caching and npm command paths (monorepo-aware).

Why
---
- `jsonwebtoken` (<=8.5.1) has a high-severity advisory and upgrading to v9 is a breaking change; migrating to `jose` is a secure and modern alternative.
- Using `jose` avoids known insecure defaults and aligns with JOSE standards (JWS/JWT).

Testing performed
-----------------
- Ran full test suite locally: `npm test` — all tests pass (5 suites, 8 tests).
- Verified lint: `npm run lint` (no new lint errors introduced by this PR).

Migration notes for reviewers
---------------------------
- `src/middleware/auth.ts` now performs dynamic import of `jose` at runtime. This keeps the code ESM-compatible while avoiding Jest transform-time ESM issues.
- Tests use a manual HS256 token signing helper; this keeps tests fast and independent of ESM transforms.
- If your environment uses RSA keys or JWKS, update the `auth.ts` verification to import appropriate key material (use `importSPKI` / `importPKCS8` from `jose`).

Remaining work / Known issues
---------------------------
- `npm audit` may still show transitive warnings (e.g. `micromatch` via `lint-staged`); run `npm audit fix` if desired.
- If you prefer using `SignJWT` from `jose` inside tests instead of the manual helper, we can update Jest config to transform ESM packages (more invasive).

How to test locally
-------------------
1. From repo root:
   ```powershell
   cd Backend
   npm install
   npm test
   ```

2. Run the server and exercise endpoints (uses in-memory DB for tests):
   ```powershell
   npm run dev
   # or seed and run: npm run seed; npm run dev
   ```

Rollback plan
-------------
- Revert this branch/PR. To preserve security, either re-introduce `jsonwebtoken` at a patched version (if available) or implement an alternative JWT verification.

Checklist for PR
----------------
- [x] Tests pass locally
- [x] Lint passes
- [x] `jsonwebtoken` removed from `dependencies`
- [ ] CI green
- [ ] Reviewer: confirm no production token signing flow depends on `jsonwebtoken`

Open PR URL (suggested)
-----------------------
Create a PR from `chore/upgrade-jwt` into `develop` or `main` and paste this body. GitHub also suggests:

https://github.com/freshmint22/FitPlanner-BackEnd/pull/new/chore/upgrade-jwt

Notes
-----
If you want, I can also open the PR automatically (requires a GitHub token or CLI). Otherwise paste this file's contents into the new PR description.
