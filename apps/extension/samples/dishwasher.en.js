// 擴充功能生活題示範星系（英文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Placement", D2: "How to choose", D3: "How much remodeling", D4: "Capacity & dishes" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `The other side pushes ${dims[dim]} to the opposite extreme`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_EN = {
  schema_version: "1.0",
  core: {
    decision: "Should you remodel the kitchen around a dishwasher, or pick one that fits the kitchen you already have?",
    metric: "In the first 30 days, run it at least 5 times a week and spend no more than 5 minutes a day washing dishes by hand",
  },
  quadrants: {
    Q1: { scar: "Bought a dishwasher, still washing by hand", sacred: "Count your dishes first" },
    Q2: { scar: "Found out mid-install the hose was too short", sacred: "Measure before you buy" },
    Q3: { scar: "Bought from an online best-of list and it didn't fit", sacred: "Borrow ideas from other fields" },
    Q4: { scar: "Seen three dishwashers end up as dish racks", sacred: "Think through how it could fail" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Slot in by sink", "Pull out the 45 or 60 cm cabinet next to the sink and build the machine in, so it takes no counter space and doesn't block the walkway", "Not a fit if the cabinet's width, height or depth is smaller than the machine's listed built-in dimensions", null),
    N2: node("D2", 0, 1, "Run after meals", "Pick a model with a quick cycle under 1 hour and run it after every meal, so dirty dishes never sit in the sink overnight", "Not a fit if dishes still feel greasy after a quick cycle more than 2 times in 14 days", "Quick cycles usually skip drying, so you'll air-dry the dishes yourself"),
    N3: node("D1", 1, 0, "Place by sink", "Put the machine within 1 meter of the sink and run the drain hose straight into the sink drain, with no drilling through walls or new plumbing", "Not a fit if the included drain hose can't reach the sink and needs an extension", null),
    N4: node("D4", 0, 2, "Size for family", "With 3 or more people at home, go for 12+ place settings so pots and dishes all go in one load instead of two", "Not a fit if, on more than 2 days in 14, dishes plus pots don't fit in one load", null),
    N5: node("D3", 2, 0, "Countertop mini", "Buy a countertop mini with 8 place settings or fewer: no cabinet removal, no plumbing changes, and it moves with you", "Not a fit if, on more than 3 days in 14, it takes 2 runs to get everything clean", "Eats up a chunk of prep counter"),
    N6: node("D3", 1, 2, "Try, then build", "Buy a model that works freestanding or built-in, keep it by the sink for a full 30 days, then decide whether to pull the cabinet instead of tearing it out on day one", "Not a fit if, during the 30-day trial, the machine blocks the walkway or a drawer", null),
    N7: node("D3", 2, 1, "Tank, no hookup", "Like an RV with its own water tank, pick a countertop model you fill by hand: no faucet hookup, no plumbing changes", "Not a fit if, in any week, you skip it and hand-wash 2 or more times because you couldn't be bothered to fill it", "Filling it is more hassle than you'd think",
      { lateral: { src: "Camping: built-in water tank", dist: 2, drop: "Permanent faucet hookup" } }),
    N8: node("D2", 1, 0, "Measure first", "Like a pilot's preflight checklist, measure width, depth and height before you order, then check the outlet and drain locations; if any of the 5 is missing, don't order", "Not a fit if anything doesn't match or it won't install once it arrives", null,
      { lateral: { src: "Aviation: preflight checklist", dist: 3, drop: "Ordering on gut feel" } }),
    N9: node("D4", 2, 0, "Dishwasher-safe", "Like a restaurant that only uses dishwasher-proof ware, replace every pot and dish labeled not dishwasher-safe, leaving nothing for hand-washing", "Not a fit if, in the 14 days after swapping, you still hand-wash more than 3 items a day", null,
      { lateral: { src: "Restaurants: commercial-grade dishware", dist: 4, drop: "Mixed set of old dishes at home" } }),
    N10: node("D2", 2, 0, "No half-loads", "If you run it less than half full, it uses about as much water and power as a full load, so each dish costs more than twice as much to wash", "Log your dishes for 7 days before ordering; if you average under 6 place settings a day, switch to a mini", "Dishes start to stink while you wait for a full load",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Running a big machine half-empty doesn't pay" } }),
    N11: node("D4", 1, 0, "No pots inside", "If you cram woks and stockpots in for convenience, a mini can't fit the dishes in one load and you end up hand-washing again", "Scrap this plan if, within 14 days, cramming in pots means running a second load more than 2 times", "Not everyone at home will follow the rule",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Overloading the machine for convenience" } }),
    N12: node("D3", 0, 1, "No kitchen redo", "If installing a dishwasher snowballs into redoing the whole kitchen, once work starts and money's paid, you're stuck seeing it through", "Don't start if the quote you get before pulling the cabinet is more than 2x the machine's price", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Once work starts, there's no backing out" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "A 12+ place-setting machine won't fit on the counter, so it's either that or a countertop mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Once a machine is built into the cabinet, you won't also buy a countertop mini; it's one or the other" },
    { type: "excludes", from: "N4", to: "N11", why: "The point of sizing up for your family is washing pots too, which contradicts keeping pots out" },
    { type: "excludes", from: "N2", to: "N7", why: "Running after every meal means filling the tank by hand three times a day, which is hard to keep up" },
    { type: "excludes", from: "N2", to: "N10", why: "Running after every meal often means less than half a load, which contradicts the no-half-loads rule" },
    { type: "excludes", from: "N9", to: "N11", why: "The point of switching to dishwasher-safe pots and dishes is to put them in, which contradicts keeping pots out" },
    { type: "requires", from: "N1", to: "N8", why: "Being off by 1 cm means it won't slide into the cabinet, so you have to measure everything before ordering" },
    { type: "requires", from: "N4", to: "N10", why: "A big machine run half-empty still uses a full load of water and power, so stick to no half-loads" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Cabinet removal and install labor", v: "One less cabinet for storage", t: "Wait for an installer to measure and fit", l: "Wait for half a load before running", x: "Give up the countertop mini" },
      fatal: "N10", thesis: "Measure the cabinet, build in a big machine, and run it only once it's at least half full", title: "Built-in big machine, done once",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "New pots and dishes, plus water and power every meal", v: "Takes up the walkway during the trial", t: "Cabinet comes out only after 30 days", l: "Air-dry dishes after quick cycles", x: "Give up the countertop mini" },
      fatal: "N12", thesis: "Quick wash after every meal; keep it by the sink until it works, then build it in", title: "Quick wash daily, trial before built-in",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Fill the water by hand every run", v: "Takes up a chunk of prep counter", t: "Hand-wash pots every day", l: "8 place settings or fewer", x: "Give up built-in and big capacity" },
      fatal: "N11", thesis: "A countertop mini you fill yourself; pots stay hand-wash", title: "Countertop mini, no plumbing",
    },
  },
  recommend: { key: "alpha", why: "For a household of 3 or more, one big machine handles a whole day's dishes in a single load" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "The whole family's dishes depend on this one machine; if it breaks, the only backup is hand-washing", kill: "Scrap this plan if a repair takes more than 7 days and the family goes back to hand-washing", label: "Single machine" },
};
