// 內建示範星系（IntentAnalysisResponse v1.0，簡中版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "代码怎么分层", D2: "主题差异怎么写", D3: "能定制到多深", D4: "主题配置怎么组织" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `反方看法：“${dims[dim]}”走完全相反的路`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ZH_HANS = {
  schema_version: "1.0",
  core: {
    decision: "你真正在决定的是：每个品牌各自 fork 一份组件，还是所有品牌共用一套核心、只靠配置文件切换差异？",
    metric: "60 天内，新主题 2 天就能上线，每个主题的 CSS 小于 50KB",
  },
  quadrants: {
    Q1: { scar: "共用组件里塞满各品牌的 if", sacred: "core 里不写品牌判断" },
    Q2: { scar: "100 多个主题一个个手动改页面", sacred: "让类型检查拦下错误" },
    Q3: { scar: "照搬别人的设计系统，抽象过头", sacred: "结构能整块替换" },
    Q4: { scar: "亲眼见过三次定制失控", sacred: "分层边界守得住" },
  },
  nodes: {
    N1: node("D1", 0, 2, "组件分成三层", "把组件分成三层：只放逻辑的 core、负责串联的 view、放主题样式的 leaf；core 不准 import 主题 ID 或路由", "14 天内 core 里出现判断主题的代码，就算失败", null),
    N2: node("D2", 0, 1, "主题只改 CSS 变量", "主题之间的差异全部用 CSS 变量（custom properties）来写，组件和布局里完全不写主题判断", "做到第 3 个主题时就得改组件，就算失败", "布局的差异光换颜色做不到"),
    N3: node("D1", 1, 0, "只加载当前主题 CSS", "运行时只加载当前主题的那一份 stylesheet，不把所有主题都打包进首次加载的页面", "14 天内有任一主题的 CSS 超过 50KB，就算失败", null),
    N4: node("D4", 0, 2, "主题配置加类型", "每个主题都提供一份完整的 TypeScript 配置对象，少填任何字段就编译不过", "新增主题时还是得改共用组件，就算失败", null),
    N5: node("D3", 2, 0, "每个品牌 fork 组件", "每个主题复制一份组件目录各自修改，品牌之间互不影响", "做到第 10 个主题后，修一个 bug 要改超过 10 个地方，就算失败", "修一个 bug，每份副本都要改"),
    N6: node("D3", 1, 2, "新主题先开给少数人", "新主题先用 feature flag 只开给 5% 的租户用一周，错误率达标才开给所有人", "试用这周的错误率超过 1%，就算失败", null),
    N7: node("D3", 2, 1, "布局整套替换外壳", "像汽车共用底盘、只换车壳：布局可以整套替换，底下共用的 view 和 core 不动", "换布局时得改 core，就算失败", "不同布局之间的操作方式会不一致",
      { lateral: { src: "汽车: 共用底盘", dist: 2, drop: "每款车重新开模" } }),
    N8: node("D2", 1, 0, "布局只开固定插槽", "像乐高积木只能拼在凸点上：布局先定好固定插槽，主题只能往插槽里放组件，插槽以外的结构不准改", "插槽以外的 DOM 只要被改过 1 次，就算失败", null,
      { lateral: { src: "玩具: 乐高积木", dist: 3, drop: "随意改 DOM" } }),
    N9: node("D4", 2, 0, "只写和默认不同处", "像同一套字体的粗体、细体都从同一份字形变出来：主题只写和 default 主题不同的地方，其余字段自动沿用", "继承超过 3 层，就算失败", null,
      { lateral: { src: "字体设计: 粗细字重", dist: 4, drop: "每个主题整份复制" } }),
    N10: node("D2", 2, 0, "配置字段要设上限", "如果每个定制需求都加一个配置字段，维护配置文件的成本迟早会超过直接 fork", "任何一个配置接口超过 40 个字段，就不再加字段", "配置多到没人看得懂",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "抽象的成本比复制代码还高" } }),
    N11: node("D4", 1, 0, "业务不能绕过分层", "如果业务可以直接要求在共用组件里加品牌判断，分层边界一个季度内就会守不住", "14 天内共用组件只要多出 1 个品牌判断，这个方案就作废", "为了赶工期牺牲分层边界",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "赶上工期有功，破坏边界没人罚" } }),
    N12: node("D3", 0, 1, "不一次重写全部模块", "如果要等 70 个模块全部迁移完才上线，前面投入越多越舍不得停，重构很容易卡在一半", "14 天内第一个模块还没上线，就停手", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "一次全部重写，拖垮工期" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "共用一套类型化配置，和每个品牌各自 fork 组件，只能二选一" },
    { type: "excludes", from: "N1", to: "N5", why: "三层共用核心和每个品牌复制一份组件，只能二选一" },
    { type: "excludes", from: "N4", to: "N11", why: "类型化配置在编译时就拦下绕路，再加人工审查分层就是重复把关" },
    { type: "excludes", from: "N2", to: "N7", why: "只改 CSS 变量，就不会整套替换布局组件" },
    { type: "excludes", from: "N2", to: "N10", why: "只用 CSS 变量就没有配置字段会变多，两者选一" },
    { type: "excludes", from: "N9", to: "N11", why: "继承允许局部覆盖，和“一次都不准绕过分层”的护栏冲突" },
    { type: "requires", from: "N1", to: "N8", why: "分成三层后，主题只能通过固定插槽定制，不然 view 会被改得乱七八糟" },
    { type: "requires", from: "N4", to: "N10", why: "类型化配置必须限制字段数量，不然会多到没人看得懂" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "前期重构工时", v: "不能快速 fork", t: "60 天先搭好架构", l: "要写完整的测试", x: "品牌不能走特例捷径" },
      fatal: "N10", thesis: "组件分三层、主题用类型化配置，每个主题只剩一份配置", title: "配置驱动·三层边界",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "布局能做的变化有限", v: "设计自由度低", t: "每周改一点", l: "复杂布局做不到", x: "不能改页面结构" },
      fatal: "N12", thesis: "只用 CSS 变量和继承，新主题先开给少数人再逐步放开", title: "只改样式·逐步上线",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "重复的代码", v: "修 bug 要改很多处", t: "最快上线", l: "主题越多维护越贵", x: "放弃类型化配置" },
      fatal: "N11", thesis: "布局整套替换，每个品牌各自 fork 外壳", title: "品牌各自 fork·共用底盘",
    },
  },
  recommend: { key: "alpha", why: "主题超过 100 个时，只有靠配置驱动，维护成本才压得住" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "所有主题都继承同一个 default 主题", kill: "default 一改坏，所有主题的页面一起坏", label: "全靠 default 主题" },
};
