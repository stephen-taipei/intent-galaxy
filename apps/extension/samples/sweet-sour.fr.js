// 擴充功能內建生活題示範星系（法文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "D'où vient le sucré", D2: "Comment gérer l'envie", D3: "Ampleur du changement", D4: "Ce qu'il y a à la maison" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Le point de vue opposé pousse ${dims[dim]} à l'autre extrême`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_FR = {
  schema_version: "1.0",
  core: {
    decision: "Faut-il remplacer toutes les douceurs par des fruits entiers, ou continuer à manger ce qu'on aime, simplement en moindre quantité ?",
    metric: "Sur 30 jours, pas plus de 3 en-cas et boissons sucrés par semaine au total (notés sur le téléphone pour vérifier)",
  },
  quadrants: {
    Q1: { scar: "A mangé tout un sachet de fruits secs en pensant que c'était sain", sacred: "Le sucré ne vient que des fruits entiers" },
    Q2: { scar: "A arrêté le sucre trois fois, et craqué la deuxième semaine à chaque fois", sacred: "Ça ne compte que si on peut vraiment tenir" },
    Q3: { scar: "A copié un régime pauvre en glucides et s'en est lassé en trois jours", sacred: "Changer la méthode, pas le goût" },
    Q4: { scar: "A vu trop de gens arrêter le sucre et replonger aussitôt", sacred: "Se fixer des règles plutôt que compter sur la volonté" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fruits entiers", "Dès qu'on a envie de sucré, ne manger que des fruits frais entiers, comme kiwi, ananas, fruits rouges ou oranges ; jus, fruits secs et fruits confits ne comptent pas", "Échoue si, en 14 jours, vous achetez un dessert pour calmer une envie plus de 3 jours", null),
    N2: node("D2", 0, 1, "Eau pétillante", "Quand l'envie arrive, boire d'abord un verre d'eau pétillante non sucrée au citron ou au fruit de la passion ; si l'envie est toujours là 15 minutes plus tard, garder la douceur pour après le prochain repas. Seules les boissons changent : les repas restent les mêmes et on n'achète pas d'en-cas de substitution", "Échoue si, en 14 jours, l'envie de sucré persiste après les 15 minutes plus d'une fois sur deux", "Une boisson ne calme pas l'envie de mâcher quelque chose"),
    N3: node("D1", 1, 0, "Après repas", "Ne manger en-cas aigres-doux et fruits que dans l'heure qui suit un repas ; rien à jeun et rien dans les 3 heures avant le coucher", "Échoue si, après 14 jours, vous allez encore chercher un en-cas avant de dormir plus de 3 soirs", null),
    N4: node("D4", 0, 2, "Rien de sucré", "Faire les courses une fois par semaine : des fruits de saison au cageot et assez de yaourt nature non sucré pour la semaine ; ce sont les seuls en-cas de la maison, et les en-cas sucrés n'y entrent jamais", "Échoue si, en 14 jours, il y a encore une semaine où vous achetez des sucreries dehors plus de 3 fois", null),
    N5: node("D3", 2, 0, "Moitié moins", "Continuer à manger les en-cas aigres-doux qu'on aime, mais moins : passer aux portions individuelles et diviser la quantité quotidienne par deux, sans substitut", "Échoue si, dès la 2e semaine, vous mangez plus de la moitié de votre ancienne quantité plus de 2 jours par semaine", "On ouvre souvent un deuxième sachet juste après le premier"),
    N6: node("D3", 1, 2, "Tester boissons", "Pour chaque nouvelle saveur de boisson non sucrée, acheter le plus petit format et en boire 3 jours de suite ; n'acheter un pack entier que si elle plaît, jamais de stock d'un coup", "Échoue si une saveur achetée en pack après le test est encore à moitié pleine 14 jours plus tard", null),
    N7: node("D3", 2, 1, "Changer sauce", "Comme changer la coque du téléphone plutôt que le téléphone : garder les ingrédients principaux du porc ou du poisson aigre-doux, mais faire la sauce soi-même avec tomate, ananas et vinaigre, avec moitié moins de sucre", "Échoue si, après avoir fait la nouvelle sauce 2 fois en 14 jours, toute la maison la trouve mauvaise", "Impossible de changer la sauce au restaurant ou en livraison",
      { lateral: { src: "Tech : changer la coque du téléphone", dist: 2, drop: "Rayer complètement le plat du menu" } }),
    N8: node("D2", 1, 0, "3 portions max", "Comme la franchise bagages en avion : au maximum 3 portions de fruits et d'en-cas aigres-doux par jour, chacune grosse comme le poing ; le surplus attend demain, au lieu de compter sur la volonté du moment", "Échoue si vous dépassez 3 portions plus de 2 jours dans la semaine", null,
      { lateral: { src: "Aérien : franchise de poids bagages", dist: 3, drop: "Manger quand on veut, sans limite" } }),
    N9: node("D4", 2, 0, "Stock pétillant", "Réapprovisionner comme une supérette avant la rupture : toujours un pack d'eau pétillante non sucrée et un filet de citrons au frigo, et racheter un pack quand il reste 3 bouteilles, pour qu'une envie ne vous envoie jamais acheter un soda ou un thé glacé", "Échoue si, en 14 jours, vous achetez encore plus de 3 boissons sucrées à emporter", null,
      { lateral: { src: "Commerce : réassort avant rupture", dist: 4, drop: "N'acheter une boisson que quand on en a envie" } }),
    N10: node("D2", 2, 0, "Budget plafonné", "Si les en-cas de substitution comme les fruits et le yaourt nature coûtent plus du double de votre ancien budget grignotage hebdomadaire, vous abandonnerez en moins d'un mois et reviendrez aux en-cas", "Arrêter si, en 14 jours, les substituts coûtent plus du double de votre ancien budget grignotage", "Le prix des fruits varie beaucoup selon la saison",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Les substituts coûtent trop cher pour durer" } }),
    N11: node("D4", 1, 0, "Pas de lots", "Si vous achetez nourriture et boissons par lots pour avoir la livraison gratuite ou une remise, plus il y en a à la maison, plus vous en mangez chaque jour", "Arrêter si, en 14 jours, vous achetez nourriture ou boissons par lots ou pour atteindre un minimum de livraison gratuite plus d'une fois", "On ne contrôle pas les douceurs offertes par les proches",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Les promos font acheter toujours plus" } }),
    N12: node("D3", 0, 1, "Sans gadgets", "Si vous attendez d'avoir acheté une machine à soda, des édulcorants et tous les substituts possibles avant de commencer, l'argent dépensé vous poussera à avaler ce que vous n'aimez pas, et vous lâcherez en 2 semaines", "Arrêter si, en 14 jours, vous achetez plus d'1 gadget ou substitut que vous n'utilisez pas vraiment", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "On se force à finir pour ne pas gaspiller" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Ne plus avoir d'en-cas sucrés à la maison et continuer à manger ses en-cas sucrés habituels sont incompatibles" },
    { type: "excludes", from: "N1", to: "N5", why: "Si le sucré ne vient que des fruits entiers, on ne peut pas garder les en-cas sucrés qu'on aime" },
    { type: "excludes", from: "N4", to: "N11", why: "Les fruits de la maison reposent sur l'achat d'un cageot chaque semaine ; interdire les achats par lots fait tomber ce plan d'approvisionnement" },
    { type: "excludes", from: "N2", to: "N7", why: "Cette piste ne change que les boissons et laisse les repas tels quels, ce qui contredit le fait de revoir la sauce aigre-douce" },
    { type: "excludes", from: "N2", to: "N10", why: "Cette piste ne change que les boissons et n'achète aucun en-cas de substitution , donc un plafond de dépenses pour ces substituts ne s'applique pas ; il faut choisir" },
    { type: "excludes", from: "N9", to: "N11", why: "Garder de l'eau pétillante en stock, c'est l'acheter par packs, ce qui heurte de front l'interdiction des achats par lots" },
    { type: "requires", from: "N1", to: "N8", why: "Les fruits contiennent aussi du sucre ; même s'ils sont votre seule douceur, il faut une limite quotidienne, sinon trop en manger pèse quand même" },
    { type: "requires", from: "N4", to: "N10", why: "Acheter fruits et yaourts au cageot chaque semaine finit par coûter cher : il faut un plafond de dépenses, sinon c'est le porte-monnaie qui lâche en premier" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Une seule tournée de courses fixe par semaine", v: "Renoncer aux en-cas qu'on aime", t: "Les deux premières semaines d'envies sont dures", l: "Au maximum trois portions de fruits par jour", x: "Pas de dessert acheté sur un coup de tête" },
      fatal: "N10", thesis: "Ne trouver son sucré que dans les fruits entiers, en quantité limitée, et garder les en-cas sucrés hors de la maison", title: "Passer aux fruits · zéro sucrerie à la maison",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Garder de l'eau pétillante en stock au frigo", v: "Attendre 15 minutes avant de céder à une envie", t: "Ne changer qu'un peu chaque semaine", l: "Le sucre des repas reste le même", x: "Plus question de manger ses anciens en-cas comme avant" },
      fatal: "N12", thesis: "Prendre de l'eau pétillante non sucrée quand l'envie arrive, et tester les nouvelles saveurs en petite quantité avant d'en racheter", title: "Changer de boisson d'abord · réduire doucement",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Compter les portions à chaque fois", v: "Les douceurs de la maison tentent toujours", t: "Les résultats mettent longtemps à venir", l: "Réduire repose entièrement sur la maîtrise de soi", x: "Renoncer à passer entièrement aux fruits" },
      fatal: "N11", thesis: "Continuer à manger ce qu'on aime, mais en petits formats, avec des portions limitées et une sauce aigre-douce revisitée", title: "Garder ses favoris · limiter et changer la sauce",
    },
  },
  recommend: { key: "alpha", why: "Les fruits sont naturellement sucrés et acidulés, et garder les en-cas sucrés hors de la maison demande le moins de volonté" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Toutes vos envies aigres-douces reposent sur un seul fruit ou une seule boisson", kill: "Si ce produit est en rupture ou que vous vous en lassez, tout le plan s'effondre", label: "Un seul substitut" },
};
