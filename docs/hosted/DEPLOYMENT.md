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
| `SUPABASE_URL` | Supabase or self-hosted PostgREST HTTPS origin, without a path (see self-hosted section) |
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
| `MANDALA_OWNER_DAILY_CHARTS` | Free Mandala AI: theme proposals per guest or user per Asia/Taipei day, default 3; 0 turns the trial off |
| `MANDALA_OWNER_DAILY_CALLS` | Free Mandala AI: expansions and perspectives per guest or user per day, default 30 |
| `MANDALA_PLATFORM_DAILY_CHARTS` | Free Mandala AI: theme proposals across the whole platform per day, default 200 |
| `MANDALA_PLATFORM_DAILY_CALLS` | Free Mandala AI: expansions and perspectives across the platform per day, default 2000 |
| `MANDALA_INVITE_CHARTS`, `MANDALA_INVITE_CALLS` | Free Mandala AI for a guest who redeemed an invite, for the guest's 24-hour lifetime; defaults 1 and 10 |
| `MANDALA_INVITES_DAILY`, `MANDALA_INVITES_OPEN`, `MANDALA_INVITE_TTL_DAYS` | Invite codes per signed-in account: created per Asia/Taipei day, unused at once, days valid; defaults 3, 3, 7. Zero disables invites |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Direct Google sign-in (OpenID Connect). When both are set, sign-in uses Google directly instead of Supabase Auth. The secret is a Worker secret |
| `ADMIN_EMAILS` | Comma-separated emails allowed to use `/api/admin/*` (metrics, report review, example seeding); everyone else gets 404 |
| `OWNER_EMAILS` | Comma-separated emails that see owner-only park tools (currently Mind Galaxy at `/mind`). Empty falls back to `ADMIN_EMAILS`. The demo treats every account as owner |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Challenge keys for the configured hostname; render with action `guest_trial` |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Independent direct-provider credentials for the provider the operator selects |
| `STUDIO_PROVIDER` | `anthropic` or `openai`: the provider every studio and paid Mandala job runs on. Users never choose; the client value is ignored. Unset: Anthropic when its key exists, else OpenAI |
| `DECISIONS_ENABLED` | Must equal `true` (with `OPENAI_API_KEY`) to run the optional OpenAI Decisions checks on Anthropic output; this is the operator's choice, unavailable checks remain `unknown` |
| `JOB_WORKFLOW` | Cloudflare Workflow binding to `HostedJobWorkflow` |
| `ASSETS` | Built static-asset binding |
| `BILLING_ENABLED` | Explicit opt-in, default `false` |
| `PADDLE_ENV` | Must equal `sandbox` in this implementation |
| `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` | Sandbox API credential and this endpoint’s signature secret |
| `PADDLE_PRICE_STUDIO`, `PADDLE_PRICE_MANDALA` | Distinct server-owned recurring price IDs |
| `TELEMETRY_TEMPLATE_IDS` | Optional comma-separated server allowlist; defaults to `message,weekly,compare` |

The BFF does not accept client price IDs, owner IDs, credit balances, billing periods, service URLs, environment flags, entitlement grants or provider endpoints.

## Supabase preparation (requires separate authorization)

1. Select a new staging project and take a recoverable schema backup. Apply `apps/hosted/migrations/0001_hosted.sql`, then `0002_mandala_trial.sql`, as the Supabase migration owner. The script expects Supabase `auth.users`, `auth.uid()`, `anon`, `authenticated`, and `service_role`.
2. Verify the resulting functions are service-role only. Check every hosted table has enabled/forced RLS and that two real staging users cannot read or write each other’s records. Authenticated clients may select their own documents/jobs/subscription summaries; they cannot call mutation or ownership-parameter RPCs. Version selection additionally requires the document product’s current Pro plan.
3. Configure Google OAuth through Supabase Auth. Allow the exact application origin and `/api/auth/callback` redirect, including its `flow` query parameter. The BFF uses Supabase PKCE (`s256`), a ten-minute encrypted verifier cookie and a same-browser random flow binding. It exchanges the one-use code server-side.
4. Verify login/callback/logout and concurrent refresh against the real staging project. The browser gets a random opaque seven-day session cookie, `Secure`, `HttpOnly`, `SameSite=Lax`, host-only and `Path=/`. Access/refresh tokens stay encrypted in a service-only table. Refresh has a database lease. An uncertain/failed refresh revokes the local session and requires sign-in again.
5. Verify all unsafe browser methods require both exact `Origin` and the current `/api/session` CSRF token in `X-CSRF-Token`. The Paddle webhook is exempt from browser CSRF because it verifies its own signature before parsing or applying an event.

Session-cookie expiration is fixed at seven days. Browser trial/CSRF binding cookies last thirty days. Rotating `SESSION_SECRET` invalidates cookies and encrypted sessions; it also invalidates signatures on previously issued, unpaid checkout bindings. Reconcile pending checkouts and plan forced sign-in before rotating. This implementation does not include multi-key rotation.

## Self-hosted PostgreSQL instead of Supabase

The Worker only needs a PostgREST endpoint at `/rest/v1`, so a self-hosted PostgreSQL with PostgREST can replace Supabase. Sign-in then uses direct Google OpenID Connect (see below); leave `SUPABASE_ANON_KEY` unset. Files are in `apps/hosted/selfhosted/`.

1. As a superuser, run `bootstrap.sql`, then set a password for `authenticator`. It creates the `anon`, `authenticated`, `service_role` and `authenticator` roles plus `auth.users` and `auth.uid()`. Then apply `migrations/0001_hosted.sql`, `0002_mandala_trial.sql`, `0003_google_invites_metrics.sql`, `0004_public_feed.sql` and `0005_topics.sql`. Never run `bootstrap.sql` on Supabase.
2. Run PostgREST 12 with `postgrest.conf`. Pass `PGRST_DB_URI` and `PGRST_JWT_SECRET` through a mode-0600 environment file; the JWT secret is independent of every other secret. PostgREST listens on `127.0.0.1:3000` only, and PostgreSQL stays on loopback.
3. Install `nginx-postgrest.conf`. It listens on `127.0.0.1:8088` and forwards only `POST /rest/v1/rpc/hosted_*`; everything else returns 403 or 404.
4. Expose port 8088 through Cloudflare Tunnel (`cloudflared.yml`), so the server opens no inbound port.
5. Run `PGRST_JWT_SECRET=... node apps/hosted/selfhosted/mint-service-token.mjs 365` and store the output with `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. Set `SUPABASE_URL` to the tunnel origin (for example `https://ig-db.example.com`). The token grants full data access: keep it only in the Worker secret store and rotate it before it expires by minting a new one.
6. Back up the database (for example nightly `pg_dump` kept off the host) before opening the trial. Trial counters and job records live only there.

The SQL suite applies the same `bootstrap.sql`, so a migration that needs another Supabase object fails in CI. PostgREST itself and the tunnel are not exercised by the tests; verify one real `hosted_reserve_job` call through the tunnel on staging.

## Direct Google sign-in

1. In Google Cloud Console, create an OAuth consent screen (External) with only the `openid` and `email` scopes, the application home page, and the privacy policy and terms URLs (`/privacy`, `/terms`). Fill in the bracketed placeholders in `apps/hosted/public/legal.js` first. Basic scopes do not require Google verification; move the app from Testing to In production so any Google account can sign in.
2. Create an OAuth client of type Web application. The only authorized redirect URI is `${APP_ORIGIN}/api/auth/callback`.
3. Set `GOOGLE_CLIENT_ID` as a var and `GOOGLE_CLIENT_SECRET` with `wrangler secret put`.

The Worker sends the user to Google with PKCE (`S256`), a random `state` and a `nonce`, all bound to a ten-minute encrypted cookie. It exchanges the code server-side and reads the ID token returned by Google's token endpoint over TLS, which OpenID Connect Core 3.1.3.7 allows in place of a signature check. It still requires the issuer, audience, expiry, nonce and `email_verified`. `hosted_user_upsert` maps the Google subject to one `auth.users` row, so this mode targets the self-hosted bootstrap. The app keeps its own seven-day session and stores no Google tokens.

## Free test period: invites, history and metrics

`0003_google_invites_metrics.sql` sets the rules for the free test period:

- **Guests** browse the pre-generated example library (`public/mandala-examples.json`) and edit charts by hand. They cannot run the Mandala AI unless they redeemed an invite (`trial_login_required`).
- **Signed-in users** run `MANDALA_OWNER_DAILY_CHARTS` charts per day, keep up to 10 cloud charts, and see Mandala version history without Pro.
- **Invites**: a signed-in user creates codes (`POST /api/invites`) within the daily and unused limits. A code works once, expires, cannot be redeemed from the browser that created it, and a browser can redeem only one code ever. Redeeming (`POST /api/invites/redeem`, Turnstile required) creates a 24-hour guest with the invite allowance. If that browser later signs in, the invite counts as joined.
- **Activity**: each Mandala AI job or cloud save by a signed-in user records one row per user per Asia/Taipei day in `hosted_user_activity`.
- **Metrics**: `GET /api/admin/metrics?days=30` (operators in `ADMIN_EMAILS` only) returns signups, daily active users, D1/D7/D30 retention by signup cohort, activated users (a cloud chart with at least 8 filled actions), invites created/redeemed/joined, trial charts per day and Mandala event counts.
- **Account deletion**: `DELETE /api/account` removes the account and everything it owns. Accounts with payment records are refused (`billing_conflict`) so accounting records stay intact.

Regenerate the example library with `ANTHROPIC_API_KEY=... node apps/hosted/scripts/generate-mandala-examples.mjs`. It keeps the hand-written seeds in `apps/hosted/examples/seed-examples.json`, generates one chart per goal in `examples/goals.json` (about USD 0.1 each), and skips goals already generated unless `--force` is given. Review the output before deploying it.

## Public feed, sharing and exports

`0004_public_feed.sql` adds the public Mandala feed:

- **Who sees what.** `/feed` and `GET /api/feed` need a signed-in account. A share link `/mandala/p/:id` opens for anyone; the Worker injects the chart's title and description as Open Graph tags with `noindex`. Publishing needs a cloud-saved chart and a public profile (nickname 1–24 characters, one of the avatars `a01`–`a12` in `public/avatars/`). The snapshot holds the title, goal, themes, actions and done marks; notes and due dates are never copied. Publishing again refreshes the snapshot; deleting the chart or the account deletes it.
- **Ranking.** Sorts are newest, popular (cheers + 2 × copies), most copied and most done. Popular and most copied count only interactions inside the chosen window (`7d` default, `30d`, `all`). Views break ties: one per signed-in viewer per chart per Asia/Taipei day, counted when the chart is opened or its actions are expanded; anonymous opens and the author's own opens are not counted. Each user cheers and copies a chart at most once.
- **Examples in the feed.** The charts in `public/mandala-examples.json` are published under the brand account (`user_id` null, shown as 九宮格小編 / Mandala Team with `avatars/brand.svg`) and ranked by the same rules. Their counts start at zero; nothing is pre-filled. Examples only show in the viewer's language. After deploying a new examples file, an operator calls `POST /api/admin/examples` while signed in (it reads the deployed file and upserts by example id; counts are kept). The demo seeds itself on the first feed request. Each example needs 1–3 `tags` from `health, learning, career, money, sports, creative, family, life`.
- **Reports.** Reasons are personal data, harmful, spam and other. Three reports from different users hide a chart; the author still sees it. `GET /api/admin/public` lists reported or hidden charts with reason counts; `POST /api/admin/public/:id {"hidden": false}` restores a chart and clears its reports, `{"hidden": true}` keeps it hidden.
- **Metrics.** `GET /api/admin/metrics` includes `feed`: charts published by users, publishers, cheers, copies and views in the period, and hidden charts. Events `feed_viewed`, `chart_shared` and `chart_exported` are counted per day.
- **Exports** run in the browser with no dependencies (`public/export.js`): a 1080×1350 PNG, a one-page PDF holding that image (text is not selectable), and an `.xlsx` with the 9×9 chart and a flat action list. Saving to Google Drive is not implemented.
- **Avatars** in `public/avatars/` are placeholders from `scripts/generate-avatars.mjs`. Replace any file with final artwork of the same name and size ratio (square SVG or same-named PNG after changing the extension in `app.js`).

## Tool park at apps.stephen.taipei

The hosted app is one Worker on one origin, `https://apps.stephen.taipei`, with tools split by path. One login, one set of daily quotas and (later) one plan cover every tool.

| Path | Tool | Status |
|---|---|---|
| `/` | Park catalog | live |
| `/mandala`, `/mandala/p/:id` | Mandala chart, share page | live |
| `/studio` | Intent Galaxy decision studio | beta |
| `/feed` | Public Mandala feed | live, signed in |
| `/topics` | My topics | live, signed in |
| `/mind` | Mind Galaxy export (Markdown note) | owner only (`OWNER_EMAILS`) |
| `/pricing` | One plan for the whole park | test period free |

- **Domain.** `wrangler.jsonc` declares `apps.stephen.taipei` as a Workers custom domain, so the `stephen.taipei` zone must be on Cloudflare DNS. Set `APP_ORIGIN` to `https://apps.stephen.taipei` and add `https://apps.stephen.taipei/api/auth/callback` as the Google OAuth redirect URI.
- **Topics.** `0005_topics.sql` adds private per-user topics (at most 200, title 1–120 characters) that tie documents across tools. `hosted_documents.topic_id` links a document; deleting a topic only unlinks its documents. Routes: `GET/POST /api/topics`, `PUT/DELETE /api/topics/:id`, `PUT /api/documents/:id/topic {"topicId": id|null}`. Topics are never public.
- **Cross-tool links.** A Mandala chart in a topic offers "decide in Intent Galaxy" (`/studio?goal=&topic=`); a studio work offers "expand to Mandala" (`/mandala?goal=&topic=`). The first save on the target links it to the same topic. `?doc=<id>` opens a saved document.
- **Mind Galaxy.** Mind Galaxy (v0.14) stays a local personal app, a companion to Obsidian. `GET /api/topics/:id/export` (format `intent-galaxy.topic-export` version 1, owner only, others get 404) feeds the browser, which turns the topic into one Markdown note in Mind Galaxy's V-2 flat frontmatter (`apps/hosted/public/mind-galaxy-note.js`). Mind Galaxy imports that file as-is through its existing `POST /imports`, and it can also go straight into an Obsidian vault, so Mind Galaxy itself needs no change. The note is deterministic, so re-exporting an unchanged topic is skipped as `already_imported`; a changed topic imports as a new note. `why` stays empty because V-2 reserves it for the user's own words.
- **Billing.** Per-product Paddle prices stay disabled. Pricing shows guest / free / planned paid tiers, all free during the test period; the paid tier will be AI-usage tiers across all tools, not per-tool locks.

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

## Free Mandala AI trial

Mandala's AI is free to use during the trial; the Pro price on the pricing page is the planned price. Four operations bypass plan credits: `themes`, `expand_theme`, `expand_empty` and `perspectives`. They accept only `provider: "anthropic"` and `mode: "standard"`, and run on fixed models: `themes` on `claude-sonnet-5-5` at effort `low`, everything else on `claude-haiku-5-5` at effort `low`, each with a JSON-schema response format. `perspectives` makes four parallel calls, one per Intent Galaxy quadrant; `expand_empty` makes one call per titled theme with empty actions. The program, not a model, checks every result: the exact count, no blank entries, and no duplicates of each other or of what the user already wrote. Every result is a proposal the user applies.

`hosted_reserve_job` (from `0002_mandala_trial.sql`, replaced by `0003`) admits these operations for every signed-in plan and for guests who redeemed an invite. It counts a theme proposal against the `charts` caps and any other trial call against the `calls` caps, both per owner and platform-wide (`owner_key = 'platform'` in `hosted_credit_usage`), per Asia/Taipei day. A cap that is reached raises `trial_limit` (HTTP 429). When a job fails, the owner's count is returned but the platform count is not, so a failing provider cannot push usage past the daily total. The existing daily, monthly and guest-trial USD budgets still apply on top of these counts. With the default `TRIAL_DAILY_BUDGET_USD` of 0.50, guests can hold at most seven theme reservations at USD 0.07 each at once. Raise it to match `MANDALA_PLATFORM_DAILY_CHARTS` before opening the trial to guests.
