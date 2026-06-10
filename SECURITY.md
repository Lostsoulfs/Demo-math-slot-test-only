# Security Policy

This is a **play-money entertainment demo** — no accounts, no payments, no real
wagering, no personal data, and no backend. The attack surface is a static
client-side bundle.

## Reporting a Vulnerability

If you find a security issue (e.g. a dependency vulnerability or an XSS vector
in the build), report it privately:

- Go to this repo's **Security tab → "Report a vulnerability"** (GitHub private
  vulnerability reporting — it opens a private advisory visible only to the
  maintainer and you).
- **Do not open a public issue** for an exploitable vulnerability — public
  issues are immediately visible to everyone.
- Expect an initial response within **7 days**. Coordinated disclosure is
  appreciated: please give the maintainer a chance to fix before publishing.

## Dependencies

- `npm audit` runs are reviewed; Dependabot opens monthly grouped update PRs
  (see `.github/dependabot.yml`).
- No secrets are required to run or build the project. CI uses only the built-in
  `GITHUB_TOKEN`.

## Secrets & personal-tier gate (cross-repo standard)

This demo stores no personal data, but the cross-repo guardrails still apply so nothing
sensitive lands here by accident:

- **Secret/PII pre-commit gate** — `tools/scan_staged.py` + `.githooks/pre-commit`
  hard-block staged secrets and personal-tier paths (`PERSONAL_JOURNAL*`, `private/`)
  and warn on PII. Activate per clone: `git config core.hooksPath .githooks`.
- **CI backstop** — `.github/workflows/scan.yml` runs the same scan on every PR
  (fork-gated, `GITHUB_TOKEN` only), alongside the drift audit.
- **Editing guard** — `.claude/hooks/guard.sh` also denies agent edits to those paths.

If a secret ever reaches git: rotate/revoke it first, then purge history and force-push.
