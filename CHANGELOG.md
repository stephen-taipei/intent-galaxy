# Changelog

Versions follow the npm package [`@stephen.taipei/intent-galaxy`](https://www.npmjs.com/package/@stephen.taipei/intent-galaxy). Each published version has a `vX.Y.Z` tag and a GitHub Release. 0.1.4 was bumped on `main` but never published.

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
