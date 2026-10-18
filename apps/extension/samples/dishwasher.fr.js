// 擴充功能生活題示範星系（法文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Emplacement", D2: "Manière de choisir", D3: "Ampleur des travaux", D4: "Capacité et vaisselle" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'autre camp pousse ${dims[dim]} à l'extrême opposé`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_FR = {
  schema_version: "1.0",
  core: {
    decision: "Faut-il réaménager la cuisine autour d'un lave-vaisselle, ou en choisir un qui rentre dans la cuisine actuelle ?",
    metric: "Sur les 30 premiers jours, le faire tourner au moins 5 fois par semaine et ne pas passer plus de 5 minutes par jour à faire la vaisselle à la main",
  },
  quadrants: {
    Q1: { scar: "A acheté un lave-vaisselle et fait encore tout à la main", sacred: "Compter sa vaisselle d'abord" },
    Q2: { scar: "A découvert en pleine pose que le tuyau était trop court", sacred: "Mesurer avant d'acheter" },
    Q3: { scar: "A acheté le n° 1 d'un comparatif en ligne, et il ne rentrait pas", sacred: "S'inspirer d'autres domaines" },
    Q4: { scar: "A vu trois lave-vaisselle finir en égouttoir", sacred: "Réfléchir à comment ça pourrait échouer" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Encastré évier", "Retirer le meuble de 45 ou 60 cm à côté de l'évier et y encastrer la machine : elle ne prend pas de place sur le plan de travail et ne gêne pas le passage", "Inadapté si la largeur, la hauteur ou la profondeur du meuble est inférieure aux cotes d'encastrement de la machine", null),
    N2: node("D2", 0, 1, "Après les repas", "Choisir un modèle avec un programme rapide de moins d'1 heure et le lancer après chaque repas, pour que la vaisselle sale ne passe jamais la nuit dans l'évier", "Inadapté si la vaisselle reste grasse après un programme rapide plus de 2 fois en 14 jours", "Les programmes rapides sautent souvent le séchage : il faudra laisser sécher à l'air"),
    N3: node("D1", 1, 0, "Près de l'évier", "Placer la machine à moins d'1 mètre de l'évier et brancher le tuyau de vidange directement sur l'évacuation de l'évier, sans percer de mur ni refaire la plomberie", "Inadapté si le tuyau de vidange fourni n'atteint pas l'évier et qu'il faut une rallonge", null),
    N4: node("D4", 0, 2, "Taille famille", "À partir de 3 personnes à la maison, viser 12 couverts ou plus pour que casseroles et assiettes passent en un seul cycle au lieu de deux", "Inadapté si, plus de 2 jours sur 14, vaisselle et casseroles ne tiennent pas en un cycle", null),
    N5: node("D3", 2, 0, "Mini à poser", "Acheter un mini lave-vaisselle à poser de 8 couverts maximum : pas de meuble à démonter, pas de plomberie à modifier, et il déménage avec vous", "Inadapté si, plus de 3 jours sur 14, il faut 2 cycles pour tout laver", "Mange une bonne part du plan de travail"),
    N6: node("D3", 1, 2, "Tester d'abord", "Acheter un modèle utilisable en pose libre ou encastré, le laisser près de l'évier 30 jours pleins, puis décider de retirer le meuble, plutôt que de tout démonter le premier jour", "Inadapté si, pendant les 30 jours d'essai, la machine bloque le passage ou un tiroir", null),
    N7: node("D3", 2, 1, "Réservoir d'eau", "Comme un camping-car avec sa propre réserve d'eau, choisir un modèle à poser qu'on remplit à la main : pas de raccord au robinet, pas de plomberie à modifier", "Inadapté si, une semaine donnée, vous la zappez 2 fois ou plus pour laver à la main parce que vous aviez la flemme de la remplir", "La remplir est plus pénible qu'on ne croit",
      { lateral: { src: "Camping : réservoir d'eau intégré", dist: 2, drop: "Raccord permanent au robinet" } }),
    N8: node("D2", 1, 0, "Mesurer avant", "Comme la check-list d'un pilote avant le décollage : mesurer largeur, profondeur et hauteur avant de commander, puis vérifier la prise et l'évacuation ; si un des 5 points manque, on ne commande pas", "Inadapté si quoi que ce soit ne correspond pas ou si l'installation est impossible à la livraison", null,
      { lateral: { src: "Aviation : check-list prévol", dist: 3, drop: "Commander au feeling" } }),
    N9: node("D4", 2, 0, "Tout compatible", "Comme un restaurant qui n'utilise que de la vaisselle qui supporte le lave-vaisselle, remplacer toutes les casseroles et assiettes marquées non compatibles, pour ne rien laisser à laver à la main", "Inadapté si, dans les 14 jours après le remplacement, vous lavez encore plus de 3 pièces par jour à la main", null,
      { lateral: { src: "Restauration : vaisselle professionnelle", dist: 4, drop: "Vieux service dépareillé à la maison" } }),
    N10: node("D2", 2, 0, "Jamais à moitié", "Lancée à moins de la moitié, la machine consomme presque autant d'eau et d'électricité qu'à pleine charge : chaque assiette coûte alors plus du double", "Noter sa vaisselle pendant 7 jours avant de commander ; si la moyenne est sous 6 couverts par jour, passer à un mini", "La vaisselle sent mauvais en attendant d'avoir une pleine charge",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Faire tourner une grosse machine à moitié vide n'est pas rentable" } }),
    N11: node("D4", 1, 0, "Sans casseroles", "Si on y entasse woks et faitouts par facilité, un mini ne peut plus tout laver en un cycle et on se retrouve à refaire la vaisselle à la main", "À abandonner si les casseroles imposent un second cycle plus de 2 fois en 14 jours", "Tout le monde à la maison ne respectera pas la règle",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Surcharger la machine par facilité" } }),
    N12: node("D3", 0, 1, "Pas de travaux", "Si poser un lave-vaisselle tourne à la rénovation complète de la cuisine, une fois les travaux lancés et l'argent versé, on est obligé d'aller jusqu'au bout", "Ne pas commencer si le devis obtenu avant de retirer le meuble dépasse 2 fois le prix de la machine", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Une fois les travaux lancés, impossible de faire marche arrière" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Une machine de 12 couverts ou plus ne tient pas sur le plan de travail : c'est elle ou le mini à poser" },
    { type: "excludes", from: "N1", to: "N5", why: "Une fois une machine encastrée dans le meuble, on n'achète pas en plus un mini à poser ; c'est l'un ou l'autre" },
    { type: "excludes", from: "N4", to: "N11", why: "Prendre une taille familiale sert justement à laver aussi les casseroles, ce qui contredit le fait de les exclure" },
    { type: "excludes", from: "N2", to: "N7", why: "Lancer après chaque repas, c'est remplir le réservoir à la main trois fois par jour, difficile à tenir" },
    { type: "excludes", from: "N2", to: "N10", why: "Lancer après chaque repas donne souvent moins d'une demi-charge, ce qui contredit la règle jamais à moitié" },
    { type: "excludes", from: "N9", to: "N11", why: "Passer à des casseroles et assiettes compatibles sert justement à les mettre dedans, ce qui contredit le fait d'exclure les casseroles" },
    { type: "requires", from: "N1", to: "N8", why: "À 1 cm près, elle ne rentre pas dans le meuble : il faut tout mesurer avant de commander" },
    { type: "requires", from: "N4", to: "N10", why: "Une grosse machine à moitié vide consomme quand même l'eau et l'électricité d'une pleine charge : s'en tenir à jamais à moitié" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Démontage du meuble et main-d'œuvre", v: "Un meuble de rangement en moins", t: "Attendre qu'un installateur mesure et pose", l: "Attendre une demi-charge avant de lancer", x: "Renoncer au mini à poser" },
      fatal: "N10", thesis: "Mesurer le meuble, encastrer une grande machine, ne lancer qu'à moitié pleine au minimum", title: "Grande machine encastrée, une fois pour toutes",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nouvelle vaisselle, plus eau et électricité à chaque repas", v: "Encombre le passage pendant l'essai", t: "Le meuble ne sort qu'après 30 jours", l: "Séchage à l'air après les cycles rapides", x: "Renoncer au mini à poser" },
      fatal: "N12", thesis: "Un cycle rapide après chaque repas ; laisser la machine près de l'évier jusqu'à ce que ça marche, puis l'encastrer", title: "Cycle rapide quotidien, essai avant encastrement",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Remplir l'eau à la main à chaque cycle", v: "Prend une bonne part du plan de travail", t: "Casseroles à la main tous les jours", l: "8 couverts maximum", x: "Renoncer à l'encastré et à la grande capacité" },
      fatal: "N11", thesis: "Un mini à poser qu'on remplit soi-même ; les casseroles restent à la main", title: "Mini à poser, sans plomberie",
    },
  },
  recommend: { key: "alpha", why: "Pour un foyer de 3 personnes ou plus, une grande machine absorbe toute la vaisselle de la journée en un seul cycle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Toute la vaisselle de la famille dépend de cette seule machine ; si elle tombe en panne, le seul plan B est la vaisselle à la main", kill: "À abandonner si une réparation prend plus de 7 jours et que la famille revient à la vaisselle à la main", label: "Machine unique" },
};
