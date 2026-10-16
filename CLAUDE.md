# CLAUDE.md — intent-engineering-galaxy

## 1. 專案定位與終極目標
本專案為 `intent-engineering-galaxy`（意圖工程與 60 秒視覺化星系決策框架），架構與發行標準完全對標作者另一開源套件 `adorable-git-graph`：
- **零外部 Runtime 依賴（0 Dependencies）**、Node.js >= 22、Apache-2.0 License。
- **三位一體發行形態**：
  1. **Local CLI & MCP Server (`apps/cli`)**：支援 `npx intent-engineering-galaxy` 於本機 `127.0.0.1` 啟動，並支援 Stdio MCP 協議直接與 Claude Code / CLI 工具雙向通訊。
  2. **Chrome & Firefox Extensions (`apps/extension`, `apps/extension-firefox`)**：將 `🌌 iG` (Intent Galaxy) 膠囊按鈕注入各大 AI 網頁版（Claude, ChatGPT, Grok, Gemini），點擊後原地展開星系 Overlay，按下 Enter 直接將鎖定之 `LOCKED INTENT AST` 注入對話輸入框。
  3. **Claude Code Mod 原生 UI 整合 (`apps/web` & Mod Injector)**：完美融入作者自訂之 Claude 狀態列（`Sub5 | cL | cS | cA | cR | gF | Recap` 旁新增 `🌌 iG` 膠囊），實現零剪貼、零視窗跳轉的原生開發流。

## 2. 唯一真理來源 (Single Source of Truth)
- 任何架構、資料結構、演算法與 UI 變更，**MUST** 嚴格遵循根目錄之 `INTENT-SPEC-FINAL.md` (v1.0.0 Galaxy-First Edition)。
- **核心設計哲學（純正星系版 Galaxy-First）**：
  - **先發散**：首屏直接繪出中心命題與四周 4 大敵對專家象限（Q1 歸零者 / Q2 老兵 / Q3 越界者 / Q4 驗屍官）共 12 顆節點（帶 `✦ 盲區` 標記），初始不畫交錯連線以保持視覺乾淨（Anti-Spaghetti Rule）。
  - **後收斂**：點擊底部 3 選 1 策略卡（或按 `1/2/3`）瞬間點亮主幹軌道連線；支援鍵盤流（`h/j/k/l` 導航、`Space/i` 採納、`x` 設為排除護欄、`0/n` 忽略、`r` 自動解衝突、`s` 觸發 TRIZ 矛盾合成）。
  - **零 LLM 純函式編譯**：Stage 2 編譯（`compileIntent`）與衝突求解 100% 由 `libs/core` 純函式於 1ms 內完成，嚴禁在 Stage 2 呼叫 LLM。

## 3. Monorepo 目錄結構 (Nx + pnpm)
```text
intent-engineering-galaxy/
├── INTENT-SPEC-FINAL.md          # 終極技術規格書 (v1.0.0 Galaxy-First Edition)
├── HANDOVER.md                   # Claude App 階段性開發交接清單
├── CLAUDE.md                     # 本文件 (Claude 自動載入之專案上下文)
├── apps/
│   ├── cli/                      # npx 入口 (bin/intent-galaxy.mjs)：127.0.0.1 HTTP + Stdio MCP Server
│   ├── web/                      # 純正星系版 Web UI + Claude Code Mod 狀態列整合介面
│   ├── extension/                # Chrome Extension (MV3) — 注入 `🌌 iG` 膠囊與星系 Overlay
│   └── extension-firefox/        # Firefox Extension — 跨瀏覽器支援
└── libs/
    ├── protocol/                 # @intent-eng/protocol: Canonical Schema v1.0 型別定義
    ├── core/                     # @intent-eng/core: Anti-Slop Regex + Astra 44行 Bitmask 求解器
    └── epistemic/                # @intent-eng/epistemic: Master Spawner Prompt + NDJSON 串流切分器
```

## 4. 常用指令與驗證方式
- 執行核心單元測試（Node v24 原生 TypeScript）：`npm test`
- 啟動本機獨立星系伺服器（127.0.0.1）：`npm start`
- 註冊至 Claude Code MCP：`claude mcp add intent-galaxy -- node $(pwd)/apps/cli/bin/intent-galaxy.mjs`

## 5. 開發鐵律 (Hard Constraints for Claude)
1. **保持 0 Runtime Dependencies**：在 `apps/cli` 與 `libs/*` 中，優先使用 Node.js 22+ / Web 原生 API，不引入肥大的第三方 npm 套件。
2. **禁止破壞極性映射（Polarity Table）**：Q1~Q3 `exclude` 轉為 `MUST NOT`；Q4（波普爾證偽節點）被顯式 `exclude` 時代表「明示承擔風險 (`ACCEPTED RISK`)」，絕不可渲染為 `MUST NOT`。
3. **中文 IME 相容**：所有鍵盤快捷鍵攔截必須處理 `e.key === "Process"`，讀取 `e.code` 確保注音/倉頡輸入法開啟時 `h/j/k/l/i/x/s` 100% 可用。
