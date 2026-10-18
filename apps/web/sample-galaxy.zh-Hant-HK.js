// 內建示範星系（IntentAnalysisResponse v1.0，香港繁中版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "程式點樣分層", D2: "主題差異點寫", D3: "可以客製幾深", D4: "主題設定點組合" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方睇法：「${dims[dim]}」行完全相反嘅路`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ZH_HANT_HK = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定嘅係：每個品牌各自 fork 一份元件，定係所有品牌共用一套核心、只靠設定檔切換差異？",
    metric: "60 日內，新主題 2 日就可以上線，每個主題嘅 CSS 細過 50KB",
  },
  quadrants: {
    Q1: { scar: "共用元件入面塞滿各品牌嘅 if", sacred: "core 入面唔寫品牌判斷" },
    Q2: { scar: "100 幾個主題逐個手動改版面", sacred: "等型別檢查擋住錯誤" },
    Q3: { scar: "照抄人哋嘅設計系統，抽象過頭", sacred: "結構可以成塊替換" },
    Q4: { scar: "親眼見過三次客製化失控", sacred: "分層界線守得住" },
  },
  nodes: {
    N1: node("D1", 0, 2, "元件分做三層", "將元件分做三層：只放邏輯嘅 core、負責串連嘅 view、放主題樣式嘅 leaf；core 唔准 import 主題 ID 或者路由", "14 日內 core 入面出現判斷主題嘅程式碼，就算失敗", null),
    N2: node("D2", 0, 1, "主題只改 CSS 變數", "主題之間嘅差異全部用 CSS 變數（custom properties）嚟寫，元件同版型入面完全唔寫主題判斷", "做到第 3 個主題就要改元件，就算失敗", "版型嘅差異淨係換顏色做唔到"),
    N3: node("D1", 1, 0, "只載入當前主題 CSS", "執行時只載入目前主題嗰一支 stylesheet，唔會將所有主題都打包入第一次載入嘅頁面", "14 日內有任何一個主題嘅 CSS 超過 50KB，就算失敗", null),
    N4: node("D4", 0, 2, "主題設定檔加型別", "每個主題都提供一份完整嘅 TypeScript 設定物件，漏填任何欄位就編譯唔過", "新增主題時仍然要改共用元件，就算失敗", null),
    N5: node("D3", 2, 0, "每個品牌 fork 元件", "每個主題複製一份元件資料夾各自修改，品牌之間互不影響", "做到第 10 個主題之後，修一個 bug 要改超過 10 個地方，就算失敗", "修一個 bug，每份複本都要改"),
    N6: node("D3", 1, 2, "新主題先開俾少數人", "新主題先用 feature flag 只開俾 5% 嘅租戶用一個星期，錯誤率達標先開俾所有人", "試用嗰個星期錯誤率超過 1%，就算失敗", null),
    N7: node("D3", 2, 1, "版型成組換外殼", "好似汽車共用底盤、只換車殼：版型可以成組替換，底下共用嘅 view 同 core 唔郁", "換版型時要改 core，就算失敗", "唔同版型之間嘅操作方式會唔一致",
      { lateral: { src: "汽車: 共用底盤", dist: 2, drop: "每款車重新開模" } }),
    N8: node("D2", 1, 0, "版型只開固定插槽", "好似 LEGO 積木只可以砌喺凸點上：版型先定好固定插槽，主題只可以喺插槽入面放元件，插槽以外嘅結構唔准改", "插槽以外嘅 DOM 只要被改過 1 次，就算失敗", null,
      { lateral: { src: "玩具: LEGO 積木", dist: 3, drop: "隨意改 DOM" } }),
    N9: node("D4", 2, 0, "只寫同預設唔同嘅地方", "好似同一套字型嘅粗體、幼體都由同一份字形變出嚟：主題只寫同 default 主題唔同嘅地方，其餘欄位自動沿用", "繼承超過 3 層，就算失敗", null,
      { lateral: { src: "字型設計: 粗幼字重", dist: 4, drop: "每個主題成份複製" } }),
    N10: node("D2", 2, 0, "設定欄位要設上限", "如果每個客製需求都加一個設定欄位，維護設定檔嘅成本遲早會高過直接 fork", "任何一個設定介面超過 40 個欄位，就唔再加欄位", "設定多到冇人睇得明",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象化嘅成本仲高過複製程式碼" } }),
    N11: node("D4", 1, 0, "業務唔可以繞過分層", "如果業務可以直接要求喺共用元件加品牌判斷，分層界線一季內就會守唔住", "14 日內共用元件只要多咗 1 個品牌判斷，呢個方案就作廢", "為咗趕交期犧牲分層界線",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "趕到交期有功，破壞界線冇人罰" } }),
    N12: node("D3", 0, 1, "唔好一次過重寫全部模組", "如果要等 70 個模組全部搬完先上線，前面投入越多越唔捨得停，重構好容易卡喺一半", "14 日內第一個模組仲未上線，就停手", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "一次過全部重寫，拖垮交期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用一套型別設定，同每個品牌各自 fork 元件，只可以二揀一" },
    { type: "excludes", from: "N1", to: "N5", why: "三層共用核心同每個品牌複製一份元件，只可以二揀一" },
    { type: "excludes", from: "N4", to: "N11", why: "型別設定喺編譯時已經擋住繞路，再加人手審查分層就係重複把關" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 變數，就唔會成組替換版型元件" },
    { type: "excludes", from: "N2", to: "N10", why: "只用 CSS 變數就冇設定欄位會變多，兩者揀一" },
    { type: "excludes", from: "N9", to: "N11", why: "繼承容許局部覆寫，同「一次都唔准繞過分層」嘅護欄衝突" },
    { type: "requires", from: "N1", to: "N8", why: "分做三層之後，主題只可以經固定插槽客製，唔係 view 會被改到亂晒" },
    { type: "requires", from: "N4", to: "N10", why: "型別設定檔一定要限制欄位數量，唔係會多到冇人睇得明" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重構工時", v: "唔可以快速 fork", t: "60 日先搭好架構", l: "要寫完整嘅測試", x: "品牌唔可以行特例捷徑" },
      fatal: "N10", thesis: "元件分三層、主題用型別設定檔，每個主題只剩一份設定", title: "設定驅動·三層邊界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "版型可以做嘅變化有限", v: "設計自由度低", t: "每個星期改少少", l: "複雜版型做唔到", x: "唔可以改版面結構" },
      fatal: "N12", thesis: "只用 CSS 變數同繼承，新主題先開俾少數人再逐步擴大", title: "只改樣式·逐步上線",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重複嘅程式碼", v: "修 bug 要改好多處", t: "最快上線", l: "主題越多維護越貴", x: "放棄型別設定" },
      fatal: "N11", thesis: "版型成組替換，每個品牌各自 fork 外殼", title: "品牌各自 fork·共用底盤",
    },
  },
  recommend: { key: "alpha", why: "主題超過 100 個嘅時候，只有靠設定檔驅動，維護成本先壓得住" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主題都繼承同一個 default 主題", kill: "default 一改壞，所有主題嘅版面一齊壞", label: "全靠 default 主題" },
};
