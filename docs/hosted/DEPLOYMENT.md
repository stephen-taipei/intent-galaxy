# Hosted backend deployment and operating gates

This is a reviewable implementation, not a deployed or approved commercial service. No production account, DNS, OAuth provider, Paddle merchant, remote database, paid AI call, or deployment was configured during implementation. Paddle support is **sandbox only**; setting `PADDLE_ENV=production` leaves billing disabled.

## Runtime and ownership

- `apps/hosted/server/index.mjs` exports `handleRequest(request, env, ctx)` and `createApplication(dependencies)` for the local runner and deterministic tests. The production default always constructs `PostgrestRepository`; connection failure never selects memory storage.
- `server/cloudflare.mjs` exports `HostedJobWorkflow` and the Worker entrypoint. Workflow params contain only a job ID. Results/content live in Postgres rather than Workflow step output. The provider step explicitly sets retry limit zero.
- `server/demo-repository.mjs` is synthetic, process-local, non-durable storage. The application selects it only with `APP_MODE=demo` **and** a loopback request hostname (`localhost`, `127.0.0.1`, `::1`). A public hostname is rejected. Demo Google login creates an explicitly synthetic account; demo AI never fetches a provider and labels its output. Demo billing is disabled.
- `apps/hosted/wrangler.jsonc` builds with `node ../../tools/build-hosted.mjs`, serves `dist`, runs the Worker before assets and routes SPA pages to the index. The API and assets receive CSP, `nosniff`, `no-referrer`, and a restrictive Permissions Policy. Live responses also use HSTS. Turnstile scripts, frames and connections are explicitly allowed by CSP.
- Runtime code adds no third-party dependency to the CLI or libraries. Cloudflare supplies `cloudflare:workers`. The hosted package pins stable Wrangler `4.155.0` as a development dependency, resolved from the npm registry’s `latest` tag on 2026-10-29. Its lockfile is separate from the dependency-free core package. Tooling installation/dry-run does not log in or deploy.

## Configuration

Keep secrets in the Worker secret store, outside Git and client assets. Do not put service credentials in a public `.env`, build variable, browser local storage, logs or screenshots.

| Variable/binding | Purpose |
| --- | --- |
| `APP_MODE` | `disabled` by default; `demo` only on loopback; `live` for a configured hosted environment |
| `APP_ORIGIN` | Exact HTTPS origin with no trailing slash; every live request must match it |
| `SUPABASE_URL` | Supabase HTTPS origin, without a path |
| `SUPABASE_ANON_KEY` | Auth API key, used by the BFF; not required in browser code |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret for service-only PostgREST RPCs; never expose it to clients |
| `SESSION_SECRET` | Independent random secret, minimum 32 characters, for AES-GCM session-token encryption, signed browser/guest cookies and checkout binding |
| `ABUSE_HASH_SECRET` | Independent random secret, minimum 32 characters, to HMAC edge IP addresses before storage |
| `LIVE_AI_ENABLED` | Must equal `true` before live AI can run |
| `MODEL_QUALITY_APPROVED` | Must equal `true` after the separate real-model/human quality acceptance below |
| `AI_DAILY_BUDGET_USD` | Strictly positive server budget; zero or invalid value disables AI |
| `AI_MONTHLY_BUDGET_USD` | Positive server monthly budget; if absent, daily budget × 31; explicit zero disables AI |
| `TRIAL_DAILY_BUDGET_USD` | Separate trial cost cap, default USD 0.50 and never greater than the global daily cap |
| `TRIAL_DAILY_LIMIT` | New trial sessions per UTC day, default 25, maximum 100 |
| `TRIAL_IP_DAILY_LIMIT` | New trials per hashed edge IP per UTC day, default/maximum 3 |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Challenge keys for the configured hostname; render with action `guest_trial` |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Independent direct-provider credentials; only configured providers can be requested |
| `DECISIONS_ENABLED` | Must equal `true` to enable the optional OpenAI Decisions checks; unavailable checks remain `unknown` |
| `JOB_WORKFLOW` | Cloudflare Workflow binding to `HostedJobWorkflow` |
| `ASSETS` | Built static-asset binding |
| `BILLING_ENABLED` | Explicit opt-in, default `false` |
| `PADDLE_ENV` | Must equal `sandbox` in this implementation |
| `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` | Sandbox API credential and this endpoint’s signature secret |
| `PADDLE_PRICE_STUDIO`, `PADDLE_PRICE_MANDALA` | Distinct server-owned recurring price IDs |
| `TELEMETRY_TEMPLATE_IDS` | Optional comma-separated server allowlist; defaults to `message,weekly,compare` |

The BFF does not accept client price IDs, owner IDs, credit balances, billing periods, service URLs, environment flags, entitlement grants or provider endpoints.

## Supabase preparation (requires separate authorization)

1. Select a new staging project and take a recoverable schema backup. Apply `apps/hosted/migrations/0001_hosted.sql` as the Supabase migration owner. The script expects Supabase `auth.users`, `auth.uid()`, `anon`, `authenticated`, and `service_role`.
2. Verify the resulting functions are service-role only. Check every hosted table has enabled/forced RLS and that two real staging users cannot read or write each other’s records. Authenticated clients may select their own documents/jobs/subscription summaries; they cannot call mutation or ownership-parameter RPCs. Version selection additionally requires the document product’s current Pro plan.
3. Configure Google OAuth through Supabase Auth. Allow the exact application origin and `/api/auth/callback` redirect, including its `flow` query parameter. The BFF uses Supabase PKCE (`s256`), a ten-minute encrypted verifier cookie and a same-browser random flow binding. It exchanges the one-use code server-side.
4. Verify login/callback/logout and concurrent refresh against the real staging project. The browser gets a random opaque seven-day session cookie, `Secure`, `HttpOnly`, `SameSite=Lax`, host-only and `Path=/`. Access/refresh tokens stay encrypted in a service-only table. Refresh has a database lease. An uncertain/failed refresh revokes the local session and requires sign-in again.
5. Verify all unsafe browser methods require both exact `Origin` and the current `/api/session` CSRF token in `X-CSRF-Token`. The Paddle webhook is exempt from browser CSRF because it verifies its own signature before parsing or applying an event.

Session-cookie expiration is fixed at seven days. Browser trial/CSRF binding cookies last thirty days. Rotating `SESSION_SECRET` invalidates cookies and encrypted sessions; it also invalidates signatures on previously issued, unpaid checkout bindings. Reconcile pending checkouts and plan forced sign-in before rotating. This implementation does not include multi-key rotation.

## Entitlements and documents

Products never share plans, credits or saved-document limits:

| Product | Free signed-in | Pro paid period |
| --- | --- | --- |
| Studio | 20 credits/month, 5 works, 3 templates | TWD 399/month, 200 credits, 100 works, 50 templates |
| Mandala | No AI credits, 1 cloud goal; manual local editing/export remains available | TWD 199/month, 100 credits, 20 cloud goals |

`credits` is the remaining numeric balance. `limits` is `{works, templates, goals}`. Guests receive Studio standard `analyze` and `generate` once each; signed guest sessions expose remaining operations in `limits.analyses` and `limits.generations`. Guest access cannot save a cloud document. After sign-in, an explicit validated `POST /api/documents` is required to claim a guest result. Nothing is migrated automatically.

Free monthly periods use `Asia/Taipei`. Paid periods come only from verified completed Paddle transactions, never from a client or a subscription lifecycle event. A paid period must be a bounded monthly interval. Standard operations reserve one credit; deep operations reserve ten. Included evaluation is part of the original operation. Explicit evaluation/revision is another paid operation. No overage is charged automatically.

The document-create RPC serializes its quota check and insert. Updates compare the supplied revision while locking the owned row, then atomically append a version. Stale writes return 409. The most recent 100 versions are retained per document. Version reads require the matching product’s Pro plan. Downgrading does not delete documents: existing documents remain readable, exportable, editable and deletable; only new creates are limited. A Studio subscription cannot unlock Mandala versions, credits or limits.

## Atomic reservations, Workflow recovery and cost reconciliation

`hosted_reserve_job` serializes global budget accounting, verifies owner/product/period allowance, reserves credits and daily/monthly/trial budgets, creates the job, and appends a ledger row in one transaction. `(owner, Idempotency-Key)` is unique; the same key with different sanitized input returns 409. Budget calculations use integer micro-USD. Period counters include both reserved and settled spend.

Only an atomic `queued → running` claim can execute a job. A replay of the Workflow or API key cannot acquire the job again. Immediately before the first provider fetch, the Worker persists `dispatched=true`. The same claimed execution can make its generation and included Decisions calls. Provider URLs are fixed to HTTPS OpenAI Responses/Decisions (and Chat Completions if used) or Anthropic Messages. Redirects are forbidden.

Admission and execution share the domain's `liveModelGate`: live mode, explicit AI/quality approval and finite positive daily/monthly budgets are required. The BFF additionally requires positive micro-USD limits. Missing monthly configuration alone uses daily × 31; explicit zero, NaN or infinity is rejected. After claiming a queued job, `runJob` rechecks this gate before engine execution and immediately before every fetch, including after awaiting persistence of the dispatch marker. If approval/budget is withdrawn before any actual provider invocation, the job fails and releases its reservation even if the conservative DB marker was already written. Withdrawal after an earlier provider call prevents further calls and preserves the incurred reservation.

Reserve, claim, dispatched, finish and cleanup consistently acquire the platform-budget advisory lock before a job row lock. Cleanup reads candidates only after acquiring that lock and re-reads the current locked row's state, timeout and dispatched flag before settling it. Transition timestamps and timeout comparisons use wall-clock time after waiting for locks. A refreshed running job is left alone; an actually stale dispatched job becomes unknown and retains its reservation. Cleanup cannot use a previously selected queued/undispatched snapshot to refund a subsequently dispatched operation.

- A known failure before dispatch releases the reservation once. An explicit, certain rejection of the first provider request may also release it.
- If generation already succeeded, a later rejection cannot release its cost. If a dispatched outcome is uncertain, the terminal state is `unknown`; credits and the full estimate stay reserved. The client may reload and poll, but neither polling nor Workflow replay sends another provider request.
- A completed job settles to actual provider usage only when the engine returns the full `actualCostUsd`. Otherwise it keeps the conservative estimate. If observed cost exceeds the estimate, the ledger records the overrun and subsequent work is blocked by the budget. The merchant must validate provider prices/model availability and estimates before launch; reservations cannot guarantee an external provider will never charge above an incorrect estimate.
- Workflow creation uses the durable job ID. An ambiguous creation response leaves the job queued; resubmitting the same key returns that job without creating a second Workflow. A queued job abandoned for an hour is failed and released by cleanup. A running job abandoned for twenty minutes becomes `unknown` if dispatched, otherwise failed. The provider step timeout is fifteen minutes and has zero automatic retries.

Unknown provider calls and unknown checkouts need **manual reconciliation** using the provider/Paddle dashboard and immutable job/transaction references. This version intentionally has no public administrative reset or “retry unknown” endpoint. Do not change a dispatched job to queued or blindly call a provider again. A reviewed operator migration must lock the relevant rows, append an auditable adjustment and preserve budgets if later evidence justifies a correction. This operator workflow is a launch gate, not implemented automation.

## Paddle sandbox setup and acceptance

1. Create two independent monthly recurring sandbox prices: Studio `unit_price.amount="39900"`, Mandala `"19900"`, both `currency_code="TWD"`, explicit `tax_mode="internal"`, no country price overrides, interval `month`, frequency 1, active, with no trial period. This makes the advertised amount tax-inclusive without depending on mutable account tax settings. Configure server IDs and verify product ownership in the merchant account. The BFF fetches and validates the price before creating a transaction.
2. Configure and approve the sandbox checkout domain/default payment link. Checkout creates a transaction with server-owned price, quantity 1 and a server HMAC binding to the pending checkout, product and user. Only HTTPS Paddle or the configured app origin may be returned as a checkout/portal URL. Portal sessions use only that product’s stored customer/subscription binding.
3. Send the relevant transaction, subscription and approved-refund adjustment events to `POST /api/webhooks/paddle`. Signatures use the exact raw bytes, HMAC-SHA256 and the five-second timestamp window. Replayed event IDs are acknowledged without reapplying. Never run the webhook body through a JSON transformer before signature verification.
4. Verify completed payments carry the expected single full-month price/quantity, TWD currency, server binding and billing period. For an internal price, `subtotal` is tax-exclusive; the BFF checks `total` and `grand_total` equal the advertised amount, validates subtotal-plus-tax arithmetic and single-line/unit totals, requires zero discount/credit/generated credit and a zero remaining balance, and rejects proration. For example, a constructed Studio fixture uses subtotal `38000`, tax `1900`, total/grand total `39900`; the Mandala fixture uses `18952` + `948` = `19900`. These are arithmetic/schema fixtures derived from official fields, not captured sandbox receipts or proof of a customer's actual tax treatment. Paddle documents [internal prices and calculated totals](https://developer.paddle.com/api-reference/transactions/get-transaction/) and [grand total before payments](https://developer.paddle.com/changelog/2023/transaction-totals-grand-total/).
5. Only `transaction.completed` can grant/renew paid credits. `subscription.created/activated/updated` cannot grant credits. A newer non-revoking lifecycle event arriving before its payment does not discard that payment. A newer cancellation/paused event prevents an older payment from reactivating access. Old-subscription events cannot revoke a newer bound subscription. Scheduled cancellation retains the already paid period; actual cancellation/pausing revokes it. Any approved refund conservatively revokes its current paid period, including partial refunds; refunds of an older period do not revoke a later renewal. Unbound lifecycle events return a retryable reconciliation error rather than acknowledging and losing an early cancellation.
6. Validate replay, duplicates, renewal, delayed/out-of-order notifications, cancellation, pause, partial/full refund, customer mismatch, and both product combinations in Paddle sandbox. No real checkout or charge is authorized by this document. Discounts, credits, proration, country overrides and non-TWD billing are unsupported and require a separately reviewed pricing policy before being enabled.

Checkout keys are durable. A timed-out dispatched creation stays `unknown`, and a new key cannot bypass an unresolved checkout for the same product during its first twenty-four hours. A returned checkout URL does not grant Pro. Failed/unknown/abandoned checkout reconciliation and duplicate-subscription prevention across old links must be reviewed with the merchant before launch. No automated cancellation/refund API is included.

## Abuse, retention and telemetry

Trial creation requires a successful Turnstile `guest_trial` result for the exact hostname, and a trusted `CF-Connecting-IP`. Raw IPs are sent only to Turnstile verification; the database stores a keyed HMAC. Browser trial tombstones last thirty days; daily per-IP/global caps and a separate trial budget limit resets. These are browser/server protections, **not proof of one human**. Clearing cookies or changing networks can bypass a browser identity, while shared IPs can reach a cap early.

The fifteen-minute scheduled cleanup deletes expired guest sessions and cascades their job requests/results at the twenty-four-hour expiry plus schedule delay. Cleanup keeps content-free cost ledger entries/counters and thirty-day abuse tombstones. Expired authenticated sessions are removed. Signed-in job/document retention, database backups, data-subject export/deletion, operator reconciliation access and legal retention requirements still need an explicit operator policy before launch.

`/api/events` accepts only named allowlisted events, product and an allowlisted template ID. It rejects other fields and stores only daily aggregate counts. No prompt, chart, artifact, email, user ID or IP is written to telemetry. Application code does not log provider bodies, auth tokens or request content. Worker observability is disabled by default; any future logging/tracing must preserve these properties. Database content and provider requests remain sensitive application data even though telemetry is content-free.

## Validation and launch gates

Run from the repository root:

```sh
node --test apps/hosted/test/server-api.test.mjs apps/hosted/test/server-sql.test.mjs
npm ci --prefix apps/hosted --ignore-scripts --no-audit --no-fund
WRANGLER_SEND_METRICS=false npm run check:worker --prefix apps/hosted
```

The SQL test uses installed `initdb`, `pg_ctl`, and `psql` to create a task-owned ephemeral PostgreSQL cluster on a private Unix socket with no TCP listener. It applies the actual migration, creates Supabase-compatible test roles, runs RLS/permissions/ownership checks and real concurrent credit/budget/document operations, and stops/verifies/removes the cluster in `finally`. Without those binaries the SQL test is explicitly skipped; a skip is not database acceptance. These tests do not prove real Supabase Auth/PostgREST or Cloudflare/Paddle service compatibility; staging acceptance remains necessary.

For GitHub Actions, use a normal non-root `ubuntu` runner. Install PostgreSQL server plus contrib if they are not present, and add `$(pg_config --bindir)` (for example `/usr/lib/postgresql/16/bin`) to `GITHUB_PATH`. Run the suite with `REQUIRE_HOSTED_SQL_TESTS=1` so missing binaries fail the job. `initdb` cannot run as root. Tests use a private socket directory rather than the runner’s PostgreSQL service or a shared TCP port. No remote Supabase secret is required. The Wrangler dry-run also needs no Cloudflare token; keep metrics disabled and never change it to an actual deploy in this validation job.

Local evidence on 2026-10-29: `REQUIRE_HOSTED_SQL_TESTS=1 node --test apps/hosted/test/server*.test.mjs` passed 27 tests with no skips, including a real PostgreSQL 14 cluster. The macOS execution sandbox denied `shmget` in a later constrained run; the completed validation used the authorized local IPC escalation, and the cluster’s parent/child PIDs, socket and data directory were removed in `finally`. Wrangler `4.155.0 deploy --dry-run` then ran the actual custom build and bundled `HostedJobWorkflow`, Worker APIs and the imported core/protocol/epistemic TypeScript: 55 shared asset modules, 85 assets, 126.74 KiB Worker / 37.24 KiB gzip. The command exited at `--dry-run` without login/upload/deployment. The ignored `.wrangler/backend-dry-run/meta.json` records all ten imported library TypeScript inputs for review; the temporary npm download cache was removed.

Astra P1 regression evidence on 2026-10-30: before the fixes, withdrawn execution gates still produced one fetch, and a real PostgreSQL schedule reproduced cleanup changing a freshly claimed/dispatched job to `failed` from its stale queued snapshot. After the fixes, all 31 server tests passed with no skips. The PG regression uses separate blocker/worker/cleanup backends and verifies their advisory-lock waits through `pg_stat_activity`; fresh dispatched work remains running and can persist its result, while actually stale dispatched work becomes unknown without a refund. All private cluster backends/socket/data were cleaned. After sharing `liveModelGate` with domain providers, all 22 API/tax tests were rerun successfully, including explicit zero/NaN/infinity rejection and missing-monthly fallback. The final Wrangler dry-run passed at 127.37 KiB / 37.36 KiB gzip. Real deployed Workflow environment/version-update behavior remains part of the Cloudflare staging gate; these tests establish decisions against the environment supplied to the current execution.

Launch remains blocked until all of the following are independently evidenced and the owner authorizes the external changes:

- Human-labelled review of the 120 evaluation candidates and real-model tests for required quality thresholds. Existing candidates, fixtures and mock HTTP contract tests do not establish a ≤5% false-pass rate. Leave `MODEL_QUALITY_APPROVED=false` until the agreed threshold is measured and accepted.
- Verify selectable provider model IDs, prices, API versions, Decisions availability and maximum cost estimates against current accounts/docs. A missing or unsupported model fails closed; no CLI subscription provider or silent cross-provider fallback is used.
- Real Supabase staging migration/PostgREST schema-cache visibility, OAuth Google callback, session refresh, two-user RLS and rollback/restore evidence.
- Cloudflare staging bundle compatibility, Workflows binding/replay behavior, cron cleanup and CSP/Turnstile browser evidence.
- Paddle merchant approval, sandbox event/payment/portal lifecycle coverage, correct tax/currency presentation, legal/support policy and owner approval before any production-billing implementation.
- Operator monitoring and reconciliation procedure for unknown cost/checkouts, alert ownership, sensitive-data retention/backup policy and separately authorized deployment/DNS/secrets.

Rollback is to disable AI/billing flags, route traffic back to the prior Worker version and retain the database for reconciliation/export. Do not drop hosted tables or restore an old database over new user/payment data as an automatic rollback. Destructive database operations require a reviewed backup/restore plan and explicit owner authorization.

References used for protocol details: [Cloudflare Workflow retries](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/), [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Paddle signature verification](https://developer.paddle.com/webhooks/about/signature-verification/), [Paddle transaction creation](https://developer.paddle.com/api-reference/transactions/create-transaction/).
