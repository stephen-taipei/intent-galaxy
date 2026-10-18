// 內建示範星系（IntentAnalysisResponse v1.0，菲律賓文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Hangganan ng layer", D2: "Paano ipinapahayag ang variation", D3: "Saklaw ng customization", D4: "Komposisyon ng theme" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Kontra-posisyon: itulak ang ${dims[dim]} sa kabilang dulo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_FIL = {
  schema_version: "1.0",
  core: {
    decision: "Dapat bang mag-fork ng sariling component ang bawat brand, o isang shared core na pinapatakbo ng configuration?",
    metric: "Sa loob ng 60 araw: nailalabas ang bagong theme sa ≤2 araw, at <50KB ang CSS ng bawat theme",
  },
  quadrants: {
    Q1: { scar: "Mga shared component na puno ng brand na if", sacred: "Walang branching sa core" },
    Q2: { scar: "100+ theme na isa-isang tinapalan nang mano-mano", sacred: "Types ang humuhuli ng mali" },
    Q3: { scar: "Ginaya ang isang design system, sobra ang abstraction", sacred: "Napapalitang istruktura" },
    Q4: { scar: "Tatlong beses nakitang lumala ang customization", sacred: "Dapat manatili ang hangganan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Hatiin sa 3", "Hatiin ang mga component sa purong core, view na tagapag-ugnay, at theme na dahon; bawal mag-import ang core ng theme ID o route", "Mali kung may theme check na lumabas sa core sa loob ng 14 araw", null),
    N2: node("D2", 0, 1, "CSS vars lang", "Ipahayag ang bawat pagkakaiba ng theme gamit lang ang CSS custom properties, walang anumang branching sa component o layout", "Mali kung ang ika-3 theme ay nangangailangan na ng pagbabago sa component", "Hindi maipapahayag ang pagkakaiba ng layout sa kulay lang"),
    N3: node("D1", 1, 0, "Lazy theme CSS", "Sa runtime, i-load lang ang iisang stylesheet ng aktibong theme sa halip na i-bundle lahat ng theme sa unang paint", "Mali kung lumampas sa 50KB ang CSS ng kahit isang theme sa loob ng 14 araw", null),
    N4: node("D4", 0, 2, "Typed config", "Bawat theme ay may kumpletong TypeScript config object; anumang kulang na field ay magpapabagsak sa build", "Mali kung kailangan pa ring baguhin ang shared component para sa bagong theme", null),
    N5: node("D3", 2, 0, "Fork kada brand", "Kinokopya ng bawat theme ang component directory at binabago ito nang hiwalay, para hindi nagkakaapektuhan ang mga brand", "Mali kung, pagkatapos ng ika-10 theme, ang pag-ayos ng isang bug ay umaabot sa >10 lugar", "Isang bug fix ay katumbas ng pagtapal sa N kopya"),
    N6: node("D3", 1, 2, "Canary themes", "Ilabas ang bawat bagong theme sa likod ng feature flag sa 5% ng tenant nang isang linggo; itaas sa 100% lang kapag pasok sa target ang error rate", "Mali kung lumampas sa 1% ang canary error rate", null),
    N7: node("D3", 2, 1, "Palit ng shell", "[D2 car platform] Ang layout ay parang katawan ng kotse: palitan ang buong shell habang nananatili ang shared chassis (view at core)", "Mali kung kailangan ng pagbabago sa core para magpalit ng layout", "Nagkakaiba-iba ang interaction sa bawat layout",
      { lateral: { src: "Automotive: platform chassis", dist: 2, drop: "Paggawa ulit ng bawat modelo ng kotse mula sa simula" } }),
    N8: node("D2", 1, 0, "Fixed slots", "[D3 LEGO bricks] Nagdedeklara ang layout ng fixed slots; puwede lang magsaksak ang theme ng component sa slot at bawal galawin ang istruktura sa labas nito", "Mali kung binago ang DOM sa labas ng slot kahit isang beses", null,
      { lateral: { src: "Laruan: interface ng LEGO brick", dist: 3, drop: "Malayang customization ng DOM" } }),
    N9: node("D4", 2, 0, "Mana ng diff", "[D4 font family] Idinedeklara lang ng theme ang diff nito mula sa default; awtomatikong namamana ang lahat ng ibang field", "Mali kung lumalim nang higit sa 3 antas ang inheritance", null,
      { lateral: { src: "Type design: weight families", dist: 4, drop: "Buong kopya bawat theme" } }),
    N10: node("D2", 2, 0, "Limit sa config", "Kung bawat hiling na customization ay nagdadagdag ng config field, siguradong mas magastos panatilihin ang config kaysa mag-fork na lang", "Tumigil sa pagdagdag ng field kapag lumampas sa 40 field ang alinmang config interface", "Config hell",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Mas magastos ang abstraction kaysa duplication" } }),
    N11: node("D4", 1, 0, "Bawal bypass", "Kung puwedeng hilingin ng negosyo ang brand check direkta sa shared component, guguho ang hangganan sa loob ng isang quarter", "Walang bisa kung may brand check na naidagdag sa shared component sa loob ng 14 araw", "Ipinagpapalit ang hangganan para sa deadline",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Ginagantimpalaan ng deadline pressure ang paglabag sa hangganan" } }),
    N12: node("D3", 0, 1, "Bawal rewrite", "Kung kailangang i-migrate lahat ng 70 module bago may mailabas, ang sunk cost ang magpapahinto sa refactor sa kalagitnaan", "Tumigil kung hindi pa nailalabas ang unang module sa loob ng 14 araw", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Ang big-bang refactor ang humuhostage sa deadline" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Pagpipilian ang shared typed config at ang fork ng component bawat brand; isa lang" },
    { type: "excludes", from: "N1", to: "N5", why: "Hindi puwedeng magsabay ang shared na tatlong-layer na core at kopya ng component bawat brand" },
    { type: "excludes", from: "N4", to: "N11", why: "Hinaharang na ng typed config ang bypass sa compile time, kaya sobrang gate na ang mano-manong review ng hangganan" },
    { type: "excludes", from: "N2", to: "N7", why: "Kung CSS variables lang ang binabago ng theme, walang pagpapalit ng buong layout component" },
    { type: "excludes", from: "N2", to: "N10", why: "Walang config field na lolobo sa purong CSS variables; pumili ng isa" },
    { type: "excludes", from: "N9", to: "N11", why: "Pinapayagan ng inheritance chain ang lokal na override, na salungat sa guardrail na walang bypass" },
    { type: "requires", from: "N1", to: "N8", why: "Kapag nahati na sa tatlong layer, kailangang mag-customize ang theme sa pamamagitan ng fixed slots, kung hindi ay mabubutas ang view layer" },
    { type: "requires", from: "N4", to: "N10", why: "Kailangan ng typed config ng limit sa field, kung hindi ay lolobo ito hanggang config hell" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Pagod sa refactor sa simula", v: "Walang mabilisang fork", t: "60 araw para buuin ang skeleton", l: "Kailangang sumulat ng integrity test", x: "Walang shortcut na pang-brand lang" },
      fatal: "N10", thesis: "Pinaliliit ng tatlong-layer na hangganan at typed config ang bawat theme sa iisang dahon", title: "Config-driven · 3-layer",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Limitadong variation ng layout", v: "Mas kaunting kalayaan sa disenyo", t: "Maliliit na hakbang bawat linggo", l: "Hindi puwede ang komplikadong layout", x: "Walang customization ng istruktura" },
      fatal: "N12", thesis: "Gumamit lang ng CSS variables at inheritance, at unti-unting ilabas ang theme sa likod ng canary", title: "Purong styling · unti-unti",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Dobleng code", v: "Maraming lugar ang tinatamaan ng bug fix", t: "Pinakamabilis mailabas", l: "Linear na tumataas ang gastos sa maintenance", x: "Isuko ang typed config" },
      fatal: "N11", thesis: "Palitan ang buong layout at hayaang i-fork ng bawat brand ang sarili nitong shell", title: "Brand fork · shared chassis",
    },
  },
  recommend: { key: "alpha", why: "Sa 100+ theme, config-driven na disenyo lang ang makakapigil sa gastos sa maintenance" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Lahat ng theme ay nagmamana mula sa iisang default theme", kill: "Masira ang default at masisira ang layout ng lahat ng theme", label: "default SPOF" },
};
