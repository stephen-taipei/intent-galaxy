# Intent Galaxy V2 extension — local acceptance

Date: 2026-10-29 · Base: `37c3be3` · Result: accepted for local development delivery.

## Scope and reference

Implement the selected three-screen extension concept: compare options beside an AI conversation, inspect a galaxy, and preview before filling the conversation input. The launcher uses the existing Intent Galaxy mark. The extension remains a movable, resizable overlay; it does not rewrite host-page layouts. This is not a store release.

The selected references are the extension compare, reasons, and preview mockups generated in this task (`exec-fbbd3fdb-e503-423b-9a3f-dc5d155c2235.png`, `exec-b4624d1c-d38b-4ea7-b07c-2c56d0a2f1de.png`, and `exec-439201bc-276b-41b0-a6ff-a179ebbada9d.png`). Desktop comparison used their 1672 × 941 viewport. Responsive checks also used 375 × 812 and 320 × 812.

## Visual review

| Area | Result |
| --- | --- |
| Hierarchy | Light panel, visible host-chat context, compact brand header, three option cards, persistent primary action. |
| Brand | Existing logo paths replace the `iG` text. Full name and status remain in the accessible label. Existing blue/purple brand colors are reused. |
| Option comparison | Each option displays its actual title, thesis and sacrifice. Selected details expand; guardrails and accepted risks remain available in the scrollable content. |
| Galaxy | A compact graph displays up to six actual nodes and their relationships. Full mode exposes all twelve nodes. The view is read-only until advanced editing is enabled. |
| Preview | Readable compiled text, selected direction, optional notes, copy action and explicit fill action. The user sends the message on the AI site. |
| Narrow layouts | Content scroll width equals client width at 320px and 375px. The compact graph and its container both use 380px height below 400px; no graph-container clipping. |
| Keyboard | Native Tab traverses six compact or twelve full nodes, then reaches controls outside the graph. Shift+Tab returns into the graph. Focus is visible. |

The real dishwasher sample supplies the text and graph. It is intentionally not replaced by invented copy from the image mockups. The full graph retains the existing visual language. Long reasoning, guardrails, optional notes and preview text scroll; they are not silently truncated out of the result.

Local screenshots from the actual extension scripts in the preview fixture:

- [Compare](/Users/stephen.chuang/.codex/visualizations/2026/10/29/01a186c6-eb9a-7753-b19b-093d51593f90/v2-compare.jpg)
- [Galaxy](/Users/stephen.chuang/.codex/visualizations/2026/10/29/01a186c6-eb9a-7753-b19b-093d51593f90/v2-galaxy.jpg)
- [Preview](/Users/stephen.chuang/.codex/visualizations/2026/10/29/01a186c6-eb9a-7753-b19b-093d51593f90/v2-preview.jpg)
- [Narrow layout](/Users/stephen.chuang/.codex/visualizations/2026/10/29/01a186c6-eb9a-7753-b19b-093d51593f90/v2-mobile.jpg)
- [Filled composer](/Users/stephen.chuang/.codex/visualizations/2026/10/29/01a186c6-eb9a-7753-b19b-093d51593f90/v2-filled.jpg)

## Behavioral acceptance

| Check | Evidence |
| --- | --- |
| Shared state | Choosing a card, inspecting nodes and editing advanced stances use one `DecisionSession`; switching views does not regenerate analysis. |
| Conflicts | Two conflicting manual includes disable confirmation. Undo restores SAT; redo restores the conflict. |
| Persistence | After undo and page reload, the actual manual override and optional notes return. Reopening a filled plan restores its latest picks and preview. |
| Preview fidelity | Preview, copied text and filled composer compared equal (591 characters in the synthetic fixture). Conversation message count remained three: no automatic send. |
| Conversation isolation | Replacing the visible run nonce and clicking the old preview's fill action leaves the composer empty and displays an other-conversation notice. |
| Temporary chat | Draft messages were forwarded in temporary mode with no storage-write event. Reload recovered the prior persisted note, not `TEMPORARY QA ONLY`. |
| Async draft handling | Independent in-memory checks rejected foreign nonces, avoided ephemeral draft storage access, rejected an older delayed load, and prevented an in-flight draft from overwriting fill state after timer cancellation. |
| Compiler invariants | Existing Q1–Q3 exclusion / Q4 accepted-risk semantics and CLI verification pass. A manually changed V2 plan is labeled custom and does not reuse potentially obsolete preset costs in plain text. |

Draft persistence covers website-AI conversations with a run record. Local CLI, page-only imported analyses and demo mode do not receive this persistence guarantee. Existing incognito/temporary runs remain ephemeral. Undo/redo history is session-local; restored picks are durable.

## Checks and review

- `npm run build:ext` — passed, 93 shared galaxy modules.
- `npm test` — passed: 41 locales / 294 keys, protocol, core, session regressions, spawner, CLI, kill-gate, providers, five README locales, extension sync and npm package (110 files).
- `npm run pack:ext` — passed; Chrome and Firefox archives generated under `dist-ext/`.
- `node --check` for changed JavaScript and `git diff --check` — passed.
- Independent acceptance review: **ACCEPT / CONTINUE**, scoped to local development delivery. Shared Chrome/Firefox files were byte-identical and relative module imports resolved.

Fixes made during review include undo/redo draft saving, no-op history preservation, override-order round trips, stale nonce rejection, final-fill draft synchronization, readable custom-plan output, native Tab traversal, and compact-graph clipping.

## Limits and local use

The browser fixture loads the production content/panel scripts and uses a test-only extension-API shim. It makes the frame shadow root inspectable, uses local sample data and blocks panel network connections. It is not evidence of compatibility with live AI websites, the installed Firefox runtime, or a real incognito session. Those integrations remain to be tested before release. Some translations have not received native-speaker review.

Run `npm run build:ext`, then `npm run preview:ext` to reproduce the local preview at `http://127.0.0.1:4789/`. Stop it with Ctrl+C. Load `apps/extension` as an unpacked Chrome extension for subsequent live-site testing. No store submission, deployment, version bump, commit or push was performed.

The task-owned preview server is shut down after QA; it is not retained as a background service. The original checkout's `cws-listing-55.json` is preserved.

Resource record: owner `/root`; PID `64296`, PPID `87196`; started `2026-10-29 18:05:28 Asia/Taipei`; command `node tools/extension-preview.mjs --port 4789`; cwd is this worktree; listener `127.0.0.1:4789`. No child processes were present. SIGTERM completed, and follow-up `ps` and `lsof` confirmed the PID and listener were released. The temporary browser viewport override was reset and the QA tab closed.
