# Intent Engineering Galaxy 🌌

把一句模糊目標展開成「中心命題 + 4 位敵對專家 + 12 顆思緒節點」的星系圖。先發散看見盲區，再用鍵盤 1 分鐘收斂，
最後由**零 LLM 的純函式編譯器**產出確定性的 `LOCKED INTENT AST`，直接注入 Claude Code 或 AI 網頁的輸入框。

![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen) ![node](https://img.shields.io/badge/node-%E2%89%A5%2022.18-blue) ![license](https://img.shields.io/badge/license-Apache--2.0-blue)

<!-- 截圖 / 動圖位：星系首屏、按 1/2/3 點亮主幹、Enter 注入輸入框 -->

| 形態 | 內容 | 狀態 |
| ---- | ---- | ---- |
| **CLI** | `npx intent-engineering-galaxy`：127.0.0.1 星系伺服器 + `claude -p` 串流生成 | ✅ |
| **MCP** | Stdio MCP Server：`intent_spawner_prompt` → `intent_open_galaxy`，Enter 後把 AST 回傳給 Claude | ✅ |
| **Extension** | Chrome / Firefox：在 Claude、ChatGPT、Grok、Gemini 輸入框旁加 `🌌 iG` 膠囊 | ✅ |
| **Kill-gate** | `.intent.lock.json`（RFC 8785 JCS + SHA-256）與 14 天後的 commit 驗屍守門員 | ✅ |

## 快速開始

需求：Node ≥ 22.18。星系生成另需已登入的 [Claude Code](https://code.claude.com) CLI（`claude`）。

```bash
cd ~/code/some-repo
npx intent-engineering-galaxy          # 開啟 http://127.0.0.1:4787，輸入一句目標按 Enter 生成星系
npx intent-engineering-galaxy --port 4300 --no-open
```

- 只綁 `127.0.0.1`；每個請求檢查 Host（防 DNS rebinding）、POST 來源與路徑穿越。
- 生成走本機 `claude -p` 訂閱制 CLI，不需要 API key。預設模型 Opus，約需 3–4 分鐘（大部分是模型思考，畫面會顯示思考 tokens）。
- 按 Enter 鎖定時，在目前目錄寫入 `.intent.lock.json`。

### 註冊為 Claude Code MCP

```bash
claude mcp add intent-galaxy -- npx -y intent-engineering-galaxy
```

在 Claude Code 裡請它「用 intent galaxy 分析這個目標」：宿主 Claude 先呼叫 `intent_spawner_prompt` 取得規則，
自己產出 12 節點 JSON，再呼叫 `intent_open_galaxy`。瀏覽器自動開啟星系，你按 Enter 後 AST 會回到對話裡。這條路不額外呼叫 `claude -p`。

### 14 天被動打臉（kill-gate）

```bash
npx intent-engineering-galaxy init-hook
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

點 `🌌 iG` 或按 `Cmd/Ctrl+Shift+G`，在輸入框上方展開星系面板。若本機 CLI 正在執行，會用輸入框內容即時生成；否則顯示示範星系。

## 開發

```bash
npm test             # libs 單元測試、CLI 整合測試、擴充功能同步、npm pack 端到端
npm start            # 直接從原始碼啟動（Node 執行期剝除 TypeScript 型別）
npm run build        # 產生 dist/（npm 套件內容；npm pack / publish 前會自動執行）
```

架構與資料結構以 [`INTENT-SPEC-FINAL.md`](INTENT-SPEC-FINAL.md) 為準；開發交接見 [`HANDOVER.md`](HANDOVER.md)。

## License

[Apache-2.0](LICENSE)
