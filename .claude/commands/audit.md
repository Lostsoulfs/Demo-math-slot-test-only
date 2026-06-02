---
description: Run the PR drift audit on the current branch (report only).
allowed-tools: Bash(node scripts/audit-drift.mjs:*), Bash(git fetch:*)
---

Fetch `origin/main`, then run the drift auditor against the current branch and
summarize the findings:

```
git fetch origin main --quiet
node scripts/audit-drift.mjs --base origin/main --head HEAD --run-checks
```

Report the findings concisely (severity + what needs attention). Do not auto-fix
unless I ask.
