// 內建示範星系（IntentAnalysisResponse v1.0）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "分層邊界", D2: "差異表達", D3: "客製幅度", D4: "主題組成" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方主張 ${dims[dim]} 走另一極`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定的是：每個品牌各自 fork 元件，還是用設定驅動一套共用核心？",
    metric: "60 天內新主題上線 ≤2 天，單主題 CSS <50KB",
  },
  quadrants: {
    Q1: { scar: "共用元件塞滿品牌 if", sacred: "core 零分支" },
    Q2: { scar: "100+ 主題逐一手動對版", sacred: "型別擋錯" },
    Q3: { scar: "照抄設計系統過度抽象", sacred: "可替換結構" },
    Q4: { scar: "驗過三次客製失控", sacred: "邊界不失守" },
  },
  nodes: {
    N1: node("D1", 0, 2, "三層切分核心", "元件拆成純 core、協調 view、主題 leaf 三層，core 禁止 import 主題 ID 與路由", "14天內core出現主題判斷則錯", null),
    N2: node("D2", 0, 1, "主題只改 CSS 變數", "所有主題差異只用 CSS custom properties 表達，元件與版型零分支", "第3個主題就需改元件則錯", "版型差異無法只靠顏色"),
    N3: node("D1", 1, 0, "主題 CSS 按需載入", "執行期只載入當前主題一支 stylesheet，不把全部主題打包進首屏", "14天單主題CSS>50KB則錯", null),
    N4: node("D4", 0, 2, "型別化主題設定檔", "每個主題提供完整 TypeScript 設定物件，缺任何欄位就編譯失敗", "新主題仍需改共用元件則錯", null),
    N5: node("D3", 2, 0, "每個品牌 fork 元件", "每個主題複製一份元件目錄各自修改，品牌之間互不影響", "第10個主題後修bug需改>10處則錯", "修一個 bug 要改 N 份"),
    N6: node("D3", 1, 2, "旗標灰度上主題", "新主題先用 feature flag 開給 5% 租戶一週，錯誤率達標才全量", "灰度期錯誤率>1%則錯", null),
    N7: node("D3", 2, 1, "版型整組替換外殼", "[D2汽車平台化] 版型像車殼可整組替換，共用底盤 view 與 core 不動", "換版型需改core則錯", "版型間互動不一致",
      { lateral: { src: "汽車: 平台化底盤", dist: 2, drop: "每款車重新開模" } }),
    N8: node("D2", 1, 0, "版型固定槽位插件", "[D3樂高積木] 版型宣告固定槽位，主題只能往槽位插元件，禁改槽位外結構", "槽位外DOM被改>0次則錯", null,
      { lateral: { src: "玩具: 樂高積木介面", dist: 3, drop: "自由客製 DOM" } }),
    N9: node("D4", 2, 0, "主題差異繼承鏈", "[D4字型家族] 主題只宣告與 default 的差異，其餘欄位自動繼承", "繼承超過3層則錯", null,
      { lateral: { src: "字體設計: 字重家族", dist: 4, drop: "每主題完整複製" } }),
    N10: node("D2", 2, 0, "禁設定欄位無限膨脹", "若每個客製需求都加一個設定欄位，設定檔維護成本必高過直接 fork", "單一設定介面>40欄即停增欄位", "設定地獄",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象成本高過重複成本" } }),
    N11: node("D4", 1, 0, "禁業務繞過主題邊界", "若業務可直接要求在共用元件加品牌判斷，邊界必在一季內失守", "14天共用元件新增品牌判斷>0即作廢", "交期壓力換邊界",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "趕交期獎勵破壞邊界" } }),
    N12: node("D3", 0, 1, "禁一次重構全部模組", "若先一次遷移全部 70 個模組才上線，沉沒成本必讓重構半途停擺", "14天內首個模組未上線即停", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "大爆炸重構綁架交期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用型別設定與各品牌 fork 元件兩條路擇一" },
    { type: "excludes", from: "N1", to: "N5", why: "三層共用核心與每品牌複製元件互斥" },
    { type: "excludes", from: "N4", to: "N11", why: "型別設定已在編譯期擋繞路，人工邊界審查變成重複關卡" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 變數就不會整組替換版型元件" },
    { type: "excludes", from: "N2", to: "N10", why: "純 CSS 變數沒有設定欄位可膨脹，兩者擇一" },
    { type: "excludes", from: "N9", to: "N11", why: "繼承鏈允許局部覆寫，與零繞路護欄衝突" },
    { type: "requires", from: "N1", to: "N8", why: "三層切分後主題必須透過固定槽位客製，否則 view 會被改穿" },
    { type: "requires", from: "N4", to: "N10", why: "型別設定檔必須設欄位上限，否則膨脹成設定地獄" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重構工時", v: "放棄快速 fork", t: "60天建骨架", l: "要寫完整性測試", x: "無品牌特例捷徑" },
      fatal: "N10", thesis: "三層邊界加型別設定，主題縮成一片葉子", title: "設定驅動·三層邊界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "版型差異受限", v: "設計自由度低", t: "每週小步", l: "複雜版型做不到", x: "無結構客製" },
      fatal: "N12", thesis: "只用 CSS 變數與繼承，灰度逐步上主題", title: "純樣式·繼承漸進",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重複程式碼", v: "修bug改多處", t: "最快上線", l: "維護成本線性長", x: "放棄型別設定" },
      fatal: "N11", thesis: "版型整組替換，品牌各自 fork 外殼", title: "品牌分支·底盤共用",
    },
  },
  recommend: { key: "alpha", why: "100+ 主題下只有設定驅動壓得住維護成本" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主題都繼承同一個 default 主題", kill: "default 改壞即全主題破版", label: "default 單點" },
};
