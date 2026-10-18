// 內建示範星系（IntentAnalysisResponse v1.0，英文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "How the code is layered", D2: "How themes differ", D3: "How deep customization goes", D4: "How theme settings are built" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `The other side: take "${dims[dim]}" the opposite way`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_EN = {
  schema_version: "1.0",
  core: {
    decision: "Should each brand fork its own copy of the components, or should every brand share one core and switch differences through config files?",
    metric: "Within 60 days: a new theme ships in 2 days or less, and each theme's CSS is under 50KB",
  },
  quadrants: {
    Q1: { scar: "Shared components stuffed with brand ifs", sacred: "No brand checks in core" },
    Q2: { scar: "Hand-fixed layouts for 100+ themes one by one", sacred: "Let type checks catch mistakes" },
    Q3: { scar: "Copied someone's design system and over-abstracted", sacred: "Parts you can swap out whole" },
    Q4: { scar: "Saw customization spin out of control three times", sacred: "Layer boundaries hold" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3-layer split", "Split components into three layers: a logic-only core, a view that wires things together, and a theme leaf for styling; core may not import theme IDs or routes", "Fails if code that checks the theme shows up in core within 14 days", null),
    N2: node("D2", 0, 1, "CSS vars only", "Write every difference between themes as CSS variables (custom properties), with no theme checks at all in components or layouts", "Fails if the 3rd theme already needs component changes", "Layout differences can't be done with colors alone"),
    N3: node("D1", 1, 0, "Load one theme", "At runtime, load only the current theme's stylesheet instead of bundling every theme into the first page load", "Fails if any theme's CSS goes over 50KB within 14 days", null),
    N4: node("D4", 0, 2, "Typed configs", "Each theme ships a complete TypeScript config object; leave out any field and the build fails", "Fails if a new theme still means changing shared components", null),
    N5: node("D3", 2, 0, "Fork per brand", "Each theme copies the component folder and edits it on its own, so brands never affect each other", "Fails if, after the 10th theme, fixing one bug means changing more than 10 places", "One bug fix means patching every copy"),
    N6: node("D3", 1, 2, "Few users first", "Put each new theme behind a feature flag for 5% of tenants for a week; turn it on for everyone only if the error rate stays on target", "Fails if the error rate goes over 1% during that week", null),
    N7: node("D3", 2, 1, "Swap shells", "Like cars that share a chassis and only change the body: swap a whole layout while the shared view and core underneath stay put", "Fails if swapping a layout means changing core", "Controls may behave differently from one layout to another",
      { lateral: { src: "Cars: shared chassis", dist: 2, drop: "A new mold for every car model" } }),
    N8: node("D2", 1, 0, "Use fixed slots", "Like LEGO bricks that only snap onto studs: layouts define fixed slots, themes can only put components into those slots, and nothing outside them may change", "Fails if DOM outside the slots is changed even once", null,
      { lateral: { src: "Toys: LEGO bricks", dist: 3, drop: "Editing the DOM freely" } }),
    N9: node("D4", 2, 0, "Just the diffs", "Like bold and light weights built from the same typeface: a theme lists only what differs from the default theme, and every other field carries over automatically", "Fails if inheritance goes more than 3 levels deep", null,
      { lateral: { src: "Type design: font weights", dist: 4, drop: "A full copy per theme" } }),
    N10: node("D2", 2, 0, "Cap config keys", "If every customization request adds a config field, keeping the config up to date will sooner or later cost more than just forking", "Stop adding fields once any single config interface has more than 40", "So many settings nobody understands them",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraction ends up costing more than copied code" } }),
    N11: node("D4", 1, 0, "No brand hacks", "If the business side can demand brand checks directly in shared components, the layer boundaries will fall apart within a quarter", "Scrap this plan if even 1 brand check is added to shared components within 14 days", "Giving up the layering to hit a deadline",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Hitting the deadline gets praised; breaking the layers goes unpunished" } }),
    N12: node("D3", 0, 1, "No big rewrite", "If all 70 modules must be moved over before anything ships, the more you've put in the harder it is to stop, and the rewrite tends to stall halfway", "Stop if the first module hasn't shipped within 14 days", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Rewriting everything at once wrecks the schedule" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "One shared typed config and a separate fork for every brand: you can only pick one" },
    { type: "excludes", from: "N1", to: "N5", why: "A shared three-layer core and a copy of the components for every brand: you can only pick one" },
    { type: "excludes", from: "N4", to: "N11", why: "Typed config already blocks shortcuts at build time, so a manual review of the layers just checks the same thing twice" },
    { type: "excludes", from: "N2", to: "N7", why: "If themes only change CSS variables, nobody swaps out whole layout components" },
    { type: "excludes", from: "N2", to: "N10", why: "With only CSS variables there are no config fields to pile up; pick one" },
    { type: "excludes", from: "N9", to: "N11", why: "Inheritance lets a theme override bits locally, which clashes with a guardrail of never bypassing the layers" },
    { type: "requires", from: "N1", to: "N8", why: "Once there are three layers, themes must customize through fixed slots, or the view layer gets hacked apart" },
    { type: "requires", from: "N4", to: "N10", why: "Typed configs need a cap on fields, or they grow until nobody understands them" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Upfront rewrite work", v: "No quick forks", t: "60 days to set up the structure", l: "Must write thorough tests", x: "No special shortcuts for brands" },
      fatal: "N10", thesis: "Three layers for components and a typed config file per theme, so each theme is just one config", title: "Config-driven · 3 layers",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Limited layout variety", v: "Less design freedom", t: "A little change each week", l: "Complex layouts are off the table", x: "No changes to page structure" },
      fatal: "N12", thesis: "Use only CSS variables and inheritance; show new themes to a few users first, then widen", title: "Styles only · gradual rollout",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicated code", v: "Bug fixes touch many places", t: "Fastest to ship", l: "More themes, more upkeep", x: "Give up typed config" },
      fatal: "N11", thesis: "Swap whole layouts and let each brand fork its own shell", title: "Brand forks · shared chassis",
    },
  },
  recommend: { key: "alpha", why: "With 100+ themes, only a config-driven setup keeps maintenance costs under control" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Every theme inherits from the same default theme", kill: "Break the default theme and every theme's layout breaks with it", label: "All on default" },
};
