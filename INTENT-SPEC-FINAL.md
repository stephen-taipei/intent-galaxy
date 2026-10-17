# INTENT-SPEC-FINAL (v1.0.0 — Galaxy-First Edition)：意圖工程與視覺化星系決策框架終極規格書

- **版本狀態**：v1.0.0-GALAXY-FINAL (Master Arbitrated & Aligned with Founder Vision)
- **核心定位**：以用戶目標為中心、環繞四維極端專家視角的「1 分鐘視覺化星系對齊 UI」+「零 LLM 純函式意圖編譯器」+「高精度解決方案生成引擎」
- **設計哲學**：先發散（一眼看穿四周專家展開的未知盲區），後收斂（點選 3 選 1 主幹 + 跨象限節點混音），最終一鍵產出無懈可擊的解決方案。

---

## 1. 核心互動閉環與視覺降噪規範 (The 60-Second Galaxy-First Workflow)

### 1.1 五步「先發散、後收斂」星系互動流
1. **[00s - 05s] 中心命題輸入 (Center Goal Input)**：
   - 用戶輸入一句模糊目標，置於畫面正中央的「星系核心圓環」。
   - 0ms 本地立即繪出中心圓環與四周 4 個專家象限的骨架（Ghost Slots）。
2. **[05s - 15s] 星系發散與盲區顯影 (Galaxy Divergence — 首屏直接展開)**：
   - 隨 NDJSON 串流到達，中心圓環顯示改寫後的「唯一核心決策句」，四周同時點亮 4 位立場天生敵對的領域專家原型與 12 顆原子思緒節點（每象限 3 顆，每顆 <= 12~15 字）。
   - **視覺降噪鐵律（Anti-Spaghetti Rule）**：首屏 12 顆節點全數可見（供用戶進行發散掃描與發現盲區，其中 blind !== null 的盲區節點帶有高亮星芒標記），但初始狀態下（未選 3 選 1 前）不繪製任何節點間的交錯連線，確保畫面乾淨、零視覺壓迫。
3. **[15s - 30s] 3 選 1 主幹收斂 (Archetype Convergence)**：
   - 畫面底部（或右側面板）並列呈現 3 張互斥的收斂策略卡（1/2/3）。
   - 每張卡濃縮為 3 行核心資訊：① 破局標題（內嵌跨界錨點，如「啟動暗池工單簿·終結過勞」）+ 距離徽章（◈D2/⬥D3/✦D4）、② 必然代價（sacrifice.rendered <= 40字）、③ 14天致死前提（fatal.kill <= 30字）。
   - 主 Agent 推薦卡（`recommend.key`）以金色外框與「★ 推薦」標記並附一行推薦理由（`recommend.why` <= 24字），但不自動套用，保留「先發散」由用戶親手選擇。
   - 右側面板以人類可讀的分組卡片呈現收斂結果（✅ 要做 / 🛡 護欄 / ⛔ 不做 / ⚠ 承擔風險 / 💸 代價，每項顯示節點標題與一句說明）；實際注入的 `LOCKED INTENT AST` 原文收在「原始 AST」切換檢視。
   - 當用戶點擊任一策略卡（或按數字鍵 1 / 2 / 3）時：星系圖瞬間點亮該策略所採納的 4~6 顆節點，並沿象限外側固定軌道繪製能量連線匯聚至中心主幹；其餘未選中的 neutral 節點自動退為 40% 透明度背景（不畫連線）。
4. **[30s - 50s] 跨專家節點混音與矛盾合成 (Node Remix & TRIZ Collision)**：
   - 用戶在已點亮的主幹基礎上，看中其他專家象限的某顆節點時，可直接點擊或透過鍵盤流（h/j/k/l 導航，Space/I 納入、X 設為反義護欄/承擔風險、0/N 忽略）進行自由混音。
   - **零延遲衝突檢測與雙向破局**：若同時勾選互斥節點，底層 Bitmask 求解器於 1ms 內標示衝突並提供兩條路徑：按 r 鍵（200ms 內自動退讓較舊決定），或按 s 鍵（觸發 TRIZ 矛盾碰撞合成器，於 2 秒內生成第三種破局節點 N_SYNTH 替換衝突雙方）。
5. **[50s - 60s] 意圖編譯與最終方案生成 (Intent Compilation & Solution Generation)**：
   - 用戶按下 Enter，純函式編譯器（compileIntent）立即將當前星系拓撲編譯為確定性的 CompiledIntentSpec。
   - **雙模輸出路由（Dual-Output Routing）**：
     - **Route A（預設：AI 重新產出最終解決方案）**：系統直接以編譯後之 CompiledIntentSpec 作為強約束 System Prompt，當場串流產出融合多維專家視野、跨界機制且避開所有致命盲區的最終完整解決方案。
     - **Route B（工程與 Agent 協作模式）**：透過 @intent-eng/mcp 或 CLI 匯出不可變契約 .intent.lock.json 與 Cursor Rules (.cursor/rules/intent.mdc)，直接驅動 Claude Code / Sub-Agents 施工。

---

## 2. Nx Monorepo 套件架構與職責 (@intent-eng/*)

```text
packages/
  protocol/        # @intent-eng/protocol: 零依賴 Wire Types、JSON Schema (Draft 2020-12)、RFC 8785 JCS 雜湊
  core/            # @intent-eng/core: 純 TS 驗證修復管線 (V1-V20)、Anti-Slop Regex、Bitmask 求解器與 compileIntent()
  epistemic/       # @intent-eng/epistemic: Master Spawner Prompt、TRIZ 合成 Prompt、IntentNdjsonSplitter、方案生成器
  galaxy-layout/   # @intent-eng/galaxy-layout: 純 TS 極座標扇形佈局表、外軌道連線分流路徑、h/j/k/l 最近鄰導航表
  galaxy-state/    # @intent-eng/galaxy-state: Angular 20+ Zoneless Signals 狀態機 (IntentStore)、Undo/Redo、IME-Safe Keymap
  galaxy-ui/       # @intent-eng/galaxy-ui: SVG 軌道連線層 + HTML <button> 節點層、底部 3 選 1 策略卡塢、方案預覽抽屜
  adapters/        # @intent-eng/adapters: Claude Code Hooks、Cursor .mdc 產生器、Git Worktree 綁定器
  mcp/             # @intent-eng/mcp: Stdio MCP Server + 127.0.0.1 同源 Galaxy Web 託管服務 + CLI
```

---

## 3. Stage 1：精簡去重版 Canonical Schema v1.0 & Master Prompt (@intent-eng/epistemic)

### 3.1 TypeScript Wire Schema (IntentAnalysisResponse)

```typescript
export type QuadrantKey = "Q1" | "Q2" | "Q3" | "Q4";
export type NodeId = "N1"|"N2"|"N3"|"N4"|"N5"|"N6"|"N7"|"N8"|"N9"|"N10"|"N11"|"N12";
export type Q4NodeId = "N10" | "N11" | "N12";
export type DimId = "D1" | "D2" | "D3" | "D4";
export type AssumptionId = "A1" | "A2" | "A3" | "A4";
export type Cause = "final" | "formal" | "efficient" | "material";
export type Score = -2 | -1 | 0 | 1 | 2;
export type Cell = 0 | 1 | 2;
export type LateralDistance = 1 | 2 | 3 | 4;
export type AttackClass = "sunk_cost" | "unit_economics" | "dark_incentive" | "single_point_failure";

export interface IntentAnalysisResponse {
  schema_version: "1.0";
  _scratchpad: {
    terms: string[];
    scarce: [string, string];
    assumptions: Array<{ id: AssumptionId; cause: Cause; pred: string }>;
    dims: [Dim, Dim, Dim, Dim];
    fn_sig: string;
  };
  core: { decision: string; metric: string };
  quadrants: { Q1: Persona; Q2: Persona; Q3: Persona; Q4: Persona };
  nodes: {
    N1: PlainNode; N2: PlainNode; N3: PlainNode;
    N4: PlainNode; N5: PlainNode; N6: PlainNode;
    N7: LateralNode; N8: LateralNode; N9: LateralNode;
    N10: FalsifierNode; N11: FalsifierNode; N12: FalsifierNode;
  };
  edges: Edge[];
  archetypes: { alpha: Archetype; beta?: Archetype; gamma?: Archetype };
  recommend: { key: "alpha" | "beta" | "gamma"; why: string };
  withheld_kill: { attack: AttackClass; hits: AssumptionId; claim: string; kill: string; label: string };
}

export interface Dim { id: DimId; name: string; values: [string, string, string] }
export interface Persona { scar: string; sacred: string }

export interface BaseNodeFields {
  dim: DimId;
  cell: Cell;
  inverse_cell: Cell;
  inverse_pos: string;
  claim: string;
  kill: string;
  blind: string | null;
  scores: { i: Score; v: Score; r: Score };
  label: string;
}

export type PlainNode = BaseNodeFields;
export interface LateralNode extends BaseNodeFields {
  lateral: { src: string; dist: LateralDistance; drop: string };
}
export interface FalsifierNode extends BaseNodeFields {
  falsifier: { attack: AttackClass; hits: AssumptionId; wound: string };
}
export interface Edge { type: "excludes" | "requires" | "before"; from: NodeId; to: NodeId; why: string }

export interface Archetype {
  include: NodeId[];
  exclude: NodeId[];
  sacrifice: { nodes: NodeId[]; p: string; v: string; t: string; l: string; x: string };
  fatal: Q4NodeId;
  thesis: string;
  title: string;
}
```

### 3.2 Master Spawner System Prompt v1.0

```text
You are INTENT-SPAWNER. You never answer the user's goal directly. You expand its multi-dimensional cognitive galaxy and expose the hidden trade-offs.
Output one JSON object matching the schema. No text outside JSON.

R0 LANGUAGE  Every string in the user's language. Caps are in CJK chars (字); for Latin scripts, 1 word = 2 字.
R1 ORDER     Fill fields strictly in schema order. A field may use only fields already written. Never revise.
R2 CONCRETE  Every claim = transitive verb + named mechanism or number + what it rules out. No middle-ground compromise.
R3 INVERSION First pick inverse_cell (!== cell in the same dim), write inverse_pos defending that alternative, then write claim containing dims[dim].values[cell] and a number or input term.
R4 BANNED    提升 加強 優化 完善 打造 賦能 整合 全面 有效 相關 確保 推動 強化 深化 落實 兼顧 平衡 增強 改善 提高 促進 可能面臨 需要注意 有一定風險 需要權衡 建議評估 視情況而定 或許 潛在 挑戰 取決於 適當 合理 長期 未來 逐步 and any comparative 更 without a baseline number.

S0 _scratchpad: terms (3-8 from input), scarce (2 resources, >=1 not in terms), assumptions (A1-A4 with Aristotle cause and 若 X，則 T 內 Y), dims (D1-D4, 3 distinct concrete values each), fn_sig (verb｜flow｜constraints｜failure mode).
S1 core: decision (你真正在決定的是： + core trade-off, <=35字), metric (one number + deadline, <=30字; no fee or exclusion clauses).
S2 quadrants: Four scarred experts surrounding the user. Q1 Zero-Resetter, Q2 Bloodied Veteran, Q3 Border-Crosser, Q4 Coroner. scar <=16字, sacred <=8字.
S3 nodes (N1-3 Q1, N4-6 Q2, N7-9 Q3, N10-12 Q4):
- Q3 writes lateral FIRST (src Domain: Mechanism, dist 1..4 with >=2 distinct and >=1 dist>=2, drop).
- Q4 writes falsifier FIRST (attack from sunk_cost|unit_economics|dark_incentive|single_point_failure, all 3 distinct; hits; wound).
- Q4 kill <=30字 = self-contained 14-day observable failure condition (若 P 為假，14天內觀測到 O 即作廢).
- label <=15字 written last: plain everyday words the user would say (verb + object). No invented idioms, metaphors or classical phrasing.
- blind: non-null on at most 3 nodes (what the user's input never mentions); null elsewhere.
S4 edges: excludes, requires, before. >=4 of 6 quadrant pairs must share an excludes edge.
S5 archetypes (alpha=impact, beta=velocity, gamma=resilience):
- include 4-6 nodes (no internal excludes, requires-closed, >=1 Q3 dist>=2, >=1 Q4).
- exclude 0-3 nodes, each sharing an excludes edge with an included node. Nodes not chosen stay neutral; do not list them.
- sacrifice written in the world where the card SUCCEEDS (no 若/如果): nodes (N1..N9), p, v, t, l, x (each <=12字).
- fatal = included Q4 node welded to card.
- thesis <=24字, title <=14字 matching Verb+CrossDomainAnchor+Outcome.
S6 recommend: key = the archetype you would pick to hit core.metric, why <=24字 citing the metric or a scarce resource.
S7 withheld_kill: the 4th attack class not used in N10-12.
```

---

## 4. Stage 2：星系狀態機、統一 Bitmask 編譯器與方案生成 (@intent-eng/core & galaxy-*)

### 4.1 統一 Bitmask + L0–L3 優先權求解核心 (compileIntent)

```typescript
export type Stance = "include" | "exclude" | "neutral";
export type Model = Readonly<{ version: string; feasibleVersion: string; validated: true; ids: readonly string[]; feasibleMasks: readonly number[] }>;
export type Input = Readonly<{ model: Model; base: readonly Stance[]; overrides: ReadonlyMap<number, Stance> }>;
export type L3 = Readonly<{ id: string; stance: Stance }>;
export type Result =
  | Readonly<{ status: "STALE_MODEL" | "INVALID_INPUT" | "BASE_UNSAT"; preconditions: string }>
  | Readonly<{ status: "L3_UNSAT"; core: readonly L3[]; preconditions: string }>
  | Readonly<{ status: "SAT"; chosenMask: number; forcedIn: readonly string[]; forcedOut: readonly string[]; droppedDefaults: readonly string[]; pending: readonly string[]; explicitL3: readonly L3[]; modelVersion: string }>;

const PRE = "CALLER_VALIDATES_INPUTS_AND_COMPLETE_CNF_BUDGET_BEFORE_MODEL_STABLE_ID_ORDER";
const pop = (x: number): number => x.toString(2).replaceAll("0", "").length;
const fits = (ms: readonly number[], es: readonly (readonly [number, Stance])[]): number[] =>
  ms.filter(mask => es.every(([i, s]) => Boolean(mask & (1 << i)) === (s === "include")));

export function compileIntent({ model: m, base, overrides }: Input): Result {
  const n = m.ids.length, all = (1 << n) - 1, preconditions = PRE;
  const invalid = !m.validated || n > 12 || base.length !== n ||
    m.ids.some((id, i) => !id || (i > 0 && id <= m.ids[i - 1])) ||
    base.some(s => !["include", "exclude", "neutral"].includes(s)) ||
    [...overrides].some(([i, s]) => !Number.isInteger(i) || i < 0 || i >= n || !["include", "exclude", "neutral"].includes(s)) ||
    m.feasibleMasks.some(x => !Number.isInteger(x) || x < 0 || x > all) ||
    new Set(m.feasibleMasks).size !== m.feasibleMasks.length;
  if (invalid) return { status: "INVALID_INPUT", preconditions };
  if (m.version !== m.feasibleVersion) return { status: "STALE_MODEL", preconditions };
  if (!m.feasibleMasks.length) return { status: "BASE_UNSAT", preconditions };
  const l3 = [...overrides].sort(([a], [b]) => a - b), compatible = fits(m.feasibleMasks, l3);
  if (!compatible.length) {
    let core = l3.slice(), i = 0;
    while (i < core.length) {
      const next = core.filter((_, j) => j !== i);
      if (!fits(m.feasibleMasks, next).length) core = next; else i++;
    }
    return { status: "L3_UNSAT", core: core.map(([i, stance]) => ({ id: m.ids[i], stance })), preconditions };
  }
  const and = compatible.reduce((a, x) => a & x, all), or = compatible.reduce((a, x) => a | x, 0);
  const score = (x: number): number =>
    base.reduce((s, d, i) => s + (!overrides.has(i) && d !== "neutral" && (Boolean(x & (1 << i)) === (d === "include")) ? 1 : 0), 0);
  let chosenMask = 0, bestScore = -1, bestCount = n + 1;
  for (const candidate of compatible) {
    const candidateScore = score(candidate), candidateCount = pop(candidate);
    if (candidateScore > bestScore || (candidateScore === bestScore && (candidateCount < bestCount || (candidateCount === bestCount && candidate < chosenMask)))) {
      chosenMask = candidate; bestScore = candidateScore; bestCount = candidateCount;
    }
  }
  const explicitL3 = l3.map(([i, stance]) => ({ id: m.ids[i], stance }));
  return {
    status: "SAT", chosenMask,
    forcedIn: m.ids.filter((_, i) => Boolean(and & (1 << i))),
    forcedOut: m.ids.filter((_, i) => !Boolean(or & (1 << i))),
    droppedDefaults: m.ids.filter((_, i) => !overrides.has(i) && base[i] !== "neutral" && (Boolean(chosenMask & (1 << i)) !== (base[i] === "include"))),
    pending: m.ids.filter((_, i) => Boolean(chosenMask & (1 << i)) && base[i] !== "include" && overrides.get(i) !== "include"),
    explicitL3, modelVersion: m.version,
  };
}
```

---

## 5. 全鍵盤流協議與操作規範

| 按鍵 | 動作定義 |
| :--- | :--- |
| 1 / 2 / 3 | 套用 alpha / beta / gamma 收斂主幹卡（星系圖即時點亮對應主幹軌道連線，並保留個人手動覆寫） |
| Shift+1/2/3 | 套用 alpha / beta / gamma 收斂主幹卡，並清空所有個人手動覆寫 |
| h j k l | 依預計算之極座標半平面最近鄰在 12 顆星系節點間高速移動焦點 |
| g + [f/d/l/p][1-3] | Hint 模式直達任意象限節點（如 g l 1 直達跨界象限第 1 顆節點 N7） |
| Space / i | 將聚焦節點切換為 ✓ 採納 (include)（釘選為 L3 硬指令） |
| x | 將聚焦節點切換為 ⊖ 排除護欄 / 承擔風險 (exclude) |
| 0 / n | 將聚焦節點設為 ○ 本次忽略 (neutral/omit) |
| c / r | c 跳至紅線衝突節點；r 於 200ms 內自動保留較新決定解除衝突 |
| s | 當處於互斥衝突時，呼叫 TRIZ 碰撞合成器（2 秒內生成第三破局節點 N_SYNTH 替換衝突雙方） |
| u / Ctrl+r | Undo / Redo 星系決策快照 |
| Enter | 鎖定星系意圖，立即產出最終解決方案（並同步寫入 .intent.lock.json） |
