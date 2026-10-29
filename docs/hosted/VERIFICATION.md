# Implementation verification — 2026-10-30

Acceptance scope: reviewable draft PRs, with no production deployment, live model calls, real checkout, account configuration or credentials added. The original website checkout and education worktree were preserved. The source of the isolated v2 snapshot is recorded in `v2-baseline.json`; the snapshot commit is `47b5866`.

## Automated evidence

- `REQUIRE_HOSTED_SQL_TESTS=1 npm run test:hosted`: **72 passed, zero failed, zero skipped**. Includes domain/provider contracts, all 12 accepted requirements, consent, history target binding, proposal freshness, logout response isolation, HTTP/PKCE/CSRF, independent entitlements, Paddle tax-inclusive totals, and real PostgreSQL 14 integration.
- The PostgreSQL regression first reproduced the stale-cleanup refund race against the old implementation. With consistent budget-then-row locking, fresh dispatched work remains running and can finish; genuinely stale dispatched work becomes unknown without a refund. Private cluster processes and sockets were removed by the harness.
- `npm test`: shared protocol/core/DecisionSession/epistemic, CLI/provider/kill-gate, 41 locales, five README locales, extension synchronization and npm package checks passed (113 package files).
- `npm run build:hosted`, `npm run build:ext`, `npm run pack:ext`: passed. Hosted includes 55 shared modules. Chrome and Firefox bundles retain the extracted v2 DecisionView and core.
- Pinned Wrangler 4.155.0 `deploy --dry-run`: passed for the Worker/Workflow, fixed service bindings, real shared TypeScript modules and static assets. This did not deploy or authenticate.
- `npm run eval:hosted`: catalog validates **120 proposed cases**; labels still need independent human review. Real-model evaluation is **NOT_RUN**, release gate **HOLD**. No inference quality claim follows from mock tests.

The website integration separately passed lint, 96 content tests, zero-error/zero-warning content check, and beginner/advanced editorial checks. Its production build contains 52 variants each for Home, About, Open Source and all three new product routes. The new `products:verify` requires all **156 product pages** with correct canonical, hreflang, language, main content and sitemap. Public-output validation verified 1,092 content pages and kept all **200 draft articles** absent.

## Browser evidence

All hosted checks used a loopback synthetic demo, never an actual model or Google account.

- Guest trial → analyze → real v2 option cards → request summary → editable synthetic artifact.
- Manual artifact edits invalidate the displayed evaluation.
- Login preserves an explicitly requested, same-tab pre-login draft; restoration is explicit and does not automatically create a cloud document. A subsequent explicit save works. Template save and load work.
- Anthropic generation works with primary-provider consent checked and the separate OpenAI-check consent unchecked. The latter remains visibly optional in summary and artifact stages.
- Logout clears prior-account works, templates and artifact state. Deferred-response epoch tests cover responses arriving after logout.
- Mandala local edit, mirror labels, completion 1/64, save/reopen and real JSON download were checked. The exported synthetic chart contains eight themes and 64 actions.
- 390px hosted dark mode and 390px German/light website pages have no horizontal overflow. Desktop Traditional Chinese/dark website and hosted editor were inspected. Browser console errors were absent in the tested flows.

## Independent review

A separate read-only `astra_final_review` role returned **ACCEPT / CONTINUE** for the integration, excluding the existing v2 baseline. It independently ran 37 domain/API/payment tests, 25 frontend tests, five website product tests and the 156-page SEO verifier. Reported consent, history, stale proposal, execution gate, cleanup race, logout, continuation and requirement-count defects were corrected before acceptance. The runtime exposes the pinned reviewer role but no additional effective-model/effort fields; no route mismatch was observed.

## Remaining launch gates

Actual Supabase OAuth/RLS, deployed Cloudflare Workflow behavior, Paddle sandbox receipts and merchant approval still need staging verification. Human-reviewed labels and authorized real-model evaluations must establish the agreed quality thresholds before enabling `MODEL_QUALITY_APPROVED`. Retention, operator reconciliation and actual usage/cost measurements remain operational acceptance work. The deployment defaults keep AI and billing disabled, and website app links stay disabled until the approved origin is configured. See `DEPLOYMENT.md` for the concrete setup and checks.
