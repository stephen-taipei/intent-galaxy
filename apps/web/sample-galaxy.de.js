// 內建示範星系（IntentAnalysisResponse v1.0，德文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Schichtgrenzen", D2: "Ausdruck der Varianten", D3: "Anpassungsumfang", D4: "Theme-Aufbau" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Gegenposition: ${dims[dim]} ins andere Extrem treiben`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_DE = {
  schema_version: "1.0",
  core: {
    decision: "Soll jede Marke ihre eigenen Komponenten forken, oder soll ein gemeinsamer Core per Konfiguration gesteuert werden?",
    metric: "Innerhalb von 60 Tagen: ein neues Theme geht in ≤2 Tagen live, und das CSS jedes Themes bleibt unter 50KB",
  },
  quadrants: {
    Q1: { scar: "Gemeinsame Komponenten voller Marken-ifs", sacred: "Null Verzweigungen im Core" },
    Q2: { scar: "100+ Themes einzeln von Hand gepatcht", sacred: "Typen fangen Fehler ab" },
    Q3: { scar: "Ein Designsystem kopiert und überabstrahiert", sacred: "Austauschbare Struktur" },
    Q4: { scar: "Dreimal erlebt, wie Anpassungen ausufern", sacred: "Grenzen halten" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3-Schicht-Split", "Komponenten in einen reinen Core, einen koordinierenden View und ein Theme-Blatt aufteilen; der Core darf keine Theme-IDs oder Routen importieren", "Falsch, wenn innerhalb von 14 Tagen Theme-Abfragen im Core auftauchen", null),
    N2: node("D2", 0, 1, "Nur CSS-Vars", "Jeden Theme-Unterschied ausschließlich über CSS Custom Properties ausdrücken, ohne jede Verzweigung in Komponenten oder Layouts", "Falsch, wenn schon das 3. Theme Änderungen an Komponenten braucht", "Layout-Unterschiede lassen sich nicht allein mit Farben ausdrücken"),
    N3: node("D1", 1, 0, "Theme-CSS lazy", "Zur Laufzeit nur das eine Stylesheet des aktiven Themes laden, statt alle Themes in den ersten Paint zu bündeln", "Falsch, wenn das CSS eines einzelnen Themes innerhalb von 14 Tagen 50KB überschreitet", null),
    N4: node("D4", 0, 2, "Typ-Configs", "Jedes Theme liefert ein vollständiges TypeScript-Config-Objekt; jedes fehlende Feld lässt den Build scheitern", "Falsch, wenn ein neues Theme trotzdem Änderungen an gemeinsamen Komponenten verlangt", null),
    N5: node("D3", 2, 0, "Fork pro Marke", "Jedes Theme kopiert das Komponentenverzeichnis und ändert es unabhängig, sodass sich Marken nie gegenseitig beeinflussen", "Falsch, wenn nach dem 10. Theme ein Bugfix mehr als 10 Stellen berührt", "Ein Bugfix heißt N Kopien patchen"),
    N6: node("D3", 1, 2, "Canary-Themes", "Jedes neue Theme eine Woche lang hinter einem Feature Flag an 5 % der Mandanten ausliefern; erst auf 100 %, wenn die Fehlerrate im Ziel liegt", "Falsch, wenn die Canary-Fehlerrate 1 % überschreitet", null),
    N7: node("D3", 2, 1, "Hülle tauschen", "[D2 Fahrzeugplattform] Layouts sind wie Karosserien: Die ganze Hülle wird getauscht, während das gemeinsame Fahrgestell (View und Core) bleibt", "Falsch, wenn ein Layout-Tausch Änderungen am Core erfordert", "Interaktionen driften zwischen Layouts auseinander",
      { lateral: { src: "Automobilbau: Plattform-Fahrgestell", dist: 2, drop: "Jedes Modell von Grund auf neu konstruieren" } }),
    N8: node("D2", 1, 0, "Feste Slots", "[D3 LEGO-Steine] Layouts deklarieren feste Slots; Themes dürfen nur Komponenten in Slots stecken und keine Struktur außerhalb davon ändern", "Falsch, wenn auch nur einmal DOM außerhalb der Slots verändert wird", null,
      { lateral: { src: "Spielzeug: LEGO-Steckprinzip", dist: 3, drop: "Freie DOM-Anpassungen" } }),
    N9: node("D4", 2, 0, "Diffs erben", "[D4 Schriftfamilie] Themes deklarieren nur ihre Abweichung vom Default; alle anderen Felder werden automatisch geerbt", "Falsch, wenn die Vererbung tiefer als 3 Ebenen geht", null,
      { lateral: { src: "Typografie: Schriftschnitte einer Familie", dist: 4, drop: "Komplette Kopie pro Theme" } }),
    N10: node("D2", 2, 0, "Config deckeln", "Wenn jeder Anpassungswunsch ein Config-Feld hinzufügt, kostet die Pflege der Config zwangsläufig mehr als ein Fork", "Keine Felder mehr hinzufügen, sobald ein Config-Interface mehr als 40 Felder hat", "Config-Hölle",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraktion kostet mehr als Duplikation" } }),
    N11: node("D4", 1, 0, "Bypass sperren", "Wenn das Business Markenabfragen direkt in gemeinsamen Komponenten durchsetzen kann, fällt die Grenze innerhalb eines Quartals", "Hinfällig, wenn innerhalb von 14 Tagen eine Markenabfrage in gemeinsame Komponenten wandert", "Grenzen gegen Deadlines eintauschen",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadline-Druck belohnt Grenzverletzungen" } }),
    N12: node("D3", 0, 1, "Kein Big-Bang", "Wenn alle 70 Module migriert sein müssen, bevor irgendetwas live geht, bleibt das Refactoring wegen der Sunk Costs auf halber Strecke stecken", "Abbrechen, wenn das erste Modul nicht innerhalb von 14 Tagen live ist", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-Bang-Refactoring nimmt Deadlines als Geisel" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Gemeinsame typisierte Config und Komponenten-Forks pro Marke schließen sich gegenseitig aus" },
    { type: "excludes", from: "N1", to: "N5", why: "Ein gemeinsamer 3-Schicht-Core und Komponentenkopien pro Marke sind unvereinbar" },
    { type: "excludes", from: "N4", to: "N11", why: "Die typisierte Config blockiert Umgehungen schon beim Kompilieren, ein manueller Grenz-Review wäre eine doppelte Schranke" },
    { type: "excludes", from: "N2", to: "N7", why: "Wenn Themes nur CSS-Variablen ändern, werden keine ganzen Layout-Komponenten getauscht" },
    { type: "excludes", from: "N2", to: "N10", why: "Reine CSS-Variablen haben keine Config-Felder, die ausufern könnten; eins von beiden wählen" },
    { type: "excludes", from: "N9", to: "N11", why: "Vererbungsketten erlauben lokale Overrides, das widerspricht einer Leitplanke ohne jede Umgehung" },
    { type: "requires", from: "N1", to: "N8", why: "Nach dem 3-Schicht-Split müssen Themes über feste Slots anpassen, sonst wird die View-Schicht durchlöchert" },
    { type: "requires", from: "N4", to: "N10", why: "Typisierte Configs brauchen eine Feldobergrenze, sonst wuchern sie zur Config-Hölle" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refactoring-Aufwand vorab", v: "Keine schnellen Forks", t: "60 Tage für das Grundgerüst", l: "Integritätstests sind Pflicht", x: "Keine markenspezifischen Abkürzungen" },
      fatal: "N10", thesis: "3-Schicht-Grenzen plus typisierte Config schrumpfen jedes Theme auf ein einziges Blatt", title: "Config-gesteuert · 3 Schichten",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Begrenzte Layout-Varianz", v: "Weniger Designfreiheit", t: "Kleine Schritte pro Woche", l: "Komplexe Layouts sind ausgeschlossen", x: "Keine strukturellen Anpassungen" },
      fatal: "N12", thesis: "Nur CSS-Variablen und Vererbung nutzen und Themes schrittweise per Canary ausrollen", title: "Reines Styling · schrittweise",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplizierter Code", v: "Bugfixes an vielen Stellen", t: "Am schnellsten live", l: "Wartungskosten wachsen linear", x: "Verzicht auf typisierte Config" },
      fatal: "N11", thesis: "Ganze Layouts tauschen und jede Marke ihre eigene Hülle forken lassen", title: "Marken-Forks · gemeinsames Fahrgestell",
    },
  },
  recommend: { key: "alpha", why: "Bei 100+ Themes hält nur ein konfigurationsgesteuertes Design die Wartungskosten im Griff" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Jedes Theme erbt vom selben Default-Theme", kill: "Geht der Default kaputt, bricht das Layout jedes Themes", label: "Default-SPOF" },
};
