---
description: Format, lint, test, build, then commit & push the current branch. Usage: /ship <commit message>
argument-hint: <commit message>
allowed-tools: Bash(npm run format:*), Bash(npm run lint:*), Bash(npm test:*), Bash(npm run build:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git status:*)
---

Ship the current work. Run the full gate and only commit if it all passes:

1. `npm run format`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. If all green: `git add -A`, commit with this message — `$ARGUMENTS` — and
   `git push -u origin <current-branch>`.

If anything fails, stop and report what failed instead of committing. Never skip
a step to make it pass.
