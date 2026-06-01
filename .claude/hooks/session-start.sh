#!/bin/bash
set -euo pipefail

# SessionStart hook for Claude Code on the web.
# Installs everything needed so builds, the linter, and the Playwright
# smoke test (verify.mjs) work out of the box in a fresh remote container.

# Only run in remote (web) sessions; local machines already have their setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# JS dependencies. `npm install` (not `ci`) so the cached container state is
# reused and partial installs self-heal; it's idempotent.
npm install

# Browser for the headless smoke test (node verify.mjs). Idempotent.
npx playwright install chromium
