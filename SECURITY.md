# Security Policy

This is a **play-money entertainment demo** — no accounts, no payments, no real
wagering, no personal data, and no backend. The attack surface is a static
client-side bundle.

## Reporting

If you find a security issue (e.g. a dependency vulnerability or an XSS vector in
the build), please open a private report via GitHub Security Advisories on this
repo, or email the maintainer. Please don't file public issues for exploitable
vulnerabilities until they're fixed.

## Dependencies

- `npm audit` runs are reviewed; Dependabot opens weekly update PRs.
- No secrets are required to run or build the project. CI uses only the built-in
  `GITHUB_TOKEN`.
