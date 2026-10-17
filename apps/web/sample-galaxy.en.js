// 內建示範星系（IntentAnalysisResponse v1.0，英文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Layer boundaries", D2: "How variation is expressed", D3: "Customization scope", D4: "Theme composition" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Counter-position: push ${dims[dim]} to the opposite extreme`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_EN = {
  schema_version: "1.0",
  core: {
    decision: "Should each brand fork its own components, or should one shared core be driven by configuration?",
    metric: "Within 60 days: a new theme ships in ≤2 days, and each theme's CSS is <50KB",
  },
  quadrants: {
    Q1: { scar: "Shared components stuffed with brand ifs", sacred: "Zero branching in core" },
    Q2: { scar: "100+ themes hand-patched one by one", sacred: "Types catch mistakes" },
    Q3: { scar: "Copied a design system, over-abstracted", sacred: "Swappable structure" },
    Q4: { scar: "Watched customization spiral three times", sacred: "Boundaries hold" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3-layer split", "Split components into a pure core, a coordinating view, and a theme leaf; core may not import theme IDs or routes", "Wrong if theme checks appear in core within 14 days", null),
    N2: node("D2", 0, 1, "CSS vars only", "Express every theme difference through CSS custom properties alone, with zero branching in components or layouts", "Wrong if the 3rd theme already needs component changes", "Layout differences can't be expressed with colors alone"),
    N3: node("D1", 1, 0, "Lazy theme CSS", "At runtime, load only the active theme's single stylesheet instead of bundling every theme into the first paint", "Wrong if any single theme's CSS exceeds 50KB within 14 days", null),
    N4: node("D4", 0, 2, "Typed configs", "Each theme ships a complete TypeScript config object; any missing field fails the build", "Wrong if a new theme still requires shared component changes", null),
    N5: node("D3", 2, 0, "Fork per brand", "Each theme copies the component directory and modifies it independently, so brands never affect each other", "Wrong if, after the 10th theme, fixing a bug touches >10 places", "One bug fix means patching N copies"),
    N6: node("D3", 1, 2, "Canary themes", "Ship each new theme behind a feature flag to 5% of tenants for a week; go to 100% only if error rates hit target", "Wrong if the canary error rate exceeds 1%", null),
    N7: node("D3", 2, 1, "Swap shells", "[D2 car platform] Layouts are like car bodies: swap the whole shell while the shared chassis (view and core) stays put", "Wrong if swapping a layout requires core changes", "Interactions drift between layouts",
      { lateral: { src: "Automotive: platform chassis", dist: 2, drop: "Retooling every car model from scratch" } }),
    N8: node("D2", 1, 0, "Use fixed slots", "[D3 LEGO bricks] Layouts declare fixed slots; themes may only plug components into slots and may not alter structure outside them", "Wrong if DOM outside slots is modified even once", null,
      { lateral: { src: "Toys: LEGO brick interface", dist: 3, drop: "Free-form DOM customization" } }),
    N9: node("D4", 2, 0, "Inherit diffs", "[D4 font family] Themes declare only their diff from default; all other fields are inherited automatically", "Wrong if inheritance goes deeper than 3 levels", null,
      { lateral: { src: "Type design: weight families", dist: 4, drop: "Full copy per theme" } }),
    N10: node("D2", 2, 0, "Cap config keys", "If every customization request adds a config field, maintaining the config will inevitably cost more than just forking", "Stop adding fields once any single config interface exceeds 40 fields", "Config hell",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraction costs more than duplication" } }),
    N11: node("D4", 1, 0, "Block bypasses", "If the business can demand brand checks directly in shared components, the boundary will fall within a quarter", "Void if any brand check is added to shared components within 14 days", "Trading boundaries for deadlines",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadline pressure rewards breaking boundaries" } }),
    N12: node("D3", 0, 1, "Ban big rewrite", "If all 70 modules must migrate before anything ships, sunk cost will stall the refactor halfway", "Stop if the first module hasn't shipped within 14 days", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refactor holds deadlines hostage" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Shared typed config and per-brand component forks are an either-or choice" },
    { type: "excludes", from: "N1", to: "N5", why: "A shared three-layer core and per-brand component copies are mutually exclusive" },
    { type: "excludes", from: "N4", to: "N11", why: "Typed config already blocks bypasses at compile time, so manual boundary review becomes a redundant gate" },
    { type: "excludes", from: "N2", to: "N7", why: "If themes only change CSS variables, there's no swapping of whole layout components" },
    { type: "excludes", from: "N2", to: "N10", why: "Pure CSS variables have no config fields to bloat; pick one" },
    { type: "excludes", from: "N9", to: "N11", why: "Inheritance chains allow local overrides, which conflicts with a zero-bypass guardrail" },
    { type: "requires", from: "N1", to: "N8", why: "Once split into three layers, themes must customize through fixed slots, or the view layer gets punched through" },
    { type: "requires", from: "N4", to: "N10", why: "Typed configs need a field cap, or they bloat into config hell" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Upfront refactor effort", v: "No quick forks", t: "60 days to build the skeleton", l: "Must write integrity tests", x: "No brand-specific shortcuts" },
      fatal: "N10", thesis: "Three-layer boundaries plus typed config shrink each theme to a single leaf", title: "Config-driven · 3-layer",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Limited layout variation", v: "Less design freedom", t: "Small weekly steps", l: "Complex layouts are off the table", x: "No structural customization" },
      fatal: "N12", thesis: "Use only CSS variables and inheritance, rolling out themes gradually behind canaries", title: "Pure styling · gradual",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicated code", v: "Bug fixes touch many places", t: "Fastest to ship", l: "Maintenance cost grows linearly", x: "Give up typed config" },
      fatal: "N11", thesis: "Swap whole layouts and let each brand fork its own shell", title: "Brand forks · shared chassis",
    },
  },
  recommend: { key: "alpha", why: "With 100+ themes, only config-driven design keeps maintenance cost in check" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Every theme inherits from the same default theme", kill: "Break default and every theme's layout breaks", label: "default SPOF" },
};
