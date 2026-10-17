// 內建示範星系（IntentAnalysisResponse v1.0，香港繁中版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "分層邊界", D2: "差異表達", D3: "客製幅度", D4: "主題組成" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方主張 ${dims[dim]} 走另一極`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ZH_HANT_HK = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定的是：每個品牌各自 fork 一套元件，定係用設定驅動一套共用核心？",
    metric: "60 日內新主題 ≤2 日上線，單一主題 CSS <50KB",
  },
  quadrants: {
    Q1: { scar: "共用元件塞滿品牌 if", sacred: "core 零分支" },
    Q2: { scar: "100+ 個主題逐個手動對版", sacred: "靠型別擋錯" },
    Q3: { scar: "照抄設計系統，抽象過頭", sacred: "結構可替換" },
    Q4: { scar: "見過三次客製失控", sacred: "邊界唔失守" },
  },
  nodes: {
    N1: node("D1", 0, 2, "三層切分核心", "元件拆成純 core、負責協調嘅 view、主題 leaf 三層，core 禁止 import 主題 ID 同路由", "14日內 core 出現主題判斷即錯", null),
    N2: node("D2", 0, 1, "主題只改 CSS 變數", "所有主題差異只用 CSS custom properties 表達，元件同版型零分支", "第3個主題已經要改元件即錯", "版型差異唔可以只靠顏色"),
    N3: node("D1", 1, 0, "主題 CSS 按需載入", "執行時只載入當前主題嗰一支 stylesheet，唔會將全部主題打包入首屏", "14日內單一主題 CSS >50KB 即錯", null),
    N4: node("D4", 0, 2, "型別化主題設定檔", "每個主題提供完整 TypeScript 設定物件，缺任何一個欄位就編譯失敗", "新主題仍然要改共用元件即錯", null),
    N5: node("D3", 2, 0, "每個品牌 fork 元件", "每個主題複製一份元件目錄各自修改，品牌之間互不影響", "第10個主題後修 bug 要改 >10 處即錯", "修一個 bug 要改 N 份"),
    N6: node("D3", 1, 2, "用旗標灰度上主題", "新主題先用 feature flag 開俾 5% 租戶試一星期，錯誤率達標先全量", "灰度期錯誤率 >1% 即錯", null),
    N7: node("D3", 2, 1, "版型成組換外殼", "[D2 汽車平台化] 版型好似車殼可以成組替換，共用底盤 view 同 core 唔郁", "換版型要改 core 即錯", "版型之間互動唔一致",
      { lateral: { src: "汽車: 平台化底盤", dist: 2, drop: "每款車重新開模" } }),
    N8: node("D2", 1, 0, "版型固定槽位插件", "[D3 LEGO 積木] 版型宣告固定槽位，主題只可以喺槽位插元件，禁止改槽位以外嘅結構", "槽位外 DOM 被改 >0 次即錯", null,
      { lateral: { src: "玩具: LEGO 積木介面", dist: 3, drop: "自由客製 DOM" } }),
    N9: node("D4", 2, 0, "主題差異繼承鏈", "[D4 字型家族] 主題只宣告同 default 嘅差異，其餘欄位自動繼承", "繼承超過3層即錯", null,
      { lateral: { src: "字體設計: 字重家族", dist: 4, drop: "每個主題完整複製" } }),
    N10: node("D2", 2, 0, "禁設定欄位無限膨脹", "若每個客製需求都加一個設定欄位，設定檔嘅維護成本必定高過直接 fork", "單一設定介面 >40 欄即停止加欄位", "設定地獄",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象成本高過重複成本" } }),
    N11: node("D4", 1, 0, "禁業務繞過主題邊界", "若業務可以直接要求喺共用元件加品牌判斷，邊界一季內必定失守", "14日內共用元件新增品牌判斷 >0 即作廢", "為趕交期犧牲邊界",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "趕交期反而獎勵破壞邊界" } }),
    N12: node("D3", 0, 1, "禁一次過重構全部模組", "若要先一次過遷移全部 70 個模組先上線，沉沒成本必定令重構半途停擺", "14日內首個模組未上線即停", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "大爆炸式重構綁架交期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用型別設定同各品牌 fork 元件，兩條路只可以揀一條" },
    { type: "excludes", from: "N1", to: "N5", why: "三層共用核心同每個品牌複製元件互相排斥" },
    { type: "excludes", from: "N4", to: "N11", why: "型別設定已經喺編譯期擋住繞路，人手邊界審查變成重複關卡" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 變數，就唔會成組替換版型元件" },
    { type: "excludes", from: "N2", to: "N10", why: "純 CSS 變數冇設定欄位可以膨脹，兩者擇一" },
    { type: "excludes", from: "N9", to: "N11", why: "繼承鏈容許局部覆寫，同零繞路護欄衝突" },
    { type: "requires", from: "N1", to: "N8", why: "三層切分之後，主題一定要經固定槽位客製，否則 view 會被改穿" },
    { type: "requires", from: "N4", to: "N10", why: "型別設定檔一定要設欄位上限，否則會膨脹成設定地獄" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重構工時", v: "放棄快速 fork", t: "60日搭好骨架", l: "要寫完整性測試", x: "冇品牌特例捷徑" },
      fatal: "N10", thesis: "三層邊界加型別設定，主題縮成一片葉子", title: "設定驅動·三層邊界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "版型差異受限", v: "設計自由度低", t: "每星期行一小步", l: "複雜版型做唔到", x: "冇結構客製" },
      fatal: "N12", thesis: "只用 CSS 變數同繼承，灰度逐步上主題", title: "純樣式·繼承漸進",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重複程式碼", v: "修 bug 要改多處", t: "最快上線", l: "維護成本線性增長", x: "放棄型別設定" },
      fatal: "N11", thesis: "版型成組替換，品牌各自 fork 外殼", title: "品牌分支·底盤共用",
    },
  },
  recommend: { key: "alpha", why: "100+ 個主題之下，只有設定驅動先壓得住維護成本" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主題都繼承同一個 default 主題", kill: "default 一改壞，全部主題即刻破版", label: "default 單點" },
};
