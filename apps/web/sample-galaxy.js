// 內建示範星系（IntentAnalysisResponse v1.0）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "首屏渲染", D2: "運算位置", D3: "遷移幅度", D4: "資源與驗收" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方主張 ${dims[dim]} 走另一極`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定的是：在舊 SPA 上瘦身，還是遷到 Next.js 換長期速度？",
    metric: "30 天內行動版首頁 LCP 從 4.2s 降到 2.5s",
  },
  quadrants: {
    Q1: { scar: "曾為 2MB bundle 苦撐三年", sacred: "首屏零等待" },
    Q2: { scar: "重寫半年後專案被砍", sacred: "每週可上線" },
    Q3: { scar: "照抄大廠架構拖垮小團隊", sacred: "非對稱槓桿" },
    Q4: { scar: "驗過 30 次失敗重寫", sacred: "真實用戶數據" },
  },
  nodes: {
    N1: node("D1", 0, 2, "首頁改建置期預渲染", "首頁改用建置期預渲染輸出靜態 HTML，首屏不必等 JS 下載執行", "14天行動版LCP未破2.5s則錯", null),
    N2: node("D2", 0, 1, "全站純靜態零伺服器", "只部署 CDN 靜態檔，圖片在 CI 建置期預轉 AVIF，執行期零伺服器運算", "建置時間>15分鐘則錯", "動態內容只能退回 CSR"),
    N3: node("D1", 1, 0, "第三方腳本砍到剩2支", "移除 A/B 測試、客服浮窗等第三方腳本，只留錯誤監控與 GA", "14天轉換率掉>5%則錯", null),
    N4: node("D4", 0, 2, "Hero圖即時縮圖", "Hero 圖改 AVIF 並由 CDN 依裝置寬度即時縮圖，LCP 圖片壓到 80KB 內", "14天LCP元素>80KB則錯", null),
    N5: node("D3", 2, 0, "首頁先遷 Next.js", "只把首頁遷到 Next.js App Router 做 SSR，其餘頁面留在舊 SPA", "8週內首頁未上線則錯", "雙框架並存維運"),
    N6: node("D3", 1, 2, "每週灰度5%看RUM", "每次改動先灰度 5% 流量一週，用 RUM 的 p75 LCP 決定是否全量", "灰度期INP惡化>20%則錯", null),
    N7: node("D3", 2, 1, "邊緣節點串流首屏", "[D2物流越庫] 邊緣節點先串流首屏 HTML，其餘區塊像越庫貨物到站即轉運", "邊緣TTFB>600ms則錯", "邊緣函式冷啟動",
      { lateral: { src: "物流: 越庫作業", dist: 2, drop: "整頁渲染完才送出" } }),
    N8: node("D2", 1, 0, "Islands 局部水合", "[D3中央廚房] 頁面切成 Islands，只有購物車、搜尋等互動區塊才 hydrate", "首頁hydrate JS>100KB則錯", null,
      { lateral: { src: "餐飲: 中央廚房備料", dist: 3, drop: "整頁 hydrate" } }),
    N9: node("D4", 2, 0, "捲動區塊 LOD 降級", "[D4遊戲LOD] 視窗外區塊先渲染低解析骨架，捲入視窗才換完整元件", "捲動掉幀>10%則錯", null,
      { lateral: { src: "遊戲: LOD 細節層級", dist: 4, drop: "一次全量渲染" } }),
    N10: node("D2", 2, 0, "禁即時轉檔費失控", "若全站圖片即時轉檔且不設快取，7天內 CDN 轉檔帳單必暴增", "單日轉檔費>$50即熔斷", "轉檔費用暗增",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "效能收益被 CDN 帳單吃掉" } }),
    N11: node("D4", 1, 0, "禁為秒數犧牲畫質", "若 KPI 只綁 LCP 秒數，團隊必把 Hero 圖壓到糊，設計與品牌方必反彈", "14天設計驗收退件>3次即作廢", "設計方否決權",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "指標壓過真實體驗" } }),
    N12: node("D3", 0, 1, "禁先蓋效能平台", "若先花 6 週自建效能監控平台才動手改，沉沒成本必拖過 30 天期限", "14天內LCP未動即停建平台", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "工具投入綁架目標" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "舊 SPA 自建圖片管線與 Next.js 內建 next/image 兩套擇一" },
    { type: "excludes", from: "N1", to: "N5", why: "同一個首頁不會同時做 SPA 預渲染與 Next.js SSR" },
    { type: "excludes", from: "N4", to: "N11", why: "壓到 80KB 的 Hero 圖必然觸發畫質護欄" },
    { type: "excludes", from: "N2", to: "N7", why: "純靜態零伺服器與邊緣串流需要執行期運算互斥" },
    { type: "excludes", from: "N2", to: "N10", why: "建置期預轉圖片沒有即時轉檔費可熔斷，兩者擇一" },
    { type: "excludes", from: "N9", to: "N11", why: "低解析骨架與畫質護欄互斥" },
    { type: "requires", from: "N1", to: "N8", why: "預渲染頁面若整頁 hydrate 會抵銷效益，必須搭配 Islands" },
    { type: "requires", from: "N4", to: "N10", why: "即時縮圖必須設轉檔費熔斷" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "放棄框架升級", v: "技術債續存", t: "30天衝刺", l: "建置流程變複雜", x: "無 SSR 紅利" },
      fatal: "N10", thesis: "首頁預渲染加局部水合，不重寫壓 LCP", title: "預渲染·Islands 瘦身",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "動態功能受限", v: "建置時間變長", t: "每週小步", l: "CSR 區塊仍慢", x: "無邊緣運算" },
      fatal: "N12", thesis: "零伺服器純靜態，捲動區塊 LOD 延後", title: "純靜態·LOD 漸進上線",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "8週遷移工時", v: "雙框架並存", t: "一季才見效", l: "新架構學習", x: "放棄舊 SPA 優化" },
      fatal: "N11", thesis: "首頁先遷 Next 邊緣串流，守住畫質", title: "首頁遷 Next·邊緣串流",
    },
  },
  recommend: { key: "alpha", why: "不重寫也能 30 天壓到 2.5s，轉檔費熔斷兜底" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "首屏資源依賴單一 CDN 供應商", kill: "CDN 區域故障1小時即作廢", label: "CDN 單點" },
};
