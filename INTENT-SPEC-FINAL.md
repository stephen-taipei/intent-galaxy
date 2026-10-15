# INTENT-SPEC-FINAL (v1.0.0)：意圖工程與決策契約編譯器終極定案規格書

- **版本狀態**：v1.0.0-FINAL (3-Round Multi-Agent Convergence & Master Arbitrated)
- **前置演進**：`v0.1.0-alpha` -> `v0.2.0-alpha (V2)` -> `v0.3.0-rc1 (V3)` -> `v1.0.0-FINAL`
- **架構定錨**：人類元認知鎖定協議（Human Metacognitive Lock）+ 雙層漸進式決策 UI + 零 LLM 純函式 Bitmask 編譯器 + 14 天被動打臉閉環

---

## 1. 總軍師終極裁決與核心不變量 (Master Arbitrations & Architectural Invariants)

### 1.1 視覺、字數帳本與鍵盤路由封閉規範 (Luna / Grok / Sonnet / Muse 終極對齊)
1. **Tier 1 首屏零節點斷言（Zero-Node DOM Guarantee）**：
   - 進入 `decide` 階段時，`viewTier` 預設為 `"cards"`。畫面僅存在 4 項元素：唯一核心決策句、1~3 張互斥策略卡、1 個明示簽署 Checkbox、與編譯按鈕（`Enter`）。
   - 在 `viewTier === "cards"` 下，按數字鍵 `1/2/3` 僅改變選中卡片之高亮邊框與下方 Checkbox 動態綁定文案，**嚴禁掛載或渲染任何星系節點**，強制滿足 DOM 不變量：`document.querySelectorAll("[data-node-id]").length === 0`。
   - **零版面位移（Zero Layout Shift）**：三張策略卡、Checkbox 容器與編譯按鈕採用固定 CSS Grid 幾何尺寸（預留最大字數高度 `min-height`），切換 `1/2/3` 時各容器之 Bounding Box 座標偏移量必須為 `0px`。
2. **Tier 1 策略卡三行對齊與 84 字算術封頂（Arithmetic Seal）**：
   - 牌序依隨機種子打亂（寫入 session log），禁止將 `velocity` 固定於中間。六槽位明細、軸名、角色名、節點 ID 與 `withheld_kill` 均留於 JSON，不上牌面。
   - 每張策略卡嚴格只渲染 **3 列**（以 Unicode Grapheme Clusters 計數，標點計入，右上角 2 字元距離徽章 `◈D2 / ⬥D3 / ✦D4` 獨立定位不計入內文字數）：
     - **第 1 列（破局行動，<= 14 字）**：`title`，強制符合跨界寄生語法 `/^(?<verb>[\u4e00-\u9fa5]{1,4})(?<anchor>.{2,6})[·・:：-](?<outcome>.{2,6})$/u`（內嵌 Q3 跨界節點錨點）。
     - **第 2 列（必然代價，<= 40 字）**：`sacrifice.rendered`，描述「當此策略成功運作時你必然失去的東西」，嚴禁出現條件詞「若/如果/萬一」。
     - **第 3 列（14天致死前提，<= 30 字）**：焊上牌面之 Q4 節點 `kill`（「若 P 為假，14 天內觀測到 O 即作廢」之合併單句，上限 30 字）。
     - **總字數硬上限**：單卡內文嚴格 `14 + 40 + 30 = 84 字`，三卡合計 `<= 252 字`。
3. **唯一鍵盤路由（消滅 `Tab` 雙重定義）**：
   - `Tab` / `Shift+Tab`：在 `viewTier === "cards"` 下，**永遠僅作為標準 WCAG 焦點移動**（依序巡覽：策略卡區 -> 簽署 Checkbox -> 編譯按鈕），**絕不觸發進入 Tier 2 星系圖**。
   - `g` 鍵（或方向鍵 `h/j/k/l`）：為進入 Tier 2（`viewTier = "galaxy"`）之明確快捷鍵。按下後掛載節點並將焦點移至主幹首顆節點 `entryNodeId`（首鍵僅展開視圖，不盲改狀態）。按 `Esc` 從 `"galaxy"` 收合回 `"cards"` 並恢復原選中卡片焦點。
4. **雙時鐘分離（Dual-Clock Accounting）**：
   - `generationMs = paintedAt - submittedAt`（涵蓋 Stage 1 串流、全域驗證修復至 `done` 事件完成卡片渲染，獨立量測 P50/P95）。
   - `decisionMs = lockWrittenAt - paintedAt`（人類閱讀與決策時鐘，Tier 1 快速路徑目標中位數 `<= 45 秒`；嚴禁倒數計時或超時自動簽署，符合 WCAG 2.2 SC 2.2.1）。

### 1.2 統一 Bitmask 求解、顯式 neutral 與 Q4 多風險簽署 (Astra / Opus / Sonnet 終極對齊)
1. **權威指令與語意分離**：
   - `explicitDirectives: ReadonlyMap<NodeId, { stance: Stance; seq: number }>` 完整保存用戶每一次顯式操作（與 base 同值之操作亦保留為 L3 硬指令，僅 `clearDirective` 或 `resetToPreset` 可移除）。
   - **顯式 `L3:neutral` vs. 未操作 `L0:neutral`**：用戶顯式將節點設為 `neutral`（按 `N/0`）時，屬於 L3 硬指令，固定該位元於本次決策為 `bit = 0`（語意為 `omit`，不被 `requires` 靜默補完；若被其他 `L3:include` 依賴則回報 `L3_UNSAT`）。未操作之 `L0:neutral` 則不加硬限制，允許被依賴補完為 `forcedIn`。
   - **背景無解分流（`BASE_UNSAT`）**：若預枚舉之背景可行表 $K_M = \varnothing$，立即回報 `BASE_UNSAT`（或 `NO_FEASIBLE_OPTION`），絕不歸咎於用戶 L3 指令。
2. **Q4 證偽節點之極性與全量風險簽署綁定**：
   - Q4 位元 $x_G = 1$ 代表啟用監控/熔斷（進 `guardrails`）；$x_G = 0$ 若來自未選取或推導（`forcedOut`），一律進 `omittedNodeIds`，**嚴禁自動轉為 `acceptedRisks`**。
   - 若用戶對任一 Q4 節點（含非牌面預設之 N10~N12）執行顯式 `L3:exclude`，該節點將列入待確認之 `pendingAcceptedRisks`。下方簽署 Checkbox 的動態文案與 `ackToken` **必須同時列出並綁定所有待接受之 Q4 風險條款 ID、完整命題與 `specHash`**；任一風險條款未獲明示勾選前，不得輸出具授權效力之 `acceptedRisks`。
3. **TRIZ 合成節點（`N_SYNTH`）之 8 步 CAS 原子切換**：
   - 按 `s` 鍵觸發合成時，請求綁定來源版本 `{ analysisHash, stateRevision }`。每當模型、`baseId`、`explicitDirectives` 或簽署狀態變更時，`stateRevision` 單調遞增。
   - 接受合成節點 $C$ 替換衝突對 $(A, B)$ 時：將 A、B 之舊 L3 指令移入歷史稽核並退役；建立 11 個活躍變數（$(N1..N12 \setminus \{A,B\}) \cup \{N\_SYNTH\}$）之新模型快照 $M'$ 與專屬索引；重新枚舉 $2^{11}=2048$ 可行表 $K_{M'}$；重算 `analysisHash` 與 `specHash`；最後比對 `currentRevision === sourceRevision` 以 Compare-and-Swap 原子提交並清除舊簽署。若期間狀態已變則拒絕提交。

---

## 2. Stage 1：精簡去重版 Canonical Schema v1.0 & Master Prompt (`@intent-eng/epistemic`)

### 2.1 TypeScript Wire Schema (`IntentAnalysisResponse`)

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
  archetypes: {
    alpha: Archetype;
    beta?: Archetype;
    gamma?: Archetype;
  };
  withheld_kill: {
    attack: AttackClass;
    hits: AssumptionId;
    claim: string;
    kill: string;
    label: string;
    why_withheld: string;
    time_to_death: string;
    specific_wound: string;
    who_hopes_you_dismiss: string;
  };
}

export interface Dim { id: DimId; name: string; values: [string, string, string] }
export interface Persona { scar: string; sacred: string }

export interface BaseNodeFields {
  dim: DimId;
  cell: Cell;
  inverse_cell: Cell;    // 必須 !== cell，錨定同一維度另一合法選項 (V15)
  inverse_pos: string;   // <= 20 字：為何理性專家會選 inverse_cell（必須包含該維度值字串）
  claim: string;         // <= 24 字（Q4 <= 30 字）：必須含 dims[dim].values[cell] 及數字或原話名詞 (V16)
  kill: string;          // <= 16 字（Q4 <= 30 字，14天內外人可查核之失敗判準）
  blind: string | null;
  scores: { i: Score; v: Score; r: Score };
  label: string;         // <= 15 Graphemes，最後生成
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
  sacrifice: {
    nodes: NodeId[];     // 屬於 N1..N9，且與 include 存在 excludes 邊
    p: string; v: string; t: string; l: string; x: string;
  };
  fatal: Q4NodeId;       // 必須 ∈ include
  thesis: string;        // <= 24 字（留存於 JSON 供編譯與展開，不上 Tier 1 三行牌面）
  title: string;         // <= 14 字：動詞+跨界實體錨點·結果
}
```

### 2.2 Master Spawner System Prompt v1.0 (Production Baseline)

```text
You are INTENT-SPAWNER. You never answer the user's goal. You expose the decision it hides.
Output one JSON object matching the schema. No text outside JSON.

R0 LANGUAGE  Every string in the user's language. Caps are in CJK chars (字); for Latin scripts, 1 word = 2 字.
R1 ORDER     Fill fields strictly in schema order. A field may use only fields already written. Never revise.
R2 CONCRETE  Every claim = transitive verb + named mechanism or number + what it rules out. No compromise options.
R3 INVERSION First pick inverse_cell (!== cell in the same dim), write inverse_pos defending that alternative, then write claim containing dims[dim].values[cell] and a number or input term.
R4 BANNED    提升 加強 優化 完善 打造 賦能 整合 全面 有效 相關 確保 推動 強化 深化 落實 兼顧 平衡 增強 改善 提高 促進 可能面臨 需要注意 有一定風險 需要權衡 建議評估 視情況而定 或許 潛在 挑戰 取決於 適當 合理 長期 未來 逐步 and any comparative "更" without a baseline number.

S0 _scratchpad: terms (3-8 from input), scarce (2 resources, >=1 not in terms), assumptions (A1-A4 with Aristotle cause and "若 X，則 T 內 Y"), dims (D1-D4, 3 distinct concrete values each), fn_sig ("verb｜flow｜constraints｜failure mode").
S1 core: decision ("你真正在決定的是：" + core trade-off, <=35字), metric (number + deadline).
S2 quadrants: Q1 Zero-Resetter, Q2 Bloodied Veteran, Q3 Border-Crosser, Q4 Coroner. scar <=16字, sacred <=8字.
S3 nodes (N1-3 Q1, N4-6 Q2, N7-9 Q3, N10-12 Q4):
- Q3 writes lateral FIRST (src, dist 1..4 with >=2 distinct and >=1 dist>=2, drop).
- Q4 writes falsifier FIRST (attack from sunk_cost|unit_economics|dark_incentive|single_point_failure, all 3 distinct; hits; wound).
- Q4 kill <=30字 = self-contained 14-day observable failure condition ("若 P 為假，14天內觀測到 O 即作廢").
- label <=15字 written last.
S4 edges: excludes, requires, before. >=4 of 6 quadrant pairs must share an excludes edge.
S5 archetypes (alpha=impact, beta=velocity, gamma=resilience):
- include 4-6 nodes (no internal excludes, requires-closed, >=1 Q3 dist>=2, >=1 Q4).
- sacrifice written in the world where the card SUCCEEDS (no "若/如果"): nodes (N1..N9), p, v, t, l, x (each <=12字).
- fatal = included Q4 node welded to card.
- title <=14字 matching Verb+CrossDomainAnchor+Outcome.
S6 withheld_kill: the 4th attack class not used in N10-12. Sealed for 14-day audit.
```

### 2.3 封箱版 Anti-Slop Regex (`@intent-eng/core/src/lint/slop.ts`)

```typescript
export const SLOP_BLOCK: RegExp[] = [
  /提升|加強|完善|打造|賦能|全面(?!屏)|推動|深化|落實|兼顧/u,
  /優化(?!器)/u,
  /(?<!持續)整合(?!測試)/u,
  /有效(?!期|載荷|負載)/u,
  /相關(?!係數|性分析)/u,
  /確保/u,
  /強化(?!學習)/u,
  /(?<!負載)平衡(?!器)/u,
  /增強|改善|改進|提高|促進|助力|擁抱|把握|做好|做大|做強(?!化)/u,
  /構建|建構(?!子)/u,
  /可能面臨|需要注意|有一定風險|需要權衡|建議評估|視情況而定|或許/u,
  /潛在(?!客戶)/u,
  /挑戰(?![-–者])/u,
  /取決於|也許|大概|適當|適度|合理(?!化)|一定程度|某種程度|盡量|儘量|酌情|必要時|不排除/u,
  /更(?!新|換|改|正|迭|替)/u,
];

export const SLOP_TIME: RegExp[] = [
  /長期|短期|中期|不久|日後|將來|總有一天|適時|逐步/u,
  /未來(?!\s*\d)/u,
  /持續(?!整合|部署|交付)/u,
];

export const SLOP_WARN: RegExp[] = [
  /抓手|拉通|打通|沉澱|復盤|賽道|底層邏輯|方法論|顆粒度|體系化|系統性|全鏈路|全方位|一站式|降本增效|數位(化)?轉型|戰略|格局|勢能|心智/u,
  /閉環(?!控制)/u,
  /協同(?!過濾|編輯)/u,
  /多維度|多面向|多角度/u,
  /生態(?!學|池|系統監控)/u,
  /(?<!記憶體|位元組|byte\s?)對齊/u,
  /綜合|整體(?!論)/u,
  /\b(leverage|synerg(y|ies|istic)|holistic|seamless(ly)?|streamline|enhance|empower|unlock|foster|cultivate|facilitate|delve|navigate|landscape|tapestry|robust(ness)?|scalable|best[- ]in[- ]class|cutting[- ]edge|world[- ]class|next[- ]gen(eration)?|end[- ]to[- ]end|ecosystem|game[- ]chang(er|ing)|paradigm)\b/iu,
];
```

---

## 3. Stage 2：統一 Bitmask 求解核心與 NDJSON 切分器 (`@intent-eng/core` & `epistemic`)

### 3.1 Astra 44 行統一 Bitmask + L0–L3 優先權編譯核心（Normative Implementation）

```typescript
export type Stance = "include" | "exclude" | "neutral";
export type Model = Readonly<{ version: string; feasibleVersion: string; validated: true; ids: readonly string[]; feasibleMasks: readonly number[] }>;
export type Input = Readonly<{ model: Model; base: readonly Stance[]; overrides: ReadonlyMap<number, Stance> }>;
export type L3 = Readonly<{ id: string; stance: Stance }>;
export type Result = Readonly<{ status: "STALE_MODEL" | "INVALID_INPUT" | "BASE_UNSAT"; preconditions: string }> | Readonly<{ status: "L3_UNSAT"; core: readonly L3[]; preconditions: string }> | Readonly<{ status: "SAT"; phase: "DRAFT"; authorization: "REQUIRES_CONFIRMATION"; chosenMask: number; forcedIn: readonly string[]; forcedOut: readonly string[]; droppedDefaults: readonly string[]; pending: readonly string[]; explicitL3: readonly L3[]; modelVersion: string; preconditions: string }>;
const PRE = "CALLER_VALIDATES_INPUTS_AND_COMPLETE_CNF_BUDGET_BEFORE_MODEL_STABLE_ID_ORDER";
const pop = (x: number): number => x.toString(2).replaceAll("0", "").length;
const fits = (ms: readonly number[], es: readonly (readonly [number, Stance])[]): number[] => ms.filter(mask => es.every(([i, s]) => Boolean(mask & (1 << i)) === (s === "include")));
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
  const score = (x: number): number => base.reduce((s, d, i) => s + (!overrides.has(i) && d !== "neutral" && (Boolean(x & (1 << i)) === (d === "include")) ? 1 : 0), 0);
  let chosenMask = 0, bestScore = -1, bestCount = n + 1;
  for (const candidate of compatible) {
    const candidateScore = score(candidate), candidateCount = pop(candidate);
    if (candidateScore > bestScore || (candidateScore === bestScore && (candidateCount < bestCount || (candidateCount === bestCount && candidate < chosenMask)))) {
      chosenMask = candidate; bestScore = candidateScore; bestCount = candidateCount;
    }
  }
  const explicitL3 = l3.map(([i, stance]) => ({ id: m.ids[i], stance }));
  return { status: "SAT", phase: "DRAFT", authorization: "REQUIRES_CONFIRMATION", chosenMask,
    forcedIn: m.ids.filter((_, i) => Boolean(and & (1 << i))), forcedOut: m.ids.filter((_, i) => !Boolean(or & (1 << i))),
    droppedDefaults: m.ids.filter((_, i) => !overrides.has(i) && base[i] !== "neutral" && (Boolean(chosenMask & (1 << i)) !== (base[i] === "include"))),
    pending: m.ids.filter((_, i) => Boolean(chosenMask & (1 << i)) && base[i] !== "include" && overrides.get(i) !== "include"),
    explicitL3, modelVersion: m.version, preconditions };
}
```

---

## 4. 標準鎖檔 Schema 與 14 天被動打臉閉環 (`@intent-eng/protocol` & `hooks`)

### 4.1 `.intent.lock.json` Draft 2020-12 統一封閉 Schema (`0.3.0-rc1` / `1.0.0`)
`specHash = "sha256:" + lowercaseHex(SHA256(UTF8(JCS(payload))))`。`payload` 完整包含 Sol 之分形治理欄位與 Grok `kill-gate.mjs` 所需之 `decidedAt`、`auditDueAt`、`scopePaths`、`weldedKill` 與 `withheldKill`：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:intent-eng:schema:intent-lock:1.0.0",
  "title": "Intent Lock 1.0.0 Canonical Schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["specHash", "payload"],
  "properties": {
    "specHash": { "$ref": "#/$defs/hash" },
    "payload": { "$ref": "#/$defs/payload" }
  },
  "$defs": {
    "text": { "type": "string", "minLength": 1 },
    "id": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$" },
    "hash": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" },
    "isoUtc": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$" },
    "safeUint": { "type": "integer", "minimum": 0, "maximum": 9007199254740991 },
    "revision": { "type": "integer", "minimum": 1, "maximum": 9007199254740991 },
    "specRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["intentId", "revision", "specHash"],
      "properties": {
        "intentId": { "$ref": "#/$defs/id" },
        "revision": { "$ref": "#/$defs/revision" },
        "specHash": { "$ref": "#/$defs/hash" }
      }
    },
    "nodeRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["intentId", "analysisHash", "nodeId"],
      "properties": {
        "intentId": { "$ref": "#/$defs/id" },
        "analysisHash": { "$ref": "#/$defs/hash" },
        "nodeId": { "type": "string", "pattern": "^(N([1-9]|1[0-2])|N_SYNTH|withheldKill)$" }
      }
    },
    "scope": {
      "type": "object",
      "additionalProperties": false,
      "required": ["intentId", "appliesTo"],
      "properties": {
        "intentId": { "$ref": "#/$defs/id" },
        "appliesTo": { "enum": ["self", "subtree"] }
      }
    },
    "verification": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "verifierId", "verifierHash"],
      "properties": {
        "kind": { "enum": ["registered", "manual"] },
        "verifierId": { "$ref": "#/$defs/id" },
        "verifierHash": { "$ref": "#/$defs/hash" }
      }
    },
    "clause": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "statement", "scope", "sources", "inheritedFrom", "verification"],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "statement": { "$ref": "#/$defs/text" },
        "scope": { "$ref": "#/$defs/scope" },
        "sources": { "type": "array", "items": { "$ref": "#/$defs/nodeRef" }, "minItems": 1, "uniqueItems": true },
        "inheritedFrom": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/specRef" }] },
        "verification": { "$ref": "#/$defs/verification" }
      }
    },
    "guardrail": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "statement", "scope", "sources", "inheritedFrom", "verification", "metricIds", "onTrigger"],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "statement": { "$ref": "#/$defs/text" },
        "scope": { "$ref": "#/$defs/scope" },
        "sources": { "type": "array", "items": { "$ref": "#/$defs/nodeRef" }, "minItems": 1, "uniqueItems": true },
        "inheritedFrom": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/specRef" }] },
        "verification": { "$ref": "#/$defs/verification" },
        "metricIds": { "type": "array", "items": { "$ref": "#/$defs/id" }, "minItems": 1, "uniqueItems": true },
        "onTrigger": { "const": "block" }
      }
    },
    "risk": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "fatalPremise", "scope", "source", "acceptanceDecisionId", "mitigationPolicy"],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "fatalPremise": { "$ref": "#/$defs/text" },
        "scope": { "$ref": "#/$defs/scope" },
        "source": { "$ref": "#/$defs/nodeRef" },
        "acceptanceDecisionId": { "$ref": "#/$defs/id" },
        "mitigationPolicy": { "const": "not_prohibited" }
      }
    },
    "tradeOff": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "statement", "acceptanceDecisionId"],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "statement": { "$ref": "#/$defs/text" },
        "acceptanceDecisionId": { "$ref": "#/$defs/id" }
      }
    },
    "allocation": {
      "type": "object",
      "additionalProperties": false,
      "required": ["parentBudgetId", "allocationId", "allocationReceiptHash"],
      "properties": {
        "parentBudgetId": { "$ref": "#/$defs/id" },
        "allocationId": { "$ref": "#/$defs/id" },
        "allocationReceiptHash": { "$ref": "#/$defs/hash" }
      }
    },
    "budget": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "resourceId", "unit", "limit", "parentAllocation"],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "resourceId": { "$ref": "#/$defs/id" },
        "unit": { "$ref": "#/$defs/text" },
        "limit": { "$ref": "#/$defs/safeUint" },
        "parentAllocation": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/allocation" }] }
      }
    },
    "metric": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id", "ownerIntentId", "source", "assumptionId", "fatalPremise",
        "anchorDecisionId", "windowSeconds", "verifierId", "verifierHash",
        "dataSourceId", "metricKey", "unit", "aggregation", "triggerMode",
        "operator", "threshold", "minSamples", "minCoverage", "missingDataPolicy", "onTrigger"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "ownerIntentId": { "$ref": "#/$defs/id" },
        "source": { "$ref": "#/$defs/nodeRef" },
        "assumptionId": { "enum": ["A1", "A2", "A3", "A4"] },
        "fatalPremise": { "$ref": "#/$defs/text" },
        "anchorDecisionId": { "$ref": "#/$defs/id" },
        "windowSeconds": { "const": 1209600 },
        "verifierId": { "$ref": "#/$defs/id" },
        "verifierHash": { "$ref": "#/$defs/hash" },
        "dataSourceId": { "$ref": "#/$defs/id" },
        "metricKey": { "$ref": "#/$defs/id" },
        "unit": { "$ref": "#/$defs/text" },
        "aggregation": { "enum": ["snapshot", "sum", "mean", "count", "rate"] },
        "triggerMode": { "enum": ["any_observation", "window_aggregate"] },
        "operator": { "enum": ["lt", "lte", "eq", "gte", "gt"] },
        "threshold": { "type": "number" },
        "minSamples": { "$ref": "#/$defs/revision" },
        "minCoverage": { "type": "number", "minimum": 0, "maximum": 1 },
        "missingDataPolicy": { "const": "inconclusive" },
        "onTrigger": { "enum": ["review", "block"] }
      }
    },
    "weldedKill": {
      "type": "object",
      "additionalProperties": false,
      "required": ["falsifierId", "metricId", "fatalPremise", "killCondition14d"],
      "properties": {
        "falsifierId": { "enum": ["N10", "N11", "N12"] },
        "metricId": { "$ref": "#/$defs/id" },
        "fatalPremise": { "$ref": "#/$defs/text" },
        "killCondition14d": { "$ref": "#/$defs/text" }
      }
    },
    "withheld": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id", "ownerIntentId", "attackClass", "falsifiesAssumption", "label",
        "fatalPremise", "killCondition14d", "metricId", "whyWithheld",
        "timeToDeath", "specificWound", "whoHopesYouDismiss"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/id" },
        "ownerIntentId": { "$ref": "#/$defs/id" },
        "attackClass": { "enum": ["sunk_cost", "unit_economics", "dark_incentive", "single_point_failure"] },
        "falsifiesAssumption": { "enum": ["A1", "A2", "A3", "A4"] },
        "label": { "$ref": "#/$defs/text" },
        "fatalPremise": { "$ref": "#/$defs/text" },
        "killCondition14d": { "$ref": "#/$defs/text" },
        "metricId": { "$ref": "#/$defs/id" },
        "whyWithheld": { "$ref": "#/$defs/text" },
        "timeToDeath": { "$ref": "#/$defs/text" },
        "specificWound": { "$ref": "#/$defs/text" },
        "whoHopesYouDismiss": { "$ref": "#/$defs/text" }
      }
    },
    "payload": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "protocolVersion", "compilerVersion", "validationProfileHash",
        "intentId", "revision", "analysisHash", "decisionHash", "objective",
        "decidedAt", "auditDueAt", "scopePaths", "hookInstalled",
        "parentSpecHash", "parentIntentId", "parentRevision", "dependsOn",
        "mustHave", "mustNot", "guardrails", "acceptedRisks", "omittedNodeIds",
        "acceptedTradeOffs", "budgets", "killMetrics14d", "weldedKill", "withheldKill"
      ],
      "properties": {
        "protocolVersion": { "const": "1.0.0" },
        "compilerVersion": { "$ref": "#/$defs/text" },
        "validationProfileHash": { "$ref": "#/$defs/hash" },
        "intentId": { "$ref": "#/$defs/id" },
        "revision": { "$ref": "#/$defs/revision" },
        "analysisHash": { "$ref": "#/$defs/hash" },
        "decisionHash": { "$ref": "#/$defs/hash" },
        "objective": { "$ref": "#/$defs/text" },
        "decidedAt": { "$ref": "#/$defs/isoUtc" },
        "auditDueAt": { "$ref": "#/$defs/isoUtc" },
        "scopePaths": { "type": "array", "items": { "$ref": "#/$defs/text" }, "minItems": 1 },
        "hookInstalled": { "type": "boolean" },
        "parentSpecHash": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/hash" }] },
        "parentIntentId": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/id" }] },
        "parentRevision": { "anyOf": [{ "type": "null" }, { "$ref": "#/$defs/revision" }] },
        "dependsOn": { "type": "array", "items": { "$ref": "#/$defs/specRef" }, "minItems": 0, "uniqueItems": true },
        "mustHave": { "type": "array", "items": { "$ref": "#/$defs/clause" }, "minItems": 1, "uniqueItems": true },
        "mustNot": { "type": "array", "items": { "$ref": "#/$defs/clause" }, "minItems": 0, "uniqueItems": true },
        "guardrails": { "type": "array", "items": { "$ref": "#/$defs/guardrail" }, "minItems": 0, "uniqueItems": true },
        "acceptedRisks": { "type": "array", "items": { "$ref": "#/$defs/risk" }, "minItems": 0, "uniqueItems": true },
        "omittedNodeIds": { "type": "array", "items": { "$ref": "#/$defs/nodeRef" }, "minItems": 0, "uniqueItems": true },
        "acceptedTradeOffs": { "type": "array", "items": { "$ref": "#/$defs/tradeOff" }, "minItems": 1, "uniqueItems": true },
        "budgets": { "type": "array", "items": { "$ref": "#/$defs/budget" }, "minItems": 0, "uniqueItems": true },
        "killMetrics14d": { "type": "array", "items": { "$ref": "#/$defs/metric" }, "minItems": 1, "uniqueItems": true },
        "weldedKill": { "$ref": "#/$defs/weldedKill" },
        "withheldKill": { "$ref": "#/$defs/withheld" }
      }
    }
  }
}
```

### 4.2 觀測權威與 `kill-gate.mjs` 完整規範實作 (`.intent/hooks/kill-gate.mjs`)
- **Trailer 與 EvaluationReceipt 權威對齊**：若 `.intent/runs/` 下存在針對該 `specHash` 與 `weldedKill.metricId` 的有效 `EvaluationReceipt`，則 `Intent-Kill` trailer 之裁定必須與 Receipt 一致（`not_triggered <-> alive`, `triggered <-> dead`, `inconclusive <-> unobservable`），且 `Intent-Kill-Evidence` 須引用該 Receipt ID 或至少 12 個 Unicode code points 之觀測證據；若兩者矛盾，`kill-gate.mjs` 拒絕放行。
- **腳本讀取路徑**：自動支援讀取 `lock.payload ?? lock`，完美相容 `{ specHash, payload }` 封裝。

```javascript
#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const KILL_VERDICT = /^(alive|dead|unobservable)$/;
const WITHHELD_VERDICT = /^(card|withheld|other)$/;
const MIN_EVIDENCE = 12;
const mode = process.argv[2];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function tryGit(args) {
  try { return git(args); } catch { return null; }
}
function fail(message) {
  console.error(message);
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::error::${String(message).replaceAll("\n", "%0A")}`);
  }
  process.exit(1);
}
function chdirRepo() {
  process.chdir(git(["rev-parse", "--show-toplevel"]));
}
function gitPathExists(name) {
  const p = tryGit(["rev-parse", "--git-path", name]);
  return p ? existsSync(p) : false;
}
function inProgressGitOp() {
  return gitPathExists("MERGE_HEAD") || gitPathExists("CHERRY_PICK_HEAD") || gitPathExists("REBASE_HEAD");
}
function unwrapLock(raw) {
  try {
    const parsed = JSON.parse(raw);
    const p = parsed?.payload ?? parsed;
    if (!p || typeof p !== "object") return { ok: false, data: null };
    return { ok: true, data: { ...p, specHash: parsed.specHash ?? p.specHash } };
  } catch {
    return { ok: false, data: null };
  }
}
function readRev(rev) {
  const text = tryGit(["show", rev]);
  if (text == null) return { present: false, ok: true, data: null };
  const u = unwrapLock(text);
  return { present: true, ok: u.ok, data: u.data };
}
function readWorktree() {
  if (!existsSync(".intent.lock.json")) return { present: false, ok: true, data: null };
  const u = unwrapLock(readFileSync(".intent.lock.json", "utf8"));
  return { present: true, ok: u.ok, data: u.data };
}
function stagedNames() {
  return (tryGit(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]) ?? "").split("\n").filter(Boolean);
}
function lockDeletedInIndex() {
  const raw = tryGit(["diff", "--cached", "--name-status", "--find-renames"]) ?? "";
  for (const line of raw.split("\n")) {
    const parts = line.split("\t");
    if (parts[0] === "D" && parts[1] === ".intent.lock.json") return true;
    if (parts[0]?.startsWith("R") && parts[1] === ".intent.lock.json" && parts[2] !== ".intent.lock.json") return true;
  }
  return false;
}
function touchesScope(paths, scopePaths) {
  if (paths.length === 0) return false;
  if (!Array.isArray(scopePaths) || scopePaths.length === 0 || scopePaths.includes("*")) return true;
  return paths.some((file) => scopePaths.some((scope) => {
    if (file === scope) return true;
    const prefix = scope.endsWith("/") ? scope : `${scope}/`;
    return file.startsWith(prefix);
  }));
}
function parseTrailers(message) {
  const out = {};
  for (const raw of message.split(/\r?\n/)) {
    const match = raw.trim().match(/^(Intent-(?:Lock|Kill|Kill-Evidence|Withheld))\s*[:：]\s*(.+)$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}
function validKill(trailers, specHash) {
  return trailers["Intent-Lock"] === specHash
    && KILL_VERDICT.test(trailers["Intent-Kill"] ?? "")
    && [...(trailers["Intent-Kill-Evidence"] ?? "")].length >= MIN_EVIDENCE;
}
function findAttestation(specHash) {
  const raw = tryGit(["log", "-F", "--grep", specHash, "--format=%B%x1e"]);
  if (!raw) return null;
  let verdict = null, withheld = null;
  for (const message of raw.split("\u001e")) {
    const trailers = parseTrailers(message);
    if (trailers["Intent-Lock"] !== specHash) continue;
    if (validKill(trailers, specHash)) verdict = trailers["Intent-Kill"];
    if (WITHHELD_VERDICT.test(trailers["Intent-Withheld"] ?? "")) withheld = trailers["Intent-Withheld"];
  }
  return verdict ? { verdict, withheld } : null;
}
function dueState(lock) {
  const at = Date.parse(lock?.auditDueAt ?? "");
  if (Number.isNaN(at)) return "invalid";
  return Date.now() >= at ? "due" : "waiting";
}
function clockSlip(previous, next) {
  if (!previous || !next) return null;
  const prevD = Date.parse(previous.decidedAt ?? ""), nextD = Date.parse(next.decidedAt ?? "");
  if (Number.isNaN(prevD) || Number.isNaN(nextD)) return "decidedAt 無法解析";
  const hashChanged = previous.specHash !== next.specHash;
  const attested = findAttestation(previous.specHash);
  const ageMs = Date.now() - prevD;
  const decidedNow = Math.abs(Date.now() - nextD) <= 60 * 1000;
  const graceRestart = hashChanged && !attested && ageMs >= 0 && ageMs < 10 * 60 * 1000 && decidedNow;
  if (hashChanged && !attested && !graceRestart) return "舊契約還沒有 Intent-Kill，specHash 不能換（僅簽署後 10 分鐘內可換牌）。";
  if (!graceRestart && nextD > prevD && !attested) return "decidedAt 被往後搬，而舊契約還沒有 Intent-Kill";
  if (!hashChanged && Date.parse(next.auditDueAt) > Date.parse(previous.auditDueAt)) return "auditDueAt 被往後搬";
  return null;
}
function hitsGate(paths, scopePaths) {
  return paths.includes(".intent.lock.json") || touchesScope(paths, scopePaths);
}
function requireWeldedKill(lock) {
  if (!lock?.specHash || !lock?.weldedKill?.fatalPremise || !lock?.weldedKill?.killCondition14d) {
    return "鎖裡沒有 specHash 或 weldedKill。";
  }
  return null;
}
function banner(lock) {
  return [
    `14 天前你簽了這句：${lock.weldedKill.fatalPremise}`,
    `當時寫下、外人可查的指標：${lock.weldedKill.killCondition14d}`,
    "這次先停住。在 commit message 加上這三行再送：",
    `Intent-Lock: ${lock.specHash}`,
    "Intent-Kill: alive|dead|unobservable",
    "Intent-Kill-Evidence: （至少 12 字元之觀測數據或 EvaluationReceipt ID）"
  ].join("\n");
}
function withheldText(lock) {
  const w = lock.withheldKill ?? {};
  return [
    "牌上那一刀已經有結果。下面這刀當時沒放上牌面：",
    `${w.label ?? ""}：${w.fatalPremise ?? ""}`,
    `外人可查：${w.killCondition14d ?? ""}`,
    "下一次碰到這個範圍的 commit，加上這兩行：",
    `Intent-Lock: ${lock.specHash}`,
    "Intent-Withheld: card|withheld|other"
  ].join("\n");
}
chdirRepo();
if (mode === "session") {
  const lf = readWorktree();
  if (lf.present && lf.ok && dueState(lf.data) === "due" && !requireWeldedKill(lf.data)) {
    const found = findAttestation(lf.data.specHash);
    if (!found) process.stdout.write(`${banner(lf.data)}\n`);
    else if (found.verdict === "dead" && !found.withheld) process.stdout.write(`${withheldText(lf.data)}\n`);
  }
} else if (mode === "commit-msg") {
  if (!inProgressGitOp()) {
    const staged = stagedNames(), head = readRev("HEAD:.intent.lock.json");
    if (lockDeletedInIndex() && head.data && !findAttestation(head.data.specHash)) fail("未驗屍前不得刪除 .intent.lock.json");
    const index = staged.includes(".intent.lock.json") ? readRev(":.intent.lock.json") : { present: false, ok: true, data: null };
    const post = index.present ? index.data : head.data;
    if (post) {
      const slip = clockSlip(head.data, index.present ? index.data : null);
      if (slip) fail(slip);
      if (dueState(post) === "due") {
        const broken = requireWeldedKill(post);
        if (broken) fail(broken);
        const found = findAttestation(post.specHash);
        const trailers = parseTrailers(readFileSync(process.argv[3], "utf8"));
        if (found?.verdict === "dead" && !found.withheld && hitsGate(staged, post.scopePaths)) {
          if (!(trailers["Intent-Lock"] === post.specHash && WITHHELD_VERDICT.test(trailers["Intent-Withheld"] ?? ""))) fail(withheldText(post));
        } else if (!found && hitsGate(staged, post.scopePaths) && !validKill(trailers, post.specHash)) {
          fail(banner(post));
        }
      }
    }
  }
}
```
