// 擴充功能生活題示範星系（菲律賓文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Puwesto", D2: "Paano pumili", D3: "Gaano kalaking renovation", D4: "Kapasidad at pinggan" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Itinutulak ng kabilang panig ang ${dims[dim]} sa kabilang dulo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_FIL = {
  schema_version: "1.0",
  core: {
    decision: "Ire-renovate mo ba ang kusina para sa dishwasher, o pipili ka ng kasya sa kusinang mayroon ka na?",
    metric: "Sa unang 30 araw, gamitin ito nang hindi bababa sa 5 beses kada linggo at maghugas ng pinggan nang mano-mano nang hindi lalampas sa 5 minuto kada araw",
  },
  quadrants: {
    Q1: { scar: "Bumili ng dishwasher, pero naghuhugas pa rin sa kamay", sacred: "Bilangin muna ang pinggan mo" },
    Q2: { scar: "Nalaman sa gitna ng pagkabit na kulang ang haba ng hose", sacred: "Sukatin muna bago bumili" },
    Q3: { scar: "Bumili mula sa online na listahan ng pinakamahusay pero hindi kasya", sacred: "Humiram ng ideya sa ibang larangan" },
    Q4: { scar: "Tatlong beses nakitang naging patuyuan ng pinggan ang dishwasher", sacred: "Planuhin muna ang pagpalya" },
  },
  nodes: {
    N1: node("D1", 0, 2, "I-built-in", "Tanggalin ang 45 o 60 cm na kabinet sa tabi ng lababo at i-built-in ang makina, para hindi kumain ng counter at hindi humarang sa daanan", "Hindi bagay kung mas maliit ang lapad, taas o lalim ng kabinet kaysa sa nakalistang built-in na sukat ng makina", null),
    N2: node("D2", 0, 1, "Hugas pagkakain", "Pumili ng model na may quick cycle na wala pang 1 oras at patakbuhin ito pagkatapos ng bawat kain, para hindi magdamag ang maruming pinggan sa lababo", "Hindi bagay kung mamantika pa rin ang pinggan pagkatapos ng quick cycle nang higit 2 beses sa loob ng 14 araw", "Kadalasang walang drying ang quick cycle, kaya ikaw ang magpapatuyo ng pinggan"),
    N3: node("D1", 1, 0, "Tabi ng lababo", "Ilagay ang makina sa loob ng 1 metro mula sa lababo at idiretso ang drain hose sa drain ng lababo, walang pagbutas ng pader o bagong tubo", "Hindi bagay kung hindi abot ng kasamang drain hose ang lababo at kailangan ng extension", null),
    N4: node("D4", 0, 2, "Pampamilya", "Kung 3 o higit pa kayo sa bahay, pumili ng 12+ place settings para isang salang lang ang kaldero at pinggan, hindi dalawa", "Hindi bagay kung, higit sa 2 araw sa loob ng 14, hindi kasya ang pinggan at kaldero sa isang salang", null),
    N5: node("D3", 2, 0, "Countertop mini", "Bumili ng countertop mini na 8 place settings pababa: walang tatanggaling kabinet, walang babaguhing tubo, at madadala mo kapag lumipat", "Hindi bagay kung, higit sa 3 araw sa loob ng 14, kailangan ng 2 salang para luminis lahat", "Kumakain ng malaking bahagi ng counter na pinaghahandaan"),
    N6: node("D3", 1, 2, "Subukan muna", "Bumili ng model na puwedeng nakatayo o built-in, ilagay sa tabi ng lababo nang buong 30 araw, saka magpasya kung tatanggalin ang kabinet sa halip na gibain sa unang araw", "Hindi bagay kung, sa 30 araw na trial, humaharang ang makina sa daanan o drawer", null),
    N7: node("D3", 2, 1, "May tangke", "Gaya ng RV na may sariling tangke ng tubig, pumili ng countertop model na pinupuno mo nang mano-mano: walang kabit sa gripo, walang babaguhing tubo", "Hindi bagay kung, sa alinmang linggo, 2 beses o higit kang naghugas sa kamay dahil tinamad kang punuin ito", "Mas abala ang pagpuno kaysa inaakala mo",
      { lateral: { src: "Camping: built-in na tangke ng tubig", dist: 2, drop: "Permanenteng kabit sa gripo" } }),
    N8: node("D2", 1, 0, "Sukatin muna", "Gaya ng preflight checklist ng piloto, sukatin ang lapad, lalim at taas bago umorder, saka tingnan ang puwesto ng saksakan at drain; kung kulang ang isa sa 5, huwag umorder", "Hindi bagay kung may hindi tugma o hindi maikabit pagdating", null,
      { lateral: { src: "Aviation: preflight checklist", dist: 3, drop: "Pag-order ayon sa kutob" } }),
    N9: node("D4", 2, 0, "Dishwasher-safe", "Gaya ng restawran na gumagamit lang ng pinggang pang-dishwasher, palitan ang lahat ng kaldero at pinggan na may label na hindi dishwasher-safe, para walang matirang huhugasan sa kamay", "Hindi bagay kung, sa 14 araw matapos magpalit, naghuhugas ka pa rin sa kamay ng higit 3 piraso kada araw", null,
      { lateral: { src: "Restawran: commercial-grade na pinggan", dist: 4, drop: "Halo-halong lumang pinggan sa bahay" } }),
    N10: node("D2", 2, 0, "Bawal kalahati", "Kung patatakbuhin itong wala pang kalahati ang laman, halos kasing-dami ng full load ang tubig at kuryente, kaya higit doble ang gastos kada pinggan", "Itala ang pinggan mo nang 7 araw bago umorder; kung wala pang 6 place settings ang average kada araw, lumipat sa mini", "Nangangamoy ang pinggan habang hinihintay mapuno",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Hindi sulit ang malaking makinang kalahating walang laman" } }),
    N11: node("D4", 1, 0, "Walang kaldero", "Kung isisiksik mo ang kawali at malaking kaldero para lang madali, hindi kakasya sa isang salang ang pinggan sa mini at babalik ka sa paghuhugas sa kamay", "Itigil kung napilitan ang ikalawang salang dahil sa kaldero nang higit 2 beses sa loob ng 14 araw", "Hindi lahat sa bahay ay susunod sa patakaran",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Pagsisiksik sa makina para lang madali" } }),
    N12: node("D3", 0, 1, "Huwag mag-reno", "Kung ang pagkabit ng dishwasher ay lumaki at naging renovation ng buong kusina, kapag nagsimula na ang trabaho at nabayaran na, wala ka nang atrasan", "Huwag simulan kung higit 2x ng presyo ng makina ang quote bago tanggalin ang kabinet", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Kapag nasimulan na, wala nang atrasan" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Hindi kasya sa counter ang 12+ place-setting na makina, kaya iyon o ang countertop mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Kapag naka-built-in na ang makina sa kabinet, hindi ka na bibili ng countertop mini; isa lang" },
    { type: "excludes", from: "N4", to: "N11", why: "Ang punto ng pampamilyang laki ay para mahugasan din ang kaldero, salungat sa pag-iwas sa kaldero" },
    { type: "excludes", from: "N2", to: "N7", why: "Ang paghuhugas pagkatapos ng bawat kain ay pagpuno ng tangke nang tatlong beses kada araw, mahirap panindigan" },
    { type: "excludes", from: "N2", to: "N10", why: "Ang paghuhugas pagkatapos ng bawat kain ay madalas wala pang kalahating load, salungat sa patakarang bawal kalahati" },
    { type: "excludes", from: "N9", to: "N11", why: "Ang punto ng paglipat sa dishwasher-safe na kaldero at pinggan ay para ipasok ang mga ito, salungat sa pag-iwas sa kaldero" },
    { type: "requires", from: "N1", to: "N8", why: "Lihis lang ng 1 cm at hindi na papasok sa kabinet, kaya sukatin lahat bago umorder" },
    { type: "requires", from: "N4", to: "N10", why: "Ang malaking makinang kalahati lang ang laman ay gumagamit pa rin ng full load na tubig at kuryente, kaya manindigan sa bawal kalahati" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Bayad sa pagtanggal ng kabinet at pagkabit", v: "Bawas na isang kabinet na lagayan", t: "Hintayin ang installer na sumukat at magkabit", l: "Hintaying kalahati ang laman bago patakbuhin", x: "Isuko ang countertop mini" },
      fatal: "N10", thesis: "Sukatin ang kabinet, i-built-in ang malaking makina, patakbuhin lang kapag kalahati na ang laman", title: "Built-in na malaki, minsanan",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Bagong kaldero at pinggan, dagdag tubig at kuryente bawat kain", v: "Humaharang sa daanan habang trial", t: "Sa ika-30 araw pa lang tatanggalin ang kabinet", l: "Patuyuin ang pinggan pagkatapos ng quick cycle", x: "Isuko ang countertop mini" },
      fatal: "N12", thesis: "Mabilisang hugas pagkatapos ng bawat kain; sa tabi muna ng lababo hanggang umubra, saka i-built-in", title: "Araw-araw na quick wash, trial muna",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Punuin ng tubig sa kamay bawat salang", v: "Kumakain ng bahagi ng counter na pinaghahandaan", t: "Hugasan sa kamay ang kaldero araw-araw", l: "8 place settings pababa", x: "Isuko ang built-in at malaking kapasidad" },
      fatal: "N11", thesis: "Countertop mini na ikaw ang pumupuno; sa kamay pa rin ang kaldero", title: "Countertop mini, walang tubo",
    },
  },
  recommend: { key: "alpha", why: "Para sa sambahayang 3 o higit pa, kaya ng isang malaking makina ang pinggan ng buong araw sa iisang salang" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Nakaasa ang pinggan ng buong pamilya sa iisang makinang ito; kapag nasira, paghuhugas sa kamay lang ang reserba", kill: "Itigil kung higit 7 araw ang pagpapaayos at bumalik sa paghuhugas sa kamay ang pamilya", label: "Iisang makina" },
};
