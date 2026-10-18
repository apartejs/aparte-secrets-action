# aparte-secrets GitHub Action

[![test](https://github.com/apartejs/aparte-secrets-action/actions/workflows/test.yml/badge.svg)](https://github.com/apartejs/aparte-secrets-action/actions/workflows/test.yml)

Finds passwords, API keys, tokens and private keys in your repository with the [aparte-secrets](https://huggingface.co/apartejs/aparte-secrets) model — 196 KB, run on the runner itself: no network call, no key, no account.

Pattern scanners find the formats they know. This model reads the context, so it also finds what has no fixed format: passwords, keys of providers no rule knows, a secret written in a sentence. Use it next to gitleaks or secretlint, not instead.

```yaml
name: secrets
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write   # to send the findings to code scanning
    steps:
      - uses: actions/checkout@v5
      - uses: apartejs/aparte-secrets-action@v1
```

Each finding becomes an annotation on its line (shown on the pull request's diff) and a row of the job summary; the job fails. **Values are never printed**, in the logs or anywhere else. On public repositories (or with GitHub Advanced Security), the findings also go to the Security tab as code-scanning alerts.

## Inputs

| input | default | |
|---|---|---|
| `paths` | every file git tracks | files or folders to scan, separated by spaces |
| `min-score` | `0.5` | report only spans the model scores at least this |
| `config` | `.aparte-secrets.json` if present | ignored values and excluded paths |
| `baseline` | | accepted findings (SHA-256 fingerprints, never the values): only new ones are reported |
| `sarif` | `true` | send the findings to code scanning |
| `fail` | `true` | fail the job when something is found |
| `version` | `1.1.1` | version of [`@aparte/secrets-cli`](https://www.npmjs.com/package/@aparte/secrets-cli) to run |

Outputs: `findings` (the number found) and `sarif-file` (the report).

## Ignoring

- a line: a comment containing `aparte-secrets:ignore` (`gitleaks:allow` and `pragma: allowlist secret` work too);
- values and paths, in `.aparte-secrets.json`:

```json
{
  "ignore": ["my-test-password", "/^sk_test_/"],
  "exclude": ["tests/fixtures/**"],
  "minScore": 0.5
}
```

- everything already there: `npx @aparte/secrets-cli --update-baseline`, commit `.aparte-secrets-baseline.json` and pass it as `baseline`.

Binary files, files over 1 MB, `node_modules`, `dist`, `build`, `vendor`, lockfiles, `*.min.js` and `*.map` are skipped.

## What to expect

The model is noisier on ordinary code than a pattern scanner (0.17 false alerts per 1,000 lines on two clean public repositories, against 0.06 for detect-secrets and 0.02 for gitleaks): on a large existing codebase, start with a baseline or a higher `min-score`. It runs on every core of the runner but is slower than patterns — about 85 µs per character of code per core. Every number: [the model card](https://huggingface.co/apartejs/aparte-secrets).

The same scan runs locally with `npx @aparte/secrets-cli`, before each commit with the [pre-commit hook](https://github.com/apartejs/aparte-secrets-model#readme), and inside secretlint with [`@aparte/secretlint-rule-secrets`](https://www.npmjs.com/package/@aparte/secretlint-rule-secrets).

## Versions

All aparte-secrets packages share one version, `<model version>.<package fix>`. `@v1` follows the latest 1.x release; pin `@v1.1.1` for a fixed one.

## License

MIT, Copyright (c) 2026 Paul Richez.
