# Contributing

Thank you for helping improve Intent Galaxy.

## License of contributions

Intent Galaxy is licensed under AGPL-3.0-only and is also offered under a
commercial license (see [COMMERCIAL.md](COMMERCIAL.md)). To keep both possible,
every contributor must agree to the [Contributor License Agreement](CLA.md)
before a pull request is merged. You keep the copyright to your work.

Do not submit code copied from projects whose license is incompatible with
AGPL-3.0, and name any third-party material and its license in the pull
request.

## Before you start

- Open an issue first for a change to `INTENT-SPEC-FINAL.md`, the Canonical
  Schema, or anything that adds a runtime dependency.
- Keep one pull request focused on one outcome.
- Never commit API keys, credentials or private conversation content.

## Checks

```bash
npm test
git diff --check
```

## Pull request checklist

- [ ] I agree to [CLA.md](CLA.md) for this and my future contributions.
- [ ] `npm test` passes.
- [ ] No new runtime dependency in `apps/cli` or `libs/*`.
- [ ] Third-party material, if any, is named with its license.
