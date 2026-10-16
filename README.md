# Intent Galaxy 🌌

把一句模糊目標展開成「中心命題 + 4 位敵對專家 + 12 顆思緒節點」的星系圖。先發散看見盲區，再用鍵盤 1 分鐘收斂，
最後由**零 LLM 的純函式編譯器**產出確定性的 `LOCKED INTENT AST`，直接注入 Claude Code 或 AI 網頁的輸入框。

![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen) ![node](https://img.shields.io/badge/node-%E2%89%A5%2022.18-blue) ![license](https://img.shields.io/badge/license-Apache--2.0-blue)

| 先發散：12 顆節點與 ✦ 盲區，不畫連線 | 後收斂：按 `1` 點亮主幹，右側即時編譯 AST |
| --- | --- |
| ![星系首屏](https://raw.githubusercontent.com/stephen-taipei/intent-galaxy/main/docs/images/galaxy-diverge.png) | ![按 1 收斂](https://raw.githubusercontent.com/stephen-taipei/intent-galaxy/main/docs/images/galaxy-converge.png) |

| 形態 | 內容 | 狀態 |
| ---- | ---- | ---- |
| **CLI** | `npx @stephen.taipei/intent-galaxy`：127.0.0.1 星系伺服器，可選 Claude、Codex、Gemini、agy CLI 或 12 家 API 生成 | ✅ |
| **MCP** | Stdio MCP Server：`intent_spawner_prompt` → `intent_open_galaxy`，Claude Code、Codex、Gemini CLI、agy 都能掛 | ✅ |
| **Extension** | Chrome / Firefox：在 Claude、ChatGPT、Gemini、Grok、DeepSeek、Qwen、Perplexity、Copilot、Mistral、Kimi 輸入框旁加 `🌌 iG` 膠囊；直接請該網頁的 AI 生成星系，不需要本機伺服器 | ✅ |
| **Kill-gate** | `.intent.lock.json`（RFC 8785 JCS + SHA-256）與 14 天後的 commit 驗屍守門員 | ✅ |

## 快速開始

需求：Node ≥ 22.18。星系生成另需下表任一個 AI（已登入的 CLI，或設定好 API key）。

```bash
cd ~/code/some-repo
npx @stephen.taipei/intent-galaxy          # 開啟 http://127.0.0.1:4787，輸入一句目標按 Enter 生成星系
npx @stephen.taipei/intent-galaxy --port 4300 --no-open
npx @stephen.taipei/intent-galaxy --provider gemini           # 指定預設 AI；網頁右上角也能切換
```

- 只綁 `127.0.0.1`；每個請求檢查 Host（防 DNS rebinding）、POST 來源與路徑穿越。
- 網頁頂部可選 AI 與模型，偵測不到的選項會標出缺什麼（例如「請設定 OPENAI_API_KEY」）。Claude CLI 預設 Opus，約需 3–4 分鐘。
- API key 只從環境變數讀取，留在本機伺服器，不會送進瀏覽器。
- 按 Enter 鎖定時，在目前目錄寫入 `.intent.lock.json`。

### 支援的 AI

| 類型 | 供應商（`--provider`） | 需要 |
| --- | --- | --- |
| 本機 CLI（免 API key） | `claude` Claude Code、`codex` OpenAI Codex、`gemini` Gemini CLI、`agy` Antigravity | 已登入的 CLI 在 `PATH` 上 |
| API | `anthropic` Claude、`openai` GPT、`google` Gemini、`xai` Grok、`deepseek`、`mistral`、`qwen` 通義千問、`moonshot` Kimi、`groq`、`openrouter` | 對應的 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY`、`XAI_API_KEY`、`DEEPSEEK_API_KEY`、`MISTRAL_API_KEY`、`DASHSCOPE_API_KEY`、`MOONSHOT_API_KEY`、`GROQ_API_KEY`、`OPENROUTER_API_KEY` |
| 本機開源模型 | `ollama`（Llama、Qwen、Gemma…） | Ollama 在 `127.0.0.1:11434` 執行中 |
| 其他 | `custom` 任何 OpenAI 相容端點 | `INTENT_GALAXY_OPENAI_BASE_URL`（可選 `INTENT_GALAXY_OPENAI_API_KEY`） |

API 供應商的模型清單會即時向供應商查詢；也可用 `--model` 或 `INTENT_GALAXY_MODEL` 指定。CLI 以唯讀／規劃模式執行，不會改動檔案。

### 註冊為 MCP（Claude Code、Codex、Gemini CLI、agy）

```bash
claude mcp add intent-galaxy -- npx -y @stephen.taipei/intent-galaxy
codex mcp add intent-galaxy -- npx -y @stephen.taipei/intent-galaxy
gemini mcp add intent-galaxy npx -y @stephen.taipei/intent-galaxy
agy mcp add intent-galaxy npx -y @stephen.taipei/intent-galaxy
```

在對話裡請它「用 intent galaxy 分析這個目標」：宿主 AI 先呼叫 `intent_spawner_prompt` 取得規則，
自己產出 12 節點 JSON，再呼叫 `intent_open_galaxy`。瀏覽器自動開啟星系，你按 Enter 後 AST 會回到對話裡。這條路由宿主 AI 自己生成，不額外呼叫其他模型。

### 14 天被動打臉（kill-gate）

```bash
npx @stephen.taipei/intent-galaxy init-hook
```

把 `kill-gate.mjs` 複製到 `.intent/hooks/`，並掛上 `commit-msg`（已有 husky 就追加到 `.husky/commit-msg`；否則在 `core.hooksPath` 為空時設成 `.intent/hooks`）、
GitHub PR 檢查 `intent-kill` 與 Claude Code `SessionStart`。簽署後 14 天內完全沉默；到期後碰到 `scopePaths` 的 commit 必須附上：

```text
Intent-Lock: <specHash>
Intent-Kill: alive|dead|unobservable
Intent-Kill-Evidence: <至少 12 字：你看到的數，或你缺的那個數>
```

## 鍵盤流

| 按鍵 | 動作 |
| :--- | :--- |
| `1` `2` `3` | 套用 alpha / beta / gamma 策略卡（保留手動覆寫）；`Shift` + 數字清空覆寫 |
| `h` `j` `k` `l` | 依極座標半平面最近鄰移動焦點 |
| `g` + `f/d/l/p` + `1-3` | 直達象限節點（`g l 1` → N7） |
| `Space` / `i` | 採納（include） |
| `x` | 排除護欄；Q4 節點為「明示承擔風險」 |
| `0` / `n` | 本次忽略 |
| `c` / `r` | 跳到衝突節點 / 保留較新決定解除衝突 |
| `u` / `Ctrl+r` | 復原 / 重做 |
| `Enter` / `Esc` | 鎖定並注入 / 關閉面板 |

注音、倉頡等中文輸入法開啟時同樣可用（讀取 `e.code`）。

## 瀏覽器擴充功能

```bash
npm run build:ext    # 同步到 apps/extension 與 apps/extension-firefox，可直接「載入未封裝項目」
npm run pack:ext     # 另外產出 dist-ext/intent-galaxy-{chrome,firefox}-<version>.zip 供上架
```

在輸入框打一句你正在猶豫的事，點 `🌌 iG`（或工具列圖示、`Cmd/Ctrl+Shift+G`）：

- 本機 CLI 正在執行時，由它生成，對話裡不會出現提示詞。
- 否則請當前網頁的 AI 在對話中生成星系 JSON，回覆後自動畫出。推理型高階模型可能要 5–15 分鐘，可以先把面板縮小，完成時按鈕會顯示「✓ 星系完成」。
- 網站把長程式碼區塊收合而讀不到時，按「貼上 JSON」手動載入。
- 同一個對話重新打開面板（或重新整理頁面）會直接顯示已生成的星系。
- 面板可拖曳標題列移動、拖右下角縮放、雙擊標題列放大，並可調整透明度。
- 輸入框空白時提供兩個生活題型示範：挑洗碗機、酸甜又不負擔的食物。

## 開發

```bash
npm test             # libs 單元測試、CLI 整合測試、擴充功能同步、npm pack 端到端
npm start            # 直接從原始碼啟動（Node 執行期剝除 TypeScript 型別）
npm run build        # 產生 dist/（npm 套件內容；npm pack / publish 前會自動執行）
```

架構與資料結構以 [`INTENT-SPEC-FINAL.md`](INTENT-SPEC-FINAL.md) 為準。

## License

[Apache-2.0](LICENSE)
