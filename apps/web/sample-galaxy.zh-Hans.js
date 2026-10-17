// 內建示範星系（IntentAnalysisResponse v1.0，簡中版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "分层边界", D2: "差异表达", D3: "定制幅度", D4: "主题组成" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方主张 ${dims[dim]} 走另一极`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ZH_HANS = {
  schema_version: "1.0",
  core: {
    decision: "你真正在决定的是：每个品牌各自 fork 组件，还是用配置驱动一套共用核心？",
    metric: "60 天内新主题上线 ≤2 天，单主题 CSS <50KB",
  },
  quadrants: {
    Q1: { scar: "共用组件塞满品牌 if", sacred: "core 零分支" },
    Q2: { scar: "100+ 主题逐一手动对版", sacred: "类型拦错" },
    Q3: { scar: "照抄设计系统过度抽象", sacred: "可替换结构" },
    Q4: { scar: "见过三次定制失控", sacred: "边界不失守" },
  },
  nodes: {
    N1: node("D1", 0, 2, "三层切分核心", "组件拆成纯 core、协调 view、主题 leaf 三层，core 禁止 import 主题 ID 与路由", "14天内core出现主题判断则错", null),
    N2: node("D2", 0, 1, "主题只改 CSS 变量", "所有主题差异只用 CSS custom properties 表达，组件与布局零分支", "第3个主题就需改组件则错", "布局差异无法只靠颜色"),
    N3: node("D1", 1, 0, "主题 CSS 按需加载", "运行时只加载当前主题一份 stylesheet，不把全部主题打包进首屏", "14天单主题CSS>50KB则错", null),
    N4: node("D4", 0, 2, "类型化主题配置", "每个主题提供完整 TypeScript 配置对象，缺任何字段就编译失败", "新主题仍需改共用组件则错", null),
    N5: node("D3", 2, 0, "每个品牌 fork 组件", "每个主题复制一份组件目录各自修改，品牌之间互不影响", "第10个主题后修bug需改>10处则错", "修一个 bug 要改 N 份"),
    N6: node("D3", 1, 2, "开关灰度上主题", "新主题先用 feature flag 开给 5% 租户一周，错误率达标才全量", "灰度期错误率>1%则错", null),
    N7: node("D3", 2, 1, "布局整套替换外壳", "[D2 汽车平台化] 布局像车壳可整套替换，共用底盘 view 与 core 不动", "换布局需改core则错", "布局间交互不一致",
      { lateral: { src: "汽车: 平台化底盘", dist: 2, drop: "每款车重新开模" } }),
    N8: node("D2", 1, 0, "布局固定插槽插件", "[D3 乐高积木] 布局声明固定插槽，主题只能往插槽插组件，禁改插槽外结构", "插槽外DOM被改>0次则错", null,
      { lateral: { src: "玩具: 乐高积木接口", dist: 3, drop: "自由定制 DOM" } }),
    N9: node("D4", 2, 0, "主题差异继承链", "[D4 字体家族] 主题只声明与 default 的差异，其余字段自动继承", "继承超过3层则错", null,
      { lateral: { src: "字体设计: 字重家族", dist: 4, drop: "每主题完整复制" } }),
    N10: node("D2", 2, 0, "禁配置字段无限膨胀", "若每个定制需求都加一个配置字段，配置文件维护成本必高过直接 fork", "单一配置接口>40个字段即停止加字段", "配置地狱",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象成本高过重复成本" } }),
    N11: node("D4", 1, 0, "禁业务绕过主题边界", "若业务可直接要求在共用组件加品牌判断，边界必在一季度内失守", "14天共用组件新增品牌判断>0即作废", "交付压力换边界",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "赶工期奖励破坏边界" } }),
    N12: node("D3", 0, 1, "禁一次重构全部模块", "若先一次迁移全部 70 个模块才上线，沉没成本必让重构半途停摆", "14天内首个模块未上线即停", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "大爆炸重构绑架工期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用类型配置与各品牌 fork 组件两条路二选一" },
    { type: "excludes", from: "N1", to: "N5", why: "三层共用核心与每品牌复制组件互斥" },
    { type: "excludes", from: "N4", to: "N11", why: "类型配置已在编译期拦住绕路，人工边界审查变成重复关卡" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 变量就不会整套替换布局组件" },
    { type: "excludes", from: "N2", to: "N10", why: "纯 CSS 变量没有配置字段可膨胀，两者二选一" },
    { type: "excludes", from: "N9", to: "N11", why: "继承链允许局部覆盖，与零绕路护栏冲突" },
    { type: "requires", from: "N1", to: "N8", why: "三层切分后主题必须通过固定插槽定制，否则 view 会被改穿" },
    { type: "requires", from: "N4", to: "N10", why: "类型配置文件必须设字段上限，否则膨胀成配置地狱" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重构工时", v: "放弃快速 fork", t: "60天搭骨架", l: "要写完整性测试", x: "无品牌特例捷径" },
      fatal: "N10", thesis: "三层边界加类型配置，主题缩成一片叶子", title: "配置驱动·三层边界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "布局差异受限", v: "设计自由度低", t: "每周小步", l: "复杂布局做不到", x: "无结构定制" },
      fatal: "N12", thesis: "只用 CSS 变量与继承，灰度逐步上主题", title: "纯样式·继承渐进",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重复代码", v: "修bug改多处", t: "最快上线", l: "维护成本线性增长", x: "放弃类型配置" },
      fatal: "N11", thesis: "布局整套替换，品牌各自 fork 外壳", title: "品牌分支·底盘共用",
    },
  },
  recommend: { key: "alpha", why: "100+ 主题下只有配置驱动压得住维护成本" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主题都继承同一个 default 主题", kill: "default 改坏即全主题布局崩坏", label: "default 单点" },
};
