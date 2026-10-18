// 內建示範星系（IntentAnalysisResponse v1.0）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "程式怎麼分層", D2: "主題差異怎麼寫", D3: "能客製到多深", D4: "主題設定怎麼組" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方看法：「${dims[dim]}」走完全相反的路`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定的是：每個品牌各自 fork 一份元件，還是所有品牌共用一套核心、只靠設定檔切換差異？",
    metric: "60 天內，新主題 2 天就能上線，每個主題的 CSS 小於 50KB",
  },
  quadrants: {
    Q1: { scar: "共用元件裡塞滿各品牌的 if", sacred: "core 裡不寫品牌判斷" },
    Q2: { scar: "100 多個主題一個個手動改版面", sacred: "讓型別檢查擋下錯誤" },
    Q3: { scar: "照抄別人的設計系統，抽象過頭", sacred: "結構能整塊替換" },
    Q4: { scar: "親眼看過三次客製化失控", sacred: "分層界線守得住" },
  },
  nodes: {
    N1: node("D1", 0, 2, "元件分成三層", "把元件分成三層：只放邏輯的 core、負責串接的 view、放主題樣式的 leaf；core 不准 import 主題 ID 或路由", "14 天內 core 裡出現判斷主題的程式碼，就算失敗", null),
    N2: node("D2", 0, 1, "主題只改 CSS 變數", "主題之間的差異全部用 CSS 變數（custom properties）來寫，元件和版型裡完全不寫主題判斷", "做到第 3 個主題時就得改元件，就算失敗", "版型的差異光換顏色做不到"),
    N3: node("D1", 1, 0, "只載入當前主題 CSS", "執行時只載入目前主題的那一支 stylesheet，不把所有主題都打包進第一次載入的頁面", "14 天內有任一主題的 CSS 超過 50KB，就算失敗", null),
    N4: node("D4", 0, 2, "主題設定檔加型別", "每個主題都提供一份完整的 TypeScript 設定物件，少填任何欄位就編譯不過", "新增主題時還是得改共用元件，就算失敗", null),
    N5: node("D3", 2, 0, "每個品牌 fork 元件", "每個主題複製一份元件資料夾各自修改，品牌之間互不影響", "做到第 10 個主題後，修一個 bug 要改超過 10 個地方，就算失敗", "修一個 bug，每份複本都要改"),
    N6: node("D3", 1, 2, "新主題先開給少數人", "新主題先用 feature flag 只開給 5% 的租戶用一週，錯誤率達標才開給所有人", "試用這週的錯誤率超過 1%，就算失敗", null),
    N7: node("D3", 2, 1, "版型整組替換外殼", "像汽車共用底盤、只換車殼：版型可以整組替換，底下共用的 view 和 core 不動", "換版型時得改 core，就算失敗", "不同版型之間的操作方式會不一致",
      { lateral: { src: "汽車: 共用底盤", dist: 2, drop: "每款車重新開模" } }),
    N8: node("D2", 1, 0, "版型只開固定插槽", "像樂高積木只能接在凸點上：版型先定好固定插槽，主題只能往插槽裡放元件，插槽以外的結構不准改", "插槽以外的 DOM 只要被改過 1 次，就算失敗", null,
      { lateral: { src: "玩具: 樂高積木", dist: 3, drop: "隨意改 DOM" } }),
    N9: node("D4", 2, 0, "只寫跟預設不同處", "像同一套字型的粗體、細體都從同一份字形變出來：主題只寫跟 default 主題不同的地方，其餘欄位自動沿用", "繼承超過 3 層，就算失敗", null,
      { lateral: { src: "字型設計: 粗細字重", dist: 4, drop: "每個主題整份複製" } }),
    N10: node("D2", 2, 0, "設定欄位要設上限", "如果每個客製需求都加一個設定欄位，維護設定檔的成本遲早會超過直接 fork", "任何一個設定介面超過 40 個欄位，就不再加欄位", "設定多到沒人看得懂",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象化的成本比複製程式碼還高" } }),
    N11: node("D4", 1, 0, "業務不能繞過分層", "如果業務可以直接要求在共用元件裡加品牌判斷，分層界線一季內就會守不住", "14 天內共用元件只要多出 1 個品牌判斷，這個方案就作廢", "為了趕交期犧牲分層界線",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "趕上交期有功，破壞界線沒人罰" } }),
    N12: node("D3", 0, 1, "不一次重寫全部模組", "如果要等 70 個模組全部搬完才上線，前面投入越多越捨不得停，重構很容易卡在一半", "14 天內第一個模組還沒上線，就停手", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "一次全部重寫，拖垮交期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用一套型別設定，和每個品牌各自 fork 元件，只能二選一" },
    { type: "excludes", from: "N1", to: "N5", why: "三層共用核心和每個品牌複製一份元件，只能二選一" },
    { type: "excludes", from: "N4", to: "N11", why: "型別設定在編譯時就擋下繞路，再加人工審查分層就是重複把關" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 變數，就不會整組替換版型元件" },
    { type: "excludes", from: "N2", to: "N10", why: "只用 CSS 變數就沒有設定欄位會變多，兩者擇一" },
    { type: "excludes", from: "N9", to: "N11", why: "繼承允許局部覆寫，和「一次都不准繞過分層」的護欄衝突" },
    { type: "requires", from: "N1", to: "N8", why: "分成三層後，主題只能透過固定插槽客製，不然 view 會被改得亂七八糟" },
    { type: "requires", from: "N4", to: "N10", why: "型別設定檔一定要限制欄位數量，不然會多到沒人看得懂" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重構工時", v: "不能快速 fork", t: "60 天先搭好架構", l: "要寫完整的測試", x: "品牌不能走特例捷徑" },
      fatal: "N10", thesis: "元件分三層、主題用型別設定檔，每個主題只剩一份設定", title: "設定驅動·三層邊界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "版型能做的變化有限", v: "設計自由度低", t: "每週改一點", l: "複雜版型做不到", x: "不能改版面結構" },
      fatal: "N12", thesis: "只用 CSS 變數和繼承，新主題先開給少數人再逐步放大", title: "只改樣式·逐步上線",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重複的程式碼", v: "修 bug 要改很多處", t: "最快上線", l: "主題越多維護越貴", x: "放棄型別設定" },
      fatal: "N11", thesis: "版型整組替換，每個品牌各自 fork 外殼", title: "品牌各自 fork·共用底盤",
    },
  },
  recommend: { key: "alpha", why: "主題超過 100 個時，只有靠設定檔驅動，維護成本才壓得住" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主題都繼承同一個 default 主題", kill: "default 一改壞，所有主題的版面一起壞", label: "全靠 default 主題" },
};
