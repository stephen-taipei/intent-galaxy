// 內建示範星系（IntentAnalysisResponse v1.0，法文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Découpage du code", D2: "Différences entre thèmes", D3: "Profondeur de la personnalisation", D4: "Construction des réglages de thème" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'autre camp : prendre « ${dims[dim]} » dans le sens opposé`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_FR = {
  schema_version: "1.0",
  core: {
    decision: "Chaque marque doit-elle avoir sa propre copie des composants, ou toutes les marques doivent-elles partager un même cœur et gérer leurs différences par des fichiers de configuration ?",
    metric: "D'ici 60 jours : un nouveau thème sort en 2 jours maximum, et le CSS de chaque thème pèse moins de 50KB",
  },
  quadrants: {
    Q1: { scar: "Composants partagés truffés de conditions par marque", sacred: "Aucun test de marque dans le cœur" },
    Q2: { scar: "A corrigé à la main les mises en page de plus de 100 thèmes", sacred: "Laisser la vérification des types attraper les erreurs" },
    Q3: { scar: "A copié le design system d'un autre et l'a trop abstrait", sacred: "Des pièces qu'on remplace d'un bloc" },
    Q4: { scar: "A vu la personnalisation déraper trois fois", sacred: "Les couches restent séparées" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 couches", "Découper les composants en trois couches : un cœur qui ne contient que la logique, une vue qui relie les éléments, et une feuille de thème pour le style ; le cœur ne peut importer ni identifiant de thème ni routes", "Échoue si du code qui teste le thème apparaît dans le cœur sous 14 jours", null),
    N2: node("D2", 0, 1, "Vars CSS seules", "Écrire toutes les différences entre thèmes en variables CSS (propriétés personnalisées), sans aucun test de thème dans les composants ou les mises en page", "Échoue si le 3e thème exige déjà de modifier des composants", "Les différences de mise en page ne se règlent pas avec des couleurs"),
    N3: node("D1", 1, 0, "Un thème chargé", "Ne charger que la feuille de style du thème actif, au lieu de livrer tous les thèmes dès le premier affichage de la page", "Échoue si le CSS d'un thème dépasse 50KB sous 14 jours", null),
    N4: node("D4", 0, 2, "Configs typées", "Chaque thème fournit un objet de configuration TypeScript complet ; s'il manque un champ, le build échoue", "Échoue si un nouveau thème oblige encore à modifier les composants partagés", null),
    N5: node("D3", 2, 0, "Copie à part", "Chaque thème copie le dossier des composants et le modifie de son côté, pour que les marques ne se gênent jamais", "Échoue si, après le 10e thème, corriger un bug oblige à modifier plus de 10 endroits", "Un correctif = toutes les copies à reprendre"),
    N6: node("D3", 1, 2, "D'abord à 5 %", "Activer chaque nouveau thème pour 5 % des clients seulement pendant une semaine, via un interrupteur ; l'ouvrir à tous seulement si le taux d'erreur reste dans la cible", "Échoue si le taux d'erreur dépasse 1 % pendant cette semaine", null),
    N7: node("D3", 2, 1, "Coque à changer", "Comme des voitures qui partagent un châssis et ne changent que la carrosserie : on remplace toute une mise en page, la vue et le cœur communs en dessous ne bougent pas", "Échoue si changer de mise en page oblige à toucher au cœur", "Les commandes peuvent se comporter différemment d'une mise en page à l'autre",
      { lateral: { src: "Automobile : châssis commun", dist: 2, drop: "Un nouveau moule pour chaque modèle" } }),
    N8: node("D2", 1, 0, "Cases fixes", "Comme des briques LEGO qui ne s'emboîtent que sur leurs plots : les mises en page définissent des emplacements fixes, les thèmes ne peuvent placer des composants que dans ces emplacements, et rien autour ne peut changer", "Échoue si la page (DOM) hors des emplacements est modifiée ne serait-ce qu'une fois", null,
      { lateral: { src: "Jouets : briques LEGO", dist: 3, drop: "Modifier le DOM librement" } }),
    N9: node("D4", 2, 0, "Que les écarts", "Comme les versions grasse et légère d'une même police : un thème ne liste que ce qui diffère du thème par défaut, tout le reste est repris automatiquement", "Échoue si l'héritage dépasse 3 niveaux", null,
      { lateral: { src: "Typographie : graisses d'une police", dist: 4, drop: "Une copie complète par thème" } }),
    N10: node("D2", 2, 0, "Max 40 réglages", "Si chaque demande de personnalisation ajoute un champ de configuration, entretenir la configuration finira par coûter plus cher qu'une simple copie", "Arrêter d'ajouter des champs dès qu'une interface de configuration dépasse 40 champs", "Tant de réglages que plus personne ne les comprend",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'abstraction finit par coûter plus que du code copié" } }),
    N11: node("D4", 1, 0, "Pas d'exception", "Si le métier peut exiger des tests de marque directement dans les composants partagés, les couches ne tiendront pas un trimestre", "Abandonner ce plan si un seul test de marque est ajouté aux composants partagés sous 14 jours", "Sacrifier les couches pour tenir une échéance",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Tenir l'échéance est félicité ; casser les couches n'est jamais sanctionné" } }),
    N12: node("D3", 0, 1, "Pas de refonte", "S'il faut migrer les 70 modules avant de livrer quoi que ce soit, plus on a investi, plus il est dur d'arrêter, et la refonte a tendance à caler à mi-chemin", "Arrêter si le premier module n'est pas livré sous 14 jours", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Tout réécrire d'un coup fait exploser le calendrier" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Une configuration typée commune et une copie séparée par marque : il faut choisir l'un ou l'autre" },
    { type: "excludes", from: "N1", to: "N5", why: "Un cœur commun en trois couches et une copie des composants par marque : il faut choisir l'un ou l'autre" },
    { type: "excludes", from: "N4", to: "N11", why: "La configuration typée bloque déjà les raccourcis au moment du build, donc une relecture manuelle des couches vérifie deux fois la même chose" },
    { type: "excludes", from: "N2", to: "N7", why: "Si les thèmes ne changent que des variables CSS, personne ne remplace des composants de mise en page entiers" },
    { type: "excludes", from: "N2", to: "N10", why: "Avec uniquement des variables CSS, il n'y a pas de champs de configuration qui s'accumulent ; il faut choisir" },
    { type: "excludes", from: "N9", to: "N11", why: "L'héritage permet à un thème de modifier des détails localement, ce qui va à l'encontre d'un garde-fou qui interdit tout contournement des couches" },
    { type: "requires", from: "N1", to: "N8", why: "Avec trois couches, les thèmes doivent passer par des emplacements fixes, sinon la couche vue se fait bricoler de partout" },
    { type: "requires", from: "N4", to: "N10", why: "Les configurations typées ont besoin d'un nombre maximum de champs, sinon elles grossissent jusqu'à ce que plus personne ne les comprenne" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Travail de refonte au départ", v: "Pas de copie rapide", t: "60 jours pour poser la structure", l: "Des tests complets obligatoires", x: "Aucun raccourci propre à une marque" },
      fatal: "N10", thesis: "Trois couches pour les composants et un fichier de configuration typé par thème : chaque thème n'est plus qu'une configuration", title: "Piloté par config · 3 couches",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Peu de variété de mise en page", v: "Moins de liberté de design", t: "Un petit changement chaque semaine", l: "Pas de mises en page complexes", x: "Pas de changement de structure des pages" },
      fatal: "N12", thesis: "Uniquement des variables CSS et de l'héritage ; montrer les nouveaux thèmes à quelques utilisateurs d'abord, puis élargir", title: "Styles seuls · déploiement progressif",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Code dupliqué", v: "Un correctif touche plein d'endroits", t: "Le plus rapide à livrer", l: "Plus de thèmes, plus d'entretien", x: "Renoncer à la configuration typée" },
      fatal: "N11", thesis: "Remplacer des mises en page entières et laisser chaque marque copier sa propre coque", title: "Copies par marque · châssis commun",
    },
  },
  recommend: { key: "alpha", why: "Avec plus de 100 thèmes, seule une approche pilotée par la configuration garde l'entretien sous contrôle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tous les thèmes héritent du même thème par défaut", kill: "Si le thème par défaut casse, la mise en page de tous les thèmes casse avec lui", label: "Défaut unique" },
};
