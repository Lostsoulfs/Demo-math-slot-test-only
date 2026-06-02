---
description: Build, serve, and run the Playwright smoke test (verify.mjs).
allowed-tools: Bash(npm run build:*), Bash(npm run preview:*), Bash(node verify.mjs:*), Bash(npx playwright:*)
---

Verify the app end-to-end:

1. `npm run build`
2. Start the preview server on :4173 in the background and wait until it responds.
3. `node verify.mjs` (installs Chromium first if needed:
   `npx playwright install chromium`).

Report: build result, smoke-test result, and any console errors. Look at the
generated screenshots if something fails.
