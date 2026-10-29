# Hosted implementation contract — 2026-10-29

## Outcome and boundaries

Ship two reviewable draft PRs, without production deployment, live checkout, account configuration, or paid model calls. Preserve the original v2 worktree and the original website checkout/output. v2 snapshot baseline: `47b5866`; source provenance: `v2-baseline.json`. Keep protocol 1.0, core polarity and zero runtime dependencies in CLI/libs. No external actions from generated content.

Products are independent: `studio` Pro TWD 399/month, 200 credits, 100 saved works/50 templates; free 20 credits/month, 5 works/3 templates; guest one analysis + one generation. `mandala` Pro TWD 199/month, 100 credits, 20 cloud goals; free full manual local editor/export, one cloud goal when signed in, no free AI credits. No shared subscription or credit pool. Standard AI operations cost 1 credit, deep 10. Evaluation accompanying generation is included; explicit rerun is a paid operation. No automatic overage. Free monthly periods use Asia/Taipei; paid periods come from verified Paddle payments.

## JSON HTTP contract

All APIs same origin, JSON, no-store; unsafe methods require Origin check + session CSRF token in X-CSRF-Token. Errors `{error:{code,message}}`, no provider payloads/secrets. Client requests use `Idempotency-Key` for jobs and checkout.

- GET `/api/config`: `{mode:'demo'|'live'|'disabled',authEnabled,billingEnabled,turnstileSiteKey,models}`.
- GET `/api/session`: `{user:null|{id,email},csrfToken,entitlements:{studio:{plan,credits,limits},mandala:{plan,credits,limits}}}`. Auth: GET `/api/auth/login`, GET `/api/auth/callback`; POST `/api/auth/logout`.
- POST `/api/guest` `{turnstileToken}` establishes signed guest session. One browser trial, server rate/budget caps; not a one-human guarantee. Guest work expires after 24h, claim is explicit save after login.
- POST `/api/jobs`: `{product,operation,provider:'openai'|'anthropic',mode:'standard'|'deep',consentDecisions:boolean,payload}` → 202 `{job:{id,status}}`. GET `/api/jobs/:id` → `{job:{id,status,result?,error?}}`. Terminal status `completed|failed|unknown`; running `queued|running`. Never repeat a dispatched provider call automatically after an unknown outcome. Reload/poll can recover status.
- Studio operations: `analyze` payload `{taskType:'message'|'weekly'|'compare',goal,input,requirements:[string]}`; `generate` adds `{analysis,selection:{baseKey,overrides,notes?},contract}`; `revise` adds `{artifact,instruction}`; `evaluate` adds `{artifact}`. Contracts contain `{taskType,goal,input,requirements,selection}`. Server must compile/validate selection itself; never trust client AST.
- Mandala operations `expand|review`: payload `{chart:{schemaVersion:1,title,goal,themes:[{id,title,actions:[{id,text,done,dueDate?,notes?}]}]},instruction?}`. Exactly 8 themes and 8 actions each; IDs stable, central/theme mirrored values derive from same data. AI only proposes changes; client explicitly applies them.
- GET `/api/documents?product=studio|mandala&kind=work|template|goal` → `{documents:[{id,product,kind,title,data,revision,updatedAt}]}`. POST `/api/documents` `{product,kind,title,data}` → `{document}`. GET/PUT/DELETE `/api/documents/:id`; PUT includes `{title,data,revision}` (409 stale write). GET `/api/documents/:id/versions` → `{versions:[{revision,data,createdAt}]}` (Pro). Downgraded users can still read/export/delete existing docs; enforce limits on create. No cross-product entitlement bypass.
- POST `/api/billing/checkout` `{product}` → `{url}`; POST `/api/billing/portal` `{product}` → `{url}`; POST `/api/webhooks/paddle` raw signed webhook. Price IDs and environment are server-owned, never accept a client price or entitlements.
- POST `/api/events` `{name,product,templateId?}` allowlisted aggregate events only, no input or artifact body.

## Engine contract (primary owner)

`apps/hosted/domain/index.mjs` exports `validateJobRequest(request)`, `creditCost(request)`, `estimateCostUsd(request)`, `executeJob(request,{env,fetchImpl=fetch})`, `validateDocument({product,kind,title,data})`, `PRODUCTS` and `MODEL_REGISTRY`. Validations throw errors with `.code`/`.status`; validated return values are sanitized. Execute returns `{analysis?,contract?,artifact?,evaluation?,chart?,suggestions?}` with usage metadata. Only execute calls providers. Demo mode returns explicit labelled synthetic fixtures and never reports actual AI results. Live mode requires explicit env flags and nonzero platform budget. Provider URLs fixed; no client URLs/tools/external actions. No subscription CLI providers.

Artifact `{id,version,content,contractHash,contentHash}`; evaluation `{artifactHash,contractHash,rubricVersion,status,checks:[{id,label,status,source}],model?,unavailableReason?}`. Editing invalidates hashes. Semantic checks fail to `unknown`, not pass. Claude content only sent to OpenAI with consentDecisions; no silent provider fallback. Unknown API outcomes must remain distinguishable for reconciliation.

## Ownership

- Primary: Git, domain/providers/Decisions/mandala validation, domain/eval tests, hosted build/dev scripts, integration and final acceptance.
- Backend worker: `apps/hosted/server/**`, `apps/hosted/migrations/**`, `apps/hosted/test/server*`, `apps/hosted/wrangler.jsonc`, `apps/hosted/package*.json`, `docs/hosted/DEPLOYMENT.md`.
- Frontend worker: `apps/hosted/public/**`, shared v2 view extraction in `apps/web/decision-view.*`, extension forwarding wrapper, frontend tests only. Coordinate root tooling changes with primary.
- Website worker: new website worktree, all website feature files, no Git mutation or publication.

## Acceptance and outstanding operational evidence

Run existing core/CLI/extension tests and build, hosted domain/API/abuse/billing/isolation tests, website lint/content/editorial/production builds, and desktop/mobile/keyboard browser QA. Maintain 120 labelled evaluation cases; mock contract tests are not real model quality evidence. Live quality thresholds, merchant approval, deployment secrets, DNS, actual retention/paid conversion evidence remain explicit launch gates, never fabricated as passed. No paid or production action without the user's final confirmation.
