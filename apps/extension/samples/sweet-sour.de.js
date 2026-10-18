// 擴充功能內建生活題示範星系（德文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Woher das Süße kommt", D2: "Ventil für Heißhunger", D3: "Umfang der Umstellung", D4: "Vorrat zu Hause" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Die Gegenposition treibt ${dims[dim]} ins andere Extrem`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_DE = {
  schema_version: "1.0",
  core: {
    decision: "Ersetzt du alles Süße durch ganzes Obst, oder isst du weiter, was du magst, nur weniger davon?",
    metric: "30 Tage lang höchstens 3 zuckerhaltige Snacks und Getränke pro Woche zusammen (zur Kontrolle im Handy notiert)",
  },
  quadrants: {
    Q1: { scar: "Eine ganze Tüte Trockenobst gegessen und es für einen gesunden Snack gehalten", sacred: "Süße kommt nur aus ganzem Obst" },
    Q2: { scar: "Dreimal auf Zucker verzichtet und jedes Mal in Woche zwei eingeknickt", sacred: "Es zählt nur, was man wirklich durchhält" },
    Q3: { scar: "Einen Low-Carb-Plan kopiert und nach drei Tagen satt gehabt", sacred: "Die Methode ändern, nicht den Geschmack" },
    Q4: { scar: "Zu viele gesehen, die auf Zucker verzichten und gleich wieder zurückrutschen", sacred: "Regeln schlagen Willenskraft" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Nur ganzes Obst", "Wenn du Lust auf Süßes hast, nur ganzes frisches Obst essen, etwa Kiwi, Ananas, Beeren oder Orangen; Saft, Trockenobst und kandierte Früchte zählen nicht", "Gescheitert, wenn du innerhalb von 14 Tagen an mehr als 3 Tagen Süßes kaufst, um den Heißhunger zu stillen", null),
    N2: node("D2", 0, 1, "Sprudel trinken", "Bei Heißhunger zuerst ein Glas ungesüßtes Sprudelwasser mit Zitrone oder Maracuja trinken; willst du nach 15 Minuten immer noch etwas Süßes, heb es dir für nach der nächsten Mahlzeit auf. Nur die Getränke ändern sich: Die Mahlzeiten bleiben gleich, und es werden keine Ersatz-Snacks gekauft", "Gescheitert, wenn du innerhalb von 14 Tagen in mehr als der Hälfte der Fälle nach den 15 Minuten noch Lust auf Süßes hast", "Ein Getränk stillt nicht das Bedürfnis, etwas zu kauen"),
    N3: node("D1", 1, 0, "Nur nach Essen", "Süß-saure Snacks und Obst nur innerhalb von 1 Stunde nach einer Mahlzeit essen; nichts auf leeren Magen und nichts in den 3 Stunden vor dem Schlafengehen", "Gescheitert, wenn du nach 14 Tagen immer noch an mehr als 3 Abenden vor dem Schlafen nach Snacks suchst", null),
    N4: node("D4", 0, 2, "Süßes verbannen", "Einmal pro Woche einkaufen: saisonales Obst kistenweise und genug ungesüßten Naturjoghurt für die Woche; das sind die einzigen Snacks im Haus, Zuckriges kommt nie mit nach Hause", "Gescheitert, wenn es innerhalb von 14 Tagen noch eine Woche gibt, in der du unterwegs mehr als 3-mal Süßes kaufst", null),
    N5: node("D3", 2, 0, "Lieblinge halb", "Die süß-sauren Lieblingssnacks weiter essen, nur weniger: auf Einzelportionen umsteigen und die Tagesmenge halbieren, ohne Ersatz", "Gescheitert, wenn du ab Woche 2 an mehr als 2 Tagen pro Woche mehr als die Hälfte deiner alten Menge isst", "Oft wird direkt nach der ersten Packung die zweite aufgerissen"),
    N6: node("D3", 1, 2, "Neues antesten", "Von jeder neuen ungesüßten Getränkesorte die kleinste Packung kaufen und 3 Tage hintereinander trinken; nur wenn sie schmeckt, einen ganzen Kasten kaufen, nie alles auf einmal horten", "Gescheitert, wenn eine nach dem Test kastenweise gekaufte Sorte 14 Tage später noch mehr als halb voll ist", null),
    N7: node("D3", 2, 1, "Soße tauschen", "Wie eine neue Handyhülle statt eines neuen Handys: die Hauptzutaten von süß-saurem Schweinefleisch oder Fisch behalten, die Soße aber selbst aus Tomate, Ananas und Essig mit halb so viel Zucker machen", "Gescheitert, wenn nach 2 Versuchen mit der neuen Soße innerhalb von 14 Tagen alle zu Hause sagen, dass es nicht schmeckt", "Im Restaurant und beim Lieferdienst lässt sich die Soße nicht ändern",
      { lateral: { src: "Technik: Handyhülle wechseln", dist: 2, drop: "Das Gericht ganz vom Speiseplan streichen" } }),
    N8: node("D2", 1, 0, "Max 3 Portionen", "Wie die Freigepäckgrenze im Flugzeug: höchstens 3 Portionen Obst und süß-saure Snacks zusammen pro Tag, jede etwa faustgroß; alles darüber wartet bis morgen, statt im Moment auf Willenskraft zu setzen", "Gescheitert, wenn du an mehr als 2 Tagen pro Woche mehr als 3 Portionen isst", null,
      { lateral: { src: "Luftfahrt: Freigepäckgrenze", dist: 3, drop: "Essen, wann immer man will, ohne Limit" } }),
    N9: node("D4", 2, 0, "Sprudel bunkern", "Nachfüllen wie ein Supermarkt, bevor das Regal leer ist: immer einen Kasten ungesüßtes Sprudelwasser und ein Netz Zitronen im Kühlschrank haben und bei 3 übrigen Flaschen nachkaufen, damit dich der Heißhunger nie zu Bubble Tea oder Limo treibt", "Gescheitert, wenn du innerhalb von 14 Tagen immer noch mehr als 3 gesüßte Getränke unterwegs kaufst", null,
      { lateral: { src: "Einzelhandel: nachfüllen vor dem Ausverkauf", dist: 4, drop: "Ein Getränk erst kaufen, wenn man Lust darauf hat" } }),
    N10: node("D2", 2, 0, "Ersatz deckeln", "Kosten Ersatz-Snacks wie Obst und ungesüßter Joghurt mehr als doppelt so viel wie deine bisherigen Snack-Ausgaben pro Woche, gibst du innerhalb eines Monats auf und kaufst wieder Snacks", "Stoppen, wenn Ersatz-Snacks innerhalb von 14 Tagen mehr als das Doppelte des alten Snack-Budgets kosten", "Obstpreise schwanken stark mit der Saison",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Der Ersatz ist auf Dauer zu teuer" } }),
    N11: node("D4", 1, 0, "Keine Großpacks", "Wer Essen und Getränke kistenweise kauft, um Versandkosten zu sparen oder einen Mengenrabatt mitzunehmen, isst umso mehr, je mehr im Haus ist", "Stoppen, wenn du innerhalb von 14 Tagen mehr als einmal kistenweise oder für den Mindestbestellwert einkaufst", "Süßes, das Freunde und Familie mitbringen, hast du nicht in der Hand",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Rabatte verleiten zu immer mehr Einkäufen" } }),
    N12: node("D3", 0, 1, "Keine Gadgets", "Wer erst einen Wassersprudler, Süßstoffe und jede Art von Ersatzprodukt kauft, bevor es losgeht, zwingt sich wegen des ausgegebenen Geldes Dinge rein, die er nicht mag, und gibt innerhalb von 2 Wochen auf", "Stoppen, wenn du innerhalb von 14 Tagen mehr als 1 Gerät oder Ersatzprodukt kaufst, das du gar nicht benutzt", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Man würgt es runter, damit nichts verschwendet wird" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Zuckriges aus dem Haus verbannen und trotzdem die üblichen Süßigkeiten essen geht nicht beides" },
    { type: "excludes", from: "N1", to: "N5", why: "Wenn Süße nur aus ganzem Obst kommt, kannst du die geliebten zuckrigen Snacks nicht behalten" },
    { type: "excludes", from: "N4", to: "N11", why: "Das Obst zu Hause hängt am wöchentlichen Kistenkauf; wer kistenweises Kaufen verbietet, dem bricht dieser Vorrat weg" },
    { type: "excludes", from: "N2", to: "N7", why: "Dieser Weg ändert nur die Getränke und lässt die Mahlzeiten in Ruhe, das widerspricht dem Umbau der süß-sauren Soße" },
    { type: "excludes", from: "N2", to: "N10", why: "Dieser Weg ändert nur die Getränke und kauft keine Ersatz-Snacks; ein Budgetlimit für Ersatz-Snacks gehört zu einem anderen Weg, also eins wählen" },
    { type: "excludes", from: "N9", to: "N11", why: "Sprudelwasser vorrätig zu halten heißt, es kistenweise zu kaufen, das kollidiert direkt mit dem Verzicht auf Großpackungen" },
    { type: "requires", from: "N1", to: "N8", why: "Auch Obst hat Zucker; selbst wenn Obst deine einzige Süßigkeit ist, brauchst du ein Tageslimit, sonst belastet zu viel trotzdem den Körper" },
    { type: "requires", from: "N4", to: "N10", why: "Jede Woche kistenweise Obst und Joghurt kaufen summiert sich, also braucht es ein Budgetlimit, sonst gibt zuerst der Geldbeutel auf" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ein fester Großeinkauf pro Woche", v: "Verzicht auf die Lieblingssnacks", t: "Die ersten zwei Wochen Heißhunger sind hart", l: "Höchstens drei Portionen Obst am Tag", x: "Kein spontaner Gang zum Bäcker für Süßes" },
      fatal: "N10", thesis: "Süßes nur aus ganzem Obst in begrenzter Menge, und Zuckriges bleibt aus dem Haus", title: "Auf Obst umsteigen · nichts Süßes daheim",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Sprudelwasser im Kühlschrank vorrätig halten", v: "Bei Heißhunger 15 Minuten warten", t: "Pro Woche nur wenig ändern", l: "Der Zucker in den Mahlzeiten bleibt gleich", x: "Die alten Snacks nicht mehr wie gewohnt essen" },
      fatal: "N12", thesis: "Bei Heißhunger zu ungesüßtem Sprudel greifen und neue Sorten erst in kleinen Mengen testen, bevor du mehr kaufst", title: "Erst Getränke tauschen · langsam reduzieren",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Jedes Mal Portionen zählen", v: "Süßes zu Hause lockt weiterhin", t: "Ergebnisse brauchen lange", l: "Weniger essen hängt ganz an der Selbstdisziplin", x: "Verzicht auf den kompletten Umstieg auf Obst" },
      fatal: "N11", thesis: "Weiter essen, was du magst, aber auf kleine Packungen umsteigen, Portionen begrenzen und die süß-saure Soße neu machen", title: "Lieblinge behalten · begrenzen und Soße tauschen",
    },
  },
  recommend: { key: "alpha", why: "Obst ist von Natur aus süß und säuerlich, und Zuckriges aus dem Haus zu halten kostet am wenigsten Willenskraft" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Dein ganzes Verlangen nach Süß-Saurem hängt an einer einzigen Obstsorte oder einem Getränk", kill: "Ist genau das ausverkauft oder hast du es satt, bricht der ganze Plan zusammen", label: "Nur ein Ersatz" },
};
