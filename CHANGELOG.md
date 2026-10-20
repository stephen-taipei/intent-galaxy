# Changelog

Versions follow the npm package [`@stephen.taipei/intent-galaxy`](https://www.npmjs.com/package/@stephen.taipei/intent-galaxy). Each published version has a `vX.Y.Z` tag and a GitHub Release. 0.1.4 was bumped on `main` but never published.

## 0.1.8 — 2026-10-20

- **Anti-slop rule works across languages**: the prompt's R4 is now a language-neutral rule (no vague improve/ensure verbs, hedges, or comparatives without a baseline number) with Traditional Chinese and English examples, instead of a Traditional-Chinese-only word list. The `claim` check (V16, warning only) also catches Simplified Chinese forms (优化, 确保, 加强…) and English filler (improve, enhance, leverage, might…); proper terms such as 负载平衡器, 强化学习, potential customers and optimizer are not flagged.

## 0.1.7 — 2026-10-20

- **Extension panel opens almost full-screen** (1% margin on each side, at least 8px) and follows window resizes until you move or resize it.
- **One click to start**: pressing iG with a question in the chat box puts the analysis prompt straight in (no extra "start" card unless the local CLI is running). The panel stays hidden, the chat box turns read-only so the prompt can't be edited by accident, and the site's send button glows; once the prompt is sent the chat box is restored and the panel opens by itself.
- **Gemini: iG button no longer sits inside the send button's container** (clicking it used to hit send and post the plain question); the button is placed next to the container and the send-button glow is no longer clipped.
- **Claude and Gemini get the same send flow as ChatGPT**: on Claude the prompt is pasted in short pieces so it stays text instead of becoming a "Pasted text" attachment; on Gemini the extension waits for its delayed paste instead of reporting "can't find the input box". The chat box locks, the send button glows, and the panel opens after sending.
- **After the plan is put in the chat box** the iG button moves to the bottom-right corner as "Intent Galaxy ✓ Galaxy ready"; it returns to the chat toolbar as a plain "iG" once you type or send something new. Until you send it, the chat box stays read-only and the site's send button glows, the same as when the prompt is first put in.

## 0.1.6 — 2026-10-19

- **Extension button shows the Intent Galaxy logo** instead of the 🌌 emoji, on a solid brand blue-purple background that stays readable on light sites; chat banners say "iG panel".
- **Extension panel opens large enough to see the whole galaxy** (at least 1000px wide, up to the input box); nothing overflows the panel at 1280×720 any more.
- **Plain-language fill-back**: the text put into the chat box no longer contains `LOCKED INTENT AST`, `MUST`, `[N#]` or `kill:`; empty sections are skipped and a one-line instruction for the AI closes it. The engineering AST stays in the CLI and `.intent.lock.json`.
- **Prompt preamble** in the user's language explains what the long English prompt is before they press send; collapsed prompt turns hide their text fully.
- **Reopening the panel restores the chosen plan** and manual picks for that conversation.
- **Plain quadrant names** (no personas), N numbers / D badges / key hints hidden in the extension (a `?` button lists shortcuts), connection lines stop at node borders, adopted/excluded nodes use opaque backgrounds, dimmed nodes are more readable.
- **Width-aware truncation** so Latin-script titles are no longer cut as if they were CJK.
- **Brand colours** (blue/purple) on buttons, active cards and the panel frame; panel title shows the logo.
- **Extension version follows the npm package**: both manifests now carry the package version (they were stuck at 0.1.0).
- **README in five languages**: English by default, plus 繁體中文, 简体中文, 日本語 and 한국어.

## 0.1.5 — 2026-10-18

- **41-locale UI**: picked from the browser language, with a language menu in the galaxy bottom bar; the choice is remembered and switches without reloading. Extension manifest, toolbar tooltip and demo galaxies are translated into all 41 locales.
- **Plain-language copy** across every locale and demo for a general audience.
- **Plan panel**: buttons to hide the plan sidebar and the plan cards; the galaxy keeps scrolling while the sidebar is open; choosing a plan card restores its original picks.
- **Why a view was dropped**: red dashed conflict lines, amber dependency lines, reasons in the tooltip. The prompt lets the model decide how many conflicts a question has.
- **Extension**: generates the galaxy with the chat site's own AI by default (local CLI is optional); movable/resizable panel; remembers galaxies per conversation; user presses send (no auto-submit); chosen-plan drawer; reset button; many review fixes.
- **Brand**: Intent Galaxy logo in README, web UI and extension icons.
- **README** re-layout with tables and diagrams.

## 0.1.3 — 2026-10-16

- Galaxy generation through Codex, Gemini and agy CLIs plus Anthropic / OpenAI-compatible APIs (keys from env only).
- More chat sites supported by the extension.

## 0.1.2 — 2026-10-16

- Readable summary replaces the raw instruction panel; recommended strategy card is highlighted.
- Tooltips on views, cards, key hints and buttons; lock button named by its outcome, with a next-step dialog.
- Sample galaxy switched to a multi-layout, multi-theme frontend architecture decision.
- Mock status bar removed from the local galaxy page; README screenshots refreshed.

## 0.1.1 — 2026-10-16

- Internal review notes, RFC drafts and handover files kept out of the public repo.

## 0.1.0 — 2026-10-16

- First public release as `@stephen.taipei/intent-galaxy`: local CLI + Stdio MCP server, Galaxy-First web UI, browser extension, signed intent locks and the 14-day kill-gate.
