// 內建示範星系（IntentAnalysisResponse v1.0，法文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Frontières entre couches", D2: "Expression des variantes", D3: "Ampleur de la personnalisation", D4: "Composition des thèmes" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Position inverse : pousser ${dims[dim]} à l'extrême opposé`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_FR = {
  schema_version: "1.0",
  core: {
    decision: "Chaque marque doit-elle forker ses propres composants, ou faut-il un seul core partagé piloté par la configuration ?",
    metric: "D'ici 60 jours : un nouveau thème livré en ≤2 jours, et un CSS <50KB par thème",
  },
  quadrants: {
    Q1: { scar: "Composants partagés truffés de if par marque", sacred: "Zéro branchement dans le core" },
    Q2: { scar: "Plus de 100 thèmes rafistolés un par un", sacred: "Les types attrapent les erreurs" },
    Q3: { scar: "A copié un design system, sur-abstrait", sacred: "Une structure interchangeable" },
    Q4: { scar: "A vu la personnalisation déraper trois fois", sacred: "Les frontières tiennent" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Trois couches", "Découper les composants en un core pur, une view de coordination et une feuille theme ; le core ne peut importer ni ID de thème ni routes", "Faux si des tests de thème apparaissent dans le core sous 14 jours", null),
    N2: node("D2", 0, 1, "Vars CSS seules", "Exprimer toutes les différences de thème uniquement via des propriétés CSS personnalisées, sans aucun branchement dans les composants ou les layouts", "Faux si le 3e thème exige déjà de modifier des composants", "Les différences de layout ne s'expriment pas avec des couleurs"),
    N3: node("D1", 1, 0, "Lazy-load CSS", "À l'exécution, ne charger que la feuille de style du thème actif au lieu d'embarquer tous les thèmes dans le premier affichage", "Faux si le CSS d'un seul thème dépasse 50KB sous 14 jours", null),
    N4: node("D4", 0, 2, "Configs typées", "Chaque thème fournit un objet de config TypeScript complet ; tout champ manquant fait échouer le build", "Faux si un nouveau thème exige encore de modifier des composants partagés", null),
    N5: node("D3", 2, 0, "Fork par marque", "Chaque thème copie le dossier des composants et le modifie de son côté, pour que les marques ne s'impactent jamais", "Faux si, après le 10e thème, corriger un bug touche plus de 10 endroits", "Un correctif = N copies à patcher"),
    N6: node("D3", 1, 2, "Thèmes canary", "Livrer chaque nouveau thème derrière un feature flag à 5 % des tenants pendant une semaine ; passer à 100 % seulement si le taux d'erreur est dans la cible", "Faux si le taux d'erreur du canary dépasse 1 %", null),
    N7: node("D3", 2, 1, "Coque amovible", "[D2 plateforme auto] Les layouts sont comme des carrosseries : on change toute la coque, le châssis commun (view et core) ne bouge pas", "Faux si changer de layout exige de toucher au core", "Les interactions divergent d'un layout à l'autre",
      { lateral: { src: "Automobile : châssis plateforme", dist: 2, drop: "Réoutiller chaque modèle depuis zéro" } }),
    N8: node("D2", 1, 0, "Slots fixes", "[D3 briques LEGO] Les layouts déclarent des slots fixes ; un thème ne peut que brancher des composants dans les slots, sans toucher à la structure autour", "Faux si le DOM hors des slots est modifié ne serait-ce qu'une fois", null,
      { lateral: { src: "Jouets : l'interface des briques LEGO", dist: 3, drop: "Personnalisation libre du DOM" } }),
    N9: node("D4", 2, 0, "Hériter du diff", "[D4 famille de police] Un thème ne déclare que son écart par rapport au défaut ; tous les autres champs sont hérités automatiquement", "Faux si l'héritage dépasse 3 niveaux", null,
      { lateral: { src: "Typographie : familles de graisses", dist: 4, drop: "Copie complète par thème" } }),
    N10: node("D2", 2, 0, "Plafonner clés", "Si chaque demande de personnalisation ajoute un champ de config, maintenir la config finira forcément par coûter plus cher qu'un simple fork", "Arrêter d'ajouter des champs dès qu'une interface de config dépasse 40 champs", "L'enfer de la config",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'abstraction coûte plus que la duplication" } }),
    N11: node("D4", 1, 0, "Zéro bypass", "Si le métier peut exiger des tests de marque directement dans les composants partagés, la frontière tombera en moins d'un trimestre", "Caduc si un test de marque est ajouté aux composants partagés sous 14 jours", "Sacrifier les frontières aux deadlines",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "La pression des deadlines récompense les entorses" } }),
    N12: node("D3", 0, 1, "Pas de big bang", "S'il faut migrer les 70 modules avant de livrer quoi que ce soit, le coût irrécupérable bloquera le refactoring à mi-chemin", "Arrêter si le premier module n'est pas livré sous 14 jours", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Un refactoring big bang prend les délais en otage" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Une config typée partagée et des forks de composants par marque, c'est l'un ou l'autre" },
    { type: "excludes", from: "N1", to: "N5", why: "Un core partagé en trois couches et des copies de composants par marque s'excluent mutuellement" },
    { type: "excludes", from: "N4", to: "N11", why: "La config typée bloque déjà les contournements à la compilation : une revue manuelle des frontières devient un garde-fou redondant" },
    { type: "excludes", from: "N2", to: "N7", why: "Si les thèmes ne changent que des variables CSS, on ne remplace pas des composants de layout entiers" },
    { type: "excludes", from: "N2", to: "N10", why: "De pures variables CSS n'ont aucun champ de config à faire gonfler ; il faut choisir" },
    { type: "excludes", from: "N9", to: "N11", why: "Les chaînes d'héritage autorisent des surcharges locales, ce qui contredit un garde-fou zéro bypass" },
    { type: "requires", from: "N1", to: "N8", why: "Une fois découpé en trois couches, la personnalisation doit passer par des slots fixes, sinon la couche view est percée" },
    { type: "requires", from: "N4", to: "N10", why: "Les configs typées ont besoin d'un plafond de champs, sinon elles virent à l'enfer de la config" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Effort de refactoring initial", v: "Pas de fork rapide", t: "60 jours pour poser le squelette", l: "Tests d'intégrité obligatoires", x: "Pas de raccourci propre à une marque" },
      fatal: "N10", thesis: "Des frontières en trois couches et une config typée réduisent chaque thème à une simple feuille", title: "Piloté par config · 3 couches",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Peu de variation de layout", v: "Moins de liberté de design", t: "Petits pas chaque semaine", l: "Pas de layouts complexes", x: "Pas de personnalisation structurelle" },
      fatal: "N12", thesis: "Uniquement des variables CSS et de l'héritage, avec un déploiement progressif des thèmes en canary", title: "Style pur · progressif",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Code dupliqué", v: "Un correctif touche plein d'endroits", t: "Le plus rapide à livrer", l: "Coût de maintenance linéaire", x: "Renoncer à la config typée" },
      fatal: "N11", thesis: "Changer des layouts entiers et laisser chaque marque forker sa propre coque", title: "Forks par marque · châssis commun",
    },
  },
  recommend: { key: "alpha", why: "Avec plus de 100 thèmes, seule une approche pilotée par config garde la maintenance sous contrôle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tous les thèmes héritent du même thème par défaut", kill: "Si le défaut casse, le layout de tous les thèmes casse", label: "SPOF du défaut" },
};
