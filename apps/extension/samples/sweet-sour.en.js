// 擴充功能內建生活題示範星系（英文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "How you get sweet", D2: "Craving outlet", D3: "How big a change", D4: "What's stocked at home" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `The opposite view takes ${dims[dim]} to the other extreme`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_EN = {
  schema_version: "1.0",
  core: {
    decision: "Should you swap every sweet treat for whole fruit, or keep eating what you love and just eat less of it?",
    metric: "Over 30 days, no more than 3 sugary snacks and drinks per week combined (logged on your phone to check)",
  },
  quadrants: {
    Q1: { scar: "Ate a whole bag of dried fruit thinking it was a health snack", sacred: "Sweetness only comes from whole fruit" },
    Q2: { scar: "Quit sugar three times and caved in week two every time", sacred: "It only counts if you can actually stick to it" },
    Q3: { scar: "Copied a low-carb meal plan and got sick of it in three days", sacred: "Change the method, not the flavor" },
    Q4: { scar: "Seen too many people quit sugar and slide right back", sacred: "Set rules instead of relying on willpower" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Eat whole fruit", "Whenever you want something sweet, eat only whole fresh fruit, like kiwi, pineapple, berries or oranges; juice, dried fruit and candied fruit don't count", "Fails if, within 14 days, you buy dessert to fix a craving on more than 3 days", null),
    N2: node("D2", 0, 1, "Drink seltzer", "When a craving hits, first drink a glass of unsweetened sparkling water with lemon or passion fruit; if you still want a treat after 15 minutes, save it for after your next meal. Only the drinks change: meals stay the same and you don't buy substitute snacks", "Fails if, within 14 days, you still want something sweet after the 15-minute wait more than half the time", "A drink won't fix the urge to chew on something"),
    N3: node("D1", 1, 0, "After-meal only", "Eat sweet-and-sour snacks and fruit only within 1 hour after a meal; nothing on an empty stomach and nothing in the 3 hours before bed", "Fails if, after 14 days of this, you still go hunting for snacks before bed on more than 3 nights", null),
    N4: node("D4", 0, 2, "Ban home sweets", "Shop once a week: buy seasonal fruit by the box and enough plain unsweetened yogurt for the week; those are the only snacks in the house, and sugary snacks never come home", "Fails if, within 14 days, there's still a week where you buy sweets outside more than 3 times", null),
    N5: node("D3", 2, 0, "Halve favorites", "Keep eating the sweet-and-sour snacks you love, just less of them: switch to single-serve packs and cut your daily amount in half, with no substitutes", "Fails if, from week 2 on, you eat more than half your old amount on more than 2 days a week", "You often open a second pack right after the first"),
    N6: node("D3", 1, 2, "Test new drinks", "For each new unsweetened drink flavor, buy the smallest pack and drink it 3 days in a row; only buy a whole case if you like it, never stock up all at once", "Fails if a flavor you bought by the case after testing is still more than half full 14 days later", null),
    N7: node("D3", 2, 1, "Swap the sauce", "Like changing your phone case instead of your phone: keep the main ingredients of sweet-and-sour pork or fish, but make the sauce yourself from tomato, pineapple and vinegar, with half the usual sugar", "Fails if, after making the new sauce 2 times within 14 days, everyone at home says it's not good", "You can't change the sauce at restaurants or takeout",
      { lateral: { src: "Tech: swap the phone case", dist: 2, drop: "Drop the dish from the menu entirely" } }),
    N8: node("D2", 1, 0, "Max 3 servings", "Like an airline baggage limit: at most 3 servings of fruit and sweet-and-sour snacks combined per day, each about the size of your fist; anything extra waits until tomorrow, instead of relying on willpower in the moment", "Fails if you have more than 3 servings on more than 2 days in a week", null,
      { lateral: { src: "Airlines: baggage weight limit", dist: 3, drop: "Eat whenever you like with no limit" } }),
    N9: node("D4", 2, 0, "Stock seltzer", "Restock like a convenience store does before it runs out: always keep a case of unsweetened sparkling water and a bag of lemons in the fridge, and buy a new case when you're down to 3 cans, so a craving never sends you out for a bubble tea or a soda", "Fails if, within 14 days, you still buy more than 3 sugary takeout drinks", null,
      { lateral: { src: "Retail: restock before it sells out", dist: 4, drop: "Buy a drink only when you want one" } }),
    N10: node("D2", 2, 0, "Cap swap costs", "If substitute snacks like fruit and unsweetened yogurt cost more than twice what you used to spend on snacks each week, you'll give up within a month and go back to buying snacks", "Stop if, within 14 days, substitute snacks cost more than twice your old snack budget", "Fruit prices swing a lot with the seasons",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Substitutes cost too much to keep up" } }),
    N11: node("D4", 1, 0, "Skip bulk deals", "If you buy food and drinks by the case to get free shipping or a bulk discount, the more you have at home, the more you end up eating every day", "Stop if, within 14 days, you buy food or drinks by the case or to hit a free-shipping minimum more than once", "You can't control gifts of treats from friends and family",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Discounts make you buy more and more" } }),
    N12: node("D3", 0, 1, "Skip the gear", "If you wait until you've bought a soda maker, sweeteners and every kind of substitute before starting, the money you spent pushes you to force down things you don't like, and you'll quit within 2 weeks", "Stop if, within 14 days, you buy more than 1 gadget or substitute you don't actually use", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "You force it down so it doesn't go to waste" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Keeping sugary snacks out of the house and still eating your usual sugary snacks can't both happen" },
    { type: "excludes", from: "N1", to: "N5", why: "If sweetness only comes from whole fruit, you can't keep the sugary snacks you love" },
    { type: "excludes", from: "N4", to: "N11", why: "The fruit at home depends on buying a box every week; ban buying by the case and that stocking plan falls apart" },
    { type: "excludes", from: "N2", to: "N7", why: "This path changes only the drinks and leaves meals alone, which contradicts reworking the sweet-and-sour sauce" },
    { type: "excludes", from: "N2", to: "N10", why: "This path changes only the drinks and buys no substitute snacks, so a spending cap on substitute snacks doesn't apply; pick one" },
    { type: "excludes", from: "N9", to: "N11", why: "Keeping sparkling water stocked means buying it by the case, which clashes directly with not buying in bulk" },
    { type: "requires", from: "N1", to: "N8", why: "Fruit has sugar too; even if fruit is your only treat, you need a daily limit, or eating too much still takes a toll" },
    { type: "requires", from: "N4", to: "N10", why: "Buying fruit and yogurt by the box every week adds up, so you need a spending cap or your wallet gives out first" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "One fixed grocery run a week", v: "Give up the snacks you love", t: "The first two weeks of cravings are rough", l: "At most three servings of fruit a day", x: "No impulse dessert runs" },
      fatal: "N10", thesis: "Get your sweet fix only from whole fruit, in limited amounts, and keep sugary snacks out of the house", title: "Switch to fruit · no sweets at home",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Keep sparkling water stocked in the fridge", v: "Wait 15 minutes before giving in to a craving", t: "Only change a little each week", l: "The sugar in your meals stays the same", x: "No eating your old snacks as usual" },
      fatal: "N12", thesis: "Reach for unsweetened sparkling water when a craving hits, and try new flavors in small amounts before buying more", title: "Swap drinks first · cut back slowly",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Count servings every time", v: "Sweets at home still tempt you", t: "It takes a long time to see results", l: "Cutting back is all on self-control", x: "Give up switching fully to fruit" },
      fatal: "N11", thesis: "Keep eating what you love, but switch to small packs, limit servings and remake the sweet-and-sour sauce", title: "Keep favorites · limit and swap sauce",
    },
  },
  recommend: { key: "alpha", why: "Fruit is naturally sweet and tangy, and keeping sugary snacks out of the house takes the least willpower" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "All your sweet-and-sour fixes come from just one fruit or drink", kill: "If that one thing sells out or you get sick of it, the whole plan falls apart", label: "Just one swap" },
};
