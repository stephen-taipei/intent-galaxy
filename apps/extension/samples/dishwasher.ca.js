// 擴充功能生活題示範星系（加泰隆尼亞文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Ubicació", D2: "Com triar", D3: "Quantes obres fer", D4: "Capacitat i vaixella" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'altra banda porta ${dims[dim]} a l'extrem oposat`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_CA = {
  schema_version: "1.0",
  core: {
    decision: "Cal reformar la cuina per encabir-hi un rentaplats, o triar-ne un que hi càpiga tal com està?",
    metric: "Els primers 30 dies, fer-lo anar com a mínim 5 cops per setmana i no dedicar més de 5 minuts al dia a rentar plats a mà",
  },
  quadrants: {
    Q1: { scar: "Es va comprar un rentaplats i encara renta a mà", sacred: "Primer compta la teva vaixella" },
    Q2: { scar: "Va descobrir a mitja instal·lació que la mànega era massa curta", sacred: "Mesura abans de comprar" },
    Q3: { scar: "Va comprar el primer d'un rànquing en línia i no hi cabia", sacred: "Agafar idees d'altres camps" },
    Q4: { scar: "Ha vist tres rentaplats acabar fent d'escorreplats", sacred: "Pensa com podria fallar" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Encastat pica", "Treure el moble de 45 o 60 cm del costat de la pica i encastar-hi la màquina, així no ocupa taulell ni fa nosa al pas", "No encaixa si l'amplada, l'alçada o la fondària del moble són inferiors a les mides d'encastament de la màquina", null),
    N2: node("D2", 0, 1, "Després d'àpats", "Triar un model amb un programa ràpid de menys d'1 hora i posar-lo després de cada àpat, perquè els plats bruts no passin mai la nit a la pica", "No encaixa si en 14 dies els plats queden greixosos després del ràpid més de 2 vegades", "Els programes ràpids sovint se salten l'assecat: els plats s'assequen a l'aire"),
    N3: node("D1", 1, 0, "Al costat pica", "Posar la màquina a menys d'1 metre de la pica i portar la mànega de desguàs directament al desguàs de la pica, sense foradar parets ni refer la fontaneria", "No encaixa si la mànega de desguàs que porta no arriba a la pica i cal un allargador", null),
    N4: node("D4", 0, 2, "Mida família", "Amb 3 o més persones a casa, anar a 12 serveis o més perquè olles i plats entrin en un sol rentat en lloc de dos", "No encaixa si, més de 2 dies de 14, plats i olles no caben en un sol rentat", null),
    N5: node("D3", 2, 0, "Mini de taulell", "Comprar un rentaplats mini de taulell de 8 serveis o menys: sense desmuntar mobles, sense tocar la fontaneria, i se'n ve amb tu si et mudes", "No encaixa si, més de 3 dies de 14, calen 2 rentats per deixar-ho tot net", "Es menja un bon tros del taulell de cuinar"),
    N6: node("D3", 1, 2, "Primer provar", "Comprar un model que funcioni de lliure instal·lació o encastat, tenir-lo al costat de la pica 30 dies sencers i després decidir si es treu el moble, en lloc d'arrencar-lo el primer dia", "No encaixa si, durant els 30 dies de prova, la màquina tapa el pas o un calaix", null),
    N7: node("D3", 2, 1, "Amb dipòsit", "Com una autocaravana amb el seu dipòsit d'aigua, triar un model de taulell que s'omple a mà: sense connexió a l'aixeta ni canvis de fontaneria", "No encaixa si, en una setmana qualsevol, te'l saltes 2 cops o més i rentes a mà perquè fa mandra omplir-lo", "Omplir-lo és més pesat del que sembla",
      { lateral: { src: "Càmping: dipòsit d'aigua integrat", dist: 2, drop: "Connexió fixa a l'aixeta" } }),
    N8: node("D2", 1, 0, "Mesurar abans", "Com la llista de comprovació d'un pilot abans d'enlairar-se: mesurar amplada, fondària i alçada abans de comanar, i després comprovar l'endoll i el desguàs; si falta qualsevol dels 5 punts, no es comana", "No encaixa si alguna cosa no quadra o no es pot instal·lar quan arriba", null,
      { lateral: { src: "Aviació: checklist prèvia al vol", dist: 3, drop: "Comprar a ull" } }),
    N9: node("D4", 2, 0, "Vaixella apta", "Com un restaurant que només fa servir vaixella apta per a rentaplats, substituir totes les olles i plats marcats com a no aptes, sense deixar res per rentar a mà", "No encaixa si, en els 14 dies després del canvi, encara rentes més de 3 peces al dia a mà", null,
      { lateral: { src: "Restauració: vaixella professional", dist: 4, drop: "Vaixella vella desaparellada" } }),
    N10: node("D2", 2, 0, "Mai a mitges", "Si la poses a funcionar a menys de mitja càrrega, gasta gairebé tanta aigua i llum com plena, així que cada plat surt més del doble de car", "Apunta els plats durant 7 dies abans de comanar; si la mitjana és de menys de 6 serveis al dia, passa a un mini", "Els plats comencen a fer pudor mentre esperes la càrrega plena",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Fer anar una màquina gran mig buida no surt a compte" } }),
    N11: node("D4", 1, 0, "Sense olles", "Si per comoditat hi fiques woks i olles grans, un mini no pot rentar-ho tot d'un cop i acabes rentant a mà una altra vegada", "Descartar-ho si en 14 dies les olles obliguen a un segon rentat més de 2 vegades", "No tothom a casa complirà la norma",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Sobrecarregar la màquina per comoditat" } }),
    N12: node("D3", 0, 1, "Sense obres", "Si instal·lar un rentaplats acaba en reformar tota la cuina, un cop començades les obres i pagats els diners, ja no hi ha més remei que acabar-les", "No començar si el pressupost que et donen abans de treure el moble supera 2 vegades el preu de la màquina", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Un cop començades les obres, no hi ha marxa enrere" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una màquina de 12 serveis o més no cap al taulell: o aquesta o el mini de taulell" },
    { type: "excludes", from: "N1", to: "N5", why: "Un cop encastada una màquina al moble, no compraràs també un mini de taulell; és l'un o l'altre" },
    { type: "excludes", from: "N4", to: "N11", why: "Triar-la a mida de família serveix justament per rentar també les olles, cosa que contradiu deixar-les fora" },
    { type: "excludes", from: "N2", to: "N7", why: "Posar-la després de cada àpat vol dir omplir el dipòsit a mà tres cops al dia, difícil de mantenir" },
    { type: "excludes", from: "N2", to: "N10", why: "Posar-la després de cada àpat sovint vol dir menys de mitja càrrega, cosa que contradiu la norma de mai a mitges" },
    { type: "excludes", from: "N9", to: "N11", why: "Passar a olles i plats aptes per a rentaplats serveix justament per posar-los-hi, cosa que contradiu deixar fora les olles" },
    { type: "requires", from: "N1", to: "N8", why: "Amb 1 cm que falli ja no entra al moble, així que cal mesurar-ho tot abans de comanar" },
    { type: "requires", from: "N4", to: "N10", why: "Una màquina gran mig buida gasta igualment l'aigua i la llum d'una càrrega plena, així que mai a mitges" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Desmuntar el moble i mà d'obra", v: "Un moble de guardar menys", t: "Esperar que un instal·lador mesuri i munti", l: "Esperar mitja càrrega abans de posar-la", x: "Renunciar al mini de taulell" },
      fatal: "N10", thesis: "Mesurar el moble, encastar una màquina gran i posar-la només quan sigui mig plena", title: "Gran i encastat, d'una vegada",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Olles i plats nous, més aigua i llum a cada àpat", v: "Fa nosa al pas durant la prova", t: "El moble no surt fins passats 30 dies", l: "Assecar a l'aire després dels ràpids", x: "Renunciar al mini de taulell" },
      fatal: "N12", thesis: "Rentat ràpid després de cada àpat; tenir-lo al costat de la pica fins que funcioni i després encastar-lo", title: "Ràpid cada dia, prova abans d'encastar",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Omplir l'aigua a mà a cada rentat", v: "Ocupa un bon tros del taulell", t: "Olles a mà cada dia", l: "8 serveis o menys", x: "Renunciar a l'encastat i a la gran capacitat" },
      fatal: "N11", thesis: "Un mini de taulell que omples tu; les olles es continuen rentant a mà", title: "Mini de taulell, sense fontaneria",
    },
  },
  recommend: { key: "alpha", why: "Per a una llar de 3 o més persones, una màquina gran es fa els plats de tot el dia en un sol rentat" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Els plats de tota la família depenen d'aquesta única màquina; si s'espatlla, l'únic recanvi és rentar a mà", kill: "Descartar-ho si una reparació triga més de 7 dies i la família torna a rentar a mà", label: "Màquina única" },
};
