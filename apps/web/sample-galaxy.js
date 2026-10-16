// 內建示範星系（IntentAnalysisResponse v1.0）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "獲客門檻", D2: "算力歸屬", D3: "營收模式", D4: "擴散機制" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方主張 ${dims[dim]} 走另一極`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY = {
  schema_version: "1.0",
  core: {
    decision: "你真正在決定的是：用病毒裂變換滲透，還是閉門高單價守毛利？",
    metric: "30 天內 1,000 名付費或活躍種子戶",
  },
  quadrants: {
    Q1: { scar: "曾因註冊流程流失七成", sacred: "零邊際獲客" },
    Q2: { scar: "燒光預算換來假活躍", sacred: "首週留存率" },
    Q3: { scar: "照抄同業被價格戰輾", sacred: "非對稱機制" },
    Q4: { scar: "驗過 40 具新創屍體", sacred: "14天現金流" },
  },
  nodes: {
    N1: node("D1", 0, 2, "砍註冊欄至2個免驗證", "砍註冊欄位至2個並免除信箱驗證，換取首日80%轉化", "14天假帳號率>15%則錯", null),
    N2: node("D2", 0, 1, "純本地端零算力體驗", "核心推論改跑瀏覽器WebGPU，伺服器算力成本歸零", "低階機跳出率>40%則錯", "邊緣端算力轉嫁"),
    N3: node("D1", 1, 0, "單一痛點極致單頁化", "砍掉所有儀表板只留60秒星系圖單頁，禁做多頁SaaS", "次週留存<25%則錯", null),
    N4: node("D4", 0, 2, "輸出圖帶雙邊額度浮水印", "匯出之架構圖強制附帶推薦連結，點擊雙邊贈50次額度", "14天K因子<0.4則錯", null),
    N5: node("D3", 2, 0, "百人閉門高單價預購制", "關閉免費註冊，僅開放100席年費創始會員預購", "7天內預購<20席則錯", "社交推銷羞恥感"),
    N6: node("D3", 1, 2, "開源核心引擎+雲端變現", "將@intent-eng/core開源衝GitHub Star，僅收費MCP雲端同步", "14天Star<500則錯", null),
    N7: node("D3", 2, 1, "暗池工單賞金撮合板", "[D2金融暗池] 高難度架構問題掛暗池賞金，吸引頂尖架構師解答", "無人掛單超過7天則錯", "雙邊流動性冷啟動",
      { lateral: { src: "金融: 暗池撮合", dist: 2, drop: "公開掛單簿" } }),
    N8: node("D2", 1, 0, "樹突哨兵雙信號過濾", "[D3免疫學] 本地正則初篩+模型二次確認才消耗API額度", "誤攔截率>10%則錯", null,
      { lateral: { src: "免疫學: 樹突細胞雙信號", dist: 3, drop: "單層關鍵字黑名單" } }),
    N9: node("D4", 2, 0, "公會賽季排行榜激勵", "[D4遊戲公會] 公開展示頂尖意圖模板與Fork次數排行榜", "分享率<5%則錯", null,
      { lateral: { src: "遊戲: 公會賽季", dist: 4, drop: "私人收藏夾" } }),
    N10: node("D2", 2, 0, "禁無風控免費算力裸奔", "若開放免費免驗證且無本地過濾，7天內必遭羊毛黨刷爆API破產", "單日API帳單>$200即熔斷", "羊毛黨算力擠兌",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "免費額度被批量帳號吃光" } }),
    N11: node("D4", 1, 0, "B2B用戶拒發廉價推銷碼", "若要求資深工程師發送俗氣折價碼，因社交羞恥感轉發率必趨近0", "14天分享點擊<2%即作廢", "B2B社交貨幣門檻",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "推薦獎勵與職業形象衝突" } }),
    N12: node("D3", 0, 1, "禁未驗證需求先寫重後端", "若在20人盲測勝率未過半前先建多租戶帳務後端，沉沒成本必拖死專案", "14天盲測勝率<=50%即停工", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "後端投入綁架產品方向" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "免費病毒裂變與閉門預購互斥" },
    { type: "excludes", from: "N1", to: "N5", why: "免驗證極速註冊與閉門審核互斥" },
    { type: "excludes", from: "N4", to: "N11", why: "直接發折價浮水印違反B2B社交羞恥護欄" },
    { type: "excludes", from: "N2", to: "N7", why: "純本地零伺服器與暗池撮合需中心化服務互斥" },
    { type: "excludes", from: "N2", to: "N10", why: "零算力無 API 帳單可熔斷，兩者擇一" },
    { type: "excludes", from: "N9", to: "N11", why: "公開排行榜曝光與 B2B 低調形象互斥" },
    { type: "requires", from: "N1", to: "N8", why: "免驗證註冊必須搭配樹突哨兵過濾防刷" },
    { type: "requires", from: "N4", to: "N10", why: "病毒裂變必須啟用算力防刷爆護欄" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "放棄預購現金", v: "首月算力自付", t: "無緩衝期", l: "個人扛帳單", x: "無高單價客群" },
      fatal: "N10", thesis: "用免疫雙信號擋羊毛，放手病毒裂變", title: "啟動樹突哨兵·極速裂變",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "零短期現金流", v: "維護精力外流", t: "30天伸手期", l: "Issue 爆量", x: "無付費驗證" },
      fatal: "N12", thesis: "開源引擎換 Star，用賽季榜驅動擴散", title: "開源引擎·公會排行槓桿",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "泛流量歸零", v: "無自然裂變", t: "慢速滲透", l: "銷售靠人脈", x: "放棄大眾市場" },
      fatal: "N11", thesis: "暗池賞金鎖住頂尖用戶，百席守毛利", title: "設暗池賞金·百人閉門",
    },
  },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "核心依賴單一模型供應商", kill: "供應商漲價30%即作廢", label: "斷供單點" },
};
