// 擴充功能內建生活題示範星系（加泰隆尼亞文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "D'on ve el dolç", D2: "Vàlvula per al desig", D3: "Quant canviar", D4: "Què hi ha a casa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La visió contrària porta ${dims[dim]} a l'altre extrem`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_CA = {
  schema_version: "1.0",
  core: {
    decision: "Cal canviar tots els dolços per fruita sencera, o continuar menjant el que t'agrada però en menys quantitat?",
    metric: "Durant 30 dies, no més de 3 snacks i begudes ensucrats per setmana en total (apuntats al mòbil per comprovar-ho)",
  },
  quadrants: {
    Q1: { scar: "Es va menjar una bossa sencera de fruita seca pensant que era un snack sa", sacred: "El dolç només ve de la fruita sencera" },
    Q2: { scar: "Ha deixat el sucre tres cops i ha recaigut la segona setmana cada vegada", sacred: "Només compta si de debò ho pots mantenir" },
    Q3: { scar: "Va copiar una dieta low-carb i se'n va cansar en tres dies", sacred: "Canviar el mètode, no el gust" },
    Q4: { scar: "Ha vist massa gent deixar el sucre i tornar-hi de seguida", sacred: "Les normes guanyen a la voluntat" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fruita sencera", "Quan et vingui de gust alguna cosa dolça, menja només fruita fresca sencera, com kiwi, pinya, fruits vermells o taronges; sucs, fruita seca i fruita confitada no compten", "Falla si, en 14 dies, compres postres per calmar el desig més de 3 dies", null),
    N2: node("D2", 0, 1, "Aigua amb gas", "Quan arribi el desig, beu primer un got d'aigua amb gas sense sucre amb llimona o fruita de la passió; si als 15 minuts encara en tens ganes, guarda el dolç per després del proper àpat. Només canvien les begudes: els àpats es queden igual i no compres snacks substituts", "Falla si, en 14 dies, després dels 15 minuts d'espera encara tens ganes de dolç més de la meitat de les vegades", "Una beguda no treu les ganes de mastegar alguna cosa"),
    N3: node("D1", 1, 0, "Després d'àpats", "Menja snacks agredolços i fruita només dins l'hora posterior a un àpat; res amb l'estómac buit i res les 3 hores abans d'anar a dormir", "Falla si, després de 14 dies així, encara vas a buscar snacks abans de dormir més de 3 nits", null),
    N4: node("D4", 0, 2, "Res dolç a casa", "Fes la compra un cop per setmana: fruita de temporada per caixes i iogurt natural sense sucre per a tota la setmana; són els únics snacks de casa, i els snacks ensucrats no hi entren mai", "Falla si, en 14 dies, encara hi ha una setmana en què compres dolços fora més de 3 cops", null),
    N5: node("D3", 2, 0, "Meitat de dosi", "Continua menjant els snacks agredolços que t'agraden, però menys: passa a envasos individuals i redueix a la meitat la quantitat diària, sense substituts", "Falla si, a partir de la 2a setmana, menges més de la meitat del que menjaves abans més de 2 dies per setmana", "Sovint obres un segon paquet just després del primer"),
    N6: node("D3", 1, 2, "Provar begudes", "Per a cada sabor nou de beguda sense sucre, compra l'envàs més petit i beu-ne 3 dies seguits; compra la caixa sencera només si t'agrada, mai no facis estoc de cop", "Falla si un sabor comprat per caixes després de la prova encara és més que mig ple 14 dies després", null),
    N7: node("D3", 2, 1, "Canviar salsa", "Com canviar la funda del mòbil en lloc del mòbil: mantén els ingredients principals del porc o el peix agredolç, però fes la salsa tu mateix amb tomàquet, pinya i vinagre, amb la meitat del sucre habitual", "Falla si, després de fer la salsa nova 2 cops en 14 dies, tothom a casa diu que no és bona", "Al restaurant o amb menjar a domicili no pots canviar la salsa",
      { lateral: { src: "Tecnologia: canviar la funda del mòbil", dist: 2, drop: "Treure el plat del menú del tot" } }),
    N8: node("D2", 1, 0, "Màx. 3 racions", "Com el límit d'equipatge d'una aerolínia: com a màxim 3 racions al dia entre fruita i snacks agredolços, cadascuna de la mida del teu puny; la resta espera a demà, en lloc de dependre de la força de voluntat del moment", "Falla si passes de 3 racions més de 2 dies en una setmana", null,
      { lateral: { src: "Aerolínies: límit de pes d'equipatge", dist: 3, drop: "Menjar quan vulguis sense límit" } }),
    N9: node("D4", 2, 0, "Estoc d'aigua", "Reposa com una botiga de barri abans que s'acabi el gènere: tingues sempre a la nevera una caixa d'aigua amb gas sense sucre i una bossa de llimones, i compra una caixa nova quan en quedin 3 ampolles, perquè un desig no et faci sortir mai a comprar un refresc o un te fred", "Falla si, en 14 dies, encara compres més de 3 begudes ensucrades per emportar", null,
      { lateral: { src: "Comerç: reposar abans d'esgotar", dist: 4, drop: "Comprar beguda només quan en vols" } }),
    N10: node("D2", 2, 0, "Topall despesa", "Si els snacks substituts com la fruita i el iogurt sense sucre costen més del doble del que gastaves abans en snacks cada setmana, ho deixaràs en menys d'un mes i tornaràs a comprar snacks", "Aturar-se si, en 14 dies, els substituts costen més del doble del teu antic pressupost de snacks", "El preu de la fruita varia molt segons la temporada",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Els substituts són massa cars per mantenir-los" } }),
    N11: node("D4", 1, 0, "Sense lots", "Si compres menjar i begudes per caixes per tenir l'enviament gratuït o un descompte per volum, com més n'hi ha a casa, més en menges cada dia", "Aturar-se si, en 14 dies, compres menjar o begudes per caixes o per arribar al mínim d'enviament gratuït més d'un cop", "No pots controlar els dolços que et regalen amics i família",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Els descomptes et fan comprar cada cop més" } }),
    N12: node("D3", 0, 1, "Sense aparells", "Si esperes a haver comprat una màquina de soda, edulcorants i tota mena de substituts abans de començar, els diners gastats t'empenyeran a empassar-te coses que no t'agraden, i ho deixaràs en 2 setmanes", "Aturar-se si, en 14 dies, compres més d'1 aparell o substitut que no fas servir de debò", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "T'ho empasses perquè no es llenci" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "No tenir snacks ensucrats a casa i continuar menjant els snacks ensucrats de sempre no poden anar junts" },
    { type: "excludes", from: "N1", to: "N5", why: "Si el dolç només ve de la fruita sencera, no et pots quedar els snacks ensucrats que t'agraden" },
    { type: "excludes", from: "N4", to: "N11", why: "La fruita de casa depèn de comprar-ne una caixa cada setmana; prohibeix comprar per caixes i aquest pla d'estoc s'enfonsa" },
    { type: "excludes", from: "N2", to: "N7", why: "Aquest camí només canvia les begudes i deixa els àpats com estan, cosa que contradiu refer la salsa agredolça" },
    { type: "excludes", from: "N2", to: "N10", why: "Aquest camí només canvia les begudes i no compra snacks substituts; un topall de despesa en substituts és d'un altre camí, així que tria'n un" },
    { type: "excludes", from: "N9", to: "N11", why: "Tenir estoc d'aigua amb gas vol dir comprar-la per caixes, cosa que xoca de ple amb no comprar a l'engròs" },
    { type: "requires", from: "N1", to: "N8", why: "La fruita també té sucre; encara que sigui el teu únic dolç, cal un límit diari, o menjar-ne massa també passa factura" },
    { type: "requires", from: "N4", to: "N10", why: "Comprar fruita i iogurt per caixes cada setmana surt car, així que cal un topall de despesa o la cartera cedirà primer" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Una compra fixa a la setmana", v: "Renunciar als snacks que t'agraden", t: "Les dues primeres setmanes de desig són dures", l: "Com a màxim tres racions de fruita al dia", x: "Res de postres comprades per impuls" },
      fatal: "N10", thesis: "Treure el dolç només de la fruita sencera, en quantitats limitades, i mantenir els snacks ensucrats fora de casa", title: "Passar a la fruita · res dolç a casa",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tenir estoc d'aigua amb gas a la nevera", v: "Esperar 15 minuts abans de cedir a un desig", t: "Canviar només una mica cada setmana", l: "El sucre dels àpats es queda igual", x: "S'ha acabat menjar els snacks de sempre" },
      fatal: "N12", thesis: "Agafar aigua amb gas sense sucre quan arriba el desig, i provar sabors nous en poca quantitat abans de comprar-ne més", title: "Primer les begudes · reduir a poc a poc",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Comptar racions cada vegada", v: "Els dolços de casa encara et tempten", t: "Els resultats triguen molt a arribar", l: "Reduir depèn només de l'autocontrol", x: "Renunciar a passar del tot a la fruita" },
      fatal: "N11", thesis: "Continuar menjant el que t'agrada, però en envasos petits, amb racions limitades i una salsa agredolça refeta", title: "Mantenir els preferits · limitar i canviar salsa",
    },
  },
  recommend: { key: "alpha", why: "La fruita és dolça i àcida de manera natural, i mantenir els snacks ensucrats fora de casa és el que demana menys força de voluntat" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tots els teus capricis agredolços depenen d'una sola fruita o beguda", kill: "Si aquella única cosa s'esgota o te'n canses, tot el pla s'enfonsa", label: "Un sol substitut" },
};
