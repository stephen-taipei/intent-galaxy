# CLAUDE.md — Intent Engineering Galaxy (@intent-eng)

## 唯一真理來源 (Single Source of Truth)
- 任何架構與型別修改 MUST 嚴格遵循根目錄之 `INTENT-SPEC-FINAL.md` (v1.0.0 Galaxy-First Edition)。

## 已就緒核心模組
- `packages/protocol/src/index.ts`：Stage 1 Canonical Schema (`IntentAnalysisResponse`)。
- `packages/core/src/slop.ts`：Fable 5.1 封箱版 Anti-Slop Regex 過濾器。
- `packages/core/src/compiler.ts`：Astra 44 行統一 Bitmask + L0-L3 優先權純函式求解器。
- `packages/epistemic/src/prompt.ts`：Opus 5.5 Master Spawner System Prompt。
- `packages/epistemic/src/splitter.ts`：Sonnet 5.5 零依賴 `IntentNdjsonSplitter`。
- `apps/galaxy-prototype/index.html`：純正星系版 60 秒視覺化互動原型。

## 常用驗證指令
- 測試核心求解器：`node --experimental-strip-types packages/core/src/verify.ts`
- 測試串流切分器：`node --experimental-strip-types packages/epistemic/src/verify-splitter.ts`
