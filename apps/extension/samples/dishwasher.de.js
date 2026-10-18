// 擴充功能生活題示範星系（德文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Standort", D2: "Auswahlkriterium", D3: "Umbauaufwand", D4: "Kapazität & Geschirr" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Die Gegenseite treibt ${dims[dim]} ins andere Extrem`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_DE = {
  schema_version: "1.0",
  core: {
    decision: "Baust du die Küche für eine Spülmaschine um, oder suchst du dir eine aus, die in deine jetzige Küche passt?",
    metric: "In den ersten 30 Tagen mindestens 5 Spülgänge pro Woche und höchstens 5 Minuten Abwasch von Hand pro Tag",
  },
  quadrants: {
    Q1: { scar: "Spülmaschine gekauft und trotzdem von Hand gespült", sacred: "Erst das Geschirr zählen" },
    Q2: { scar: "Erst beim Einbau gemerkt, dass der Schlauch zu kurz ist", sacred: "Erst messen, dann kaufen" },
    Q3: { scar: "Nach einer Online-Bestenliste gekauft und sie passte nicht", sacred: "Ideen aus anderen Bereichen leihen" },
    Q4: { scar: "Dreimal gesehen, wie Spülmaschinen zum Abtropfgestell wurden", sacred: "Zuerst das Scheitern planen" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Einbau an Spüle", "Den 45- oder 60-cm-Unterschrank neben der Spüle ausbauen und die Maschine einbauen, damit sie keine Arbeitsfläche belegt und den Laufweg nicht blockiert", "Passt nicht, wenn Breite, Höhe oder Tiefe des Schranks kleiner sind als die angegebenen Einbaumaße", null),
    N2: node("D2", 0, 1, "Nach dem Essen", "Ein Modell mit Kurzprogramm unter 1 Stunde wählen und nach jeder Mahlzeit laufen lassen, damit nie schmutziges Geschirr über Nacht in der Spüle steht", "Passt nicht, wenn das Geschirr nach dem Kurzprogramm innerhalb von 14 Tagen mehr als 2-mal noch fettig ist", "Kurzprogramme trocknen meist nicht, das Geschirr muss an der Luft trocknen"),
    N3: node("D1", 1, 0, "Neben die Spüle", "Die Maschine höchstens 1 Meter von der Spüle aufstellen und den Ablaufschlauch direkt in den Spülenabfluss führen, ohne Wanddurchbruch oder neue Leitungen", "Passt nicht, wenn der mitgelieferte Ablaufschlauch nicht bis zur Spüle reicht und verlängert werden muss", null),
    N4: node("D4", 0, 2, "Für die Familie", "Ab 3 Personen im Haushalt mindestens 12 Maßgedecke wählen, damit Töpfe und Geschirr in einen Durchgang passen statt in zwei", "Passt nicht, wenn Geschirr und Töpfe an mehr als 2 von 14 Tagen nicht in einen Durchgang passen", null),
    N5: node("D3", 2, 0, "Tischgerät", "Ein Tischgerät mit höchstens 8 Maßgedecken kaufen: kein Schrankausbau, keine Änderungen an den Leitungen, und es zieht mit dir um", "Passt nicht, wenn an mehr als 3 von 14 Tagen 2 Durchgänge nötig sind, bis alles sauber ist", "Nimmt ein gutes Stück Arbeitsfläche weg"),
    N6: node("D3", 1, 2, "Erst testen", "Ein Modell kaufen, das freistehend oder eingebaut funktioniert, es volle 30 Tage neben der Spüle stehen lassen und erst dann entscheiden, ob der Schrank raus soll, statt ihn am ersten Tag herauszureißen", "Passt nicht, wenn die Maschine während der 30-tägigen Testphase den Laufweg oder eine Schublade blockiert", null),
    N7: node("D3", 2, 1, "Tank statt Hahn", "Wie ein Wohnmobil mit eigenem Wassertank: ein Tischgerät wählen, das man von Hand befüllt, ohne Wasserhahnanschluss und ohne Änderungen an den Leitungen", "Passt nicht, wenn du in irgendeiner Woche 2-mal oder öfter von Hand spülst, weil dir das Befüllen zu lästig war", "Das Befüllen nervt mehr, als man denkt",
      { lateral: { src: "Camping: eingebauter Wassertank", dist: 2, drop: "Fester Anschluss am Wasserhahn" } }),
    N8: node("D2", 1, 0, "Erst messen", "Wie die Checkliste eines Piloten vor dem Start: vor der Bestellung Breite, Tiefe und Höhe messen, dann Steckdose und Abfluss prüfen; fehlt einer der 5 Punkte, wird nicht bestellt", "Passt nicht, wenn irgendetwas nicht stimmt oder sich die Maschine nach der Lieferung nicht einbauen lässt", null,
      { lateral: { src: "Luftfahrt: Checkliste vor dem Start", dist: 3, drop: "Aus dem Bauch heraus bestellen" } }),
    N9: node("D4", 2, 0, "Nur spülfest", "Wie ein Restaurant, das nur spülmaschinenfestes Geschirr nutzt: jeden Topf und jedes Teil ohne Spülmaschinen-Symbol ersetzen, sodass nichts mehr von Hand gespült werden muss", "Passt nicht, wenn du in den 14 Tagen nach dem Austausch immer noch mehr als 3 Teile pro Tag von Hand spülst", null,
      { lateral: { src: "Gastronomie: Profi-Geschirr", dist: 4, drop: "Zusammengewürfeltes altes Geschirr" } }),
    N10: node("D2", 2, 0, "Nie halb voll", "Läuft sie weniger als halb voll, verbraucht sie fast so viel Wasser und Strom wie eine volle Ladung, jedes Teil kostet also mehr als doppelt so viel", "Vor der Bestellung 7 Tage lang das Geschirr notieren; liegt der Schnitt unter 6 Maßgedecken pro Tag, auf ein Tischgerät umsteigen", "Das Geschirr fängt an zu riechen, während du auf eine volle Ladung wartest",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Eine große Maschine halb leer laufen zu lassen lohnt sich nicht" } }),
    N11: node("D4", 1, 0, "Töpfe raus", "Wenn man aus Bequemlichkeit Bräter und Suppentöpfe hineinstopft, passt das Geschirr bei einem Tischgerät nicht mehr in einen Durchgang und man spült wieder von Hand", "Verwerfen, wenn Töpfe innerhalb von 14 Tagen mehr als 2-mal einen zweiten Durchgang erzwingen", "Nicht alle im Haushalt halten sich an die Regel",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Aus Bequemlichkeit die Maschine überladen" } }),
    N12: node("D3", 0, 1, "Kein Umbau", "Wenn aus dem Einbau einer Spülmaschine schleichend eine komplette Küchenrenovierung wird, kommst du nicht mehr raus, sobald die Arbeiten laufen und das Geld bezahlt ist", "Nicht anfangen, wenn das Angebot vor dem Schrankausbau mehr als das 2-Fache des Gerätepreises beträgt", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Sind die Arbeiten erst begonnen, gibt es kein Zurück" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Eine Maschine mit 12+ Maßgedecken passt nicht auf die Arbeitsfläche, also entweder sie oder ein Tischgerät" },
    { type: "excludes", from: "N1", to: "N5", why: "Ist eine Maschine im Schrank eingebaut, kaufst du nicht noch ein Tischgerät; es ist das eine oder das andere" },
    { type: "excludes", from: "N4", to: "N11", why: "Größer zu kaufen heißt gerade, auch Töpfe mitzuspülen, das widerspricht der Regel, Töpfe draußen zu lassen" },
    { type: "excludes", from: "N2", to: "N7", why: "Nach jeder Mahlzeit spülen heißt, den Tank dreimal am Tag von Hand zu befüllen, das hält kaum jemand durch" },
    { type: "excludes", from: "N2", to: "N10", why: "Nach jeder Mahlzeit spülen heißt oft weniger als eine halbe Ladung, das widerspricht der Regel, nie halb voll zu spülen" },
    { type: "excludes", from: "N9", to: "N11", why: "Auf spülmaschinenfeste Töpfe umzusteigen heißt gerade, sie hineinzustellen, das widerspricht der Regel, Töpfe draußen zu lassen" },
    { type: "requires", from: "N1", to: "N8", why: "Schon 1 cm daneben und sie passt nicht in den Schrank, also vor der Bestellung alles messen" },
    { type: "requires", from: "N4", to: "N10", why: "Eine große Maschine halb leer verbraucht trotzdem Wasser und Strom für eine volle Ladung, also nie halb voll spülen" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Schrankausbau und Montagekosten", v: "Ein Schrank weniger Stauraum", t: "Auf einen Monteur für Aufmaß und Einbau warten", l: "Erst ab halber Ladung spülen", x: "Verzicht auf das Tischgerät" },
      fatal: "N10", thesis: "Schrank ausmessen, eine große Maschine einbauen, erst ab halber Ladung spülen", title: "Große Einbaumaschine, einmal richtig",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Neues Geschirr, dazu Wasser und Strom bei jeder Mahlzeit", v: "Blockiert während der Testphase den Laufweg", t: "Der Schrank kommt erst nach 30 Tagen raus", l: "Nach Kurzprogrammen an der Luft trocknen", x: "Verzicht auf das Tischgerät" },
      fatal: "N12", thesis: "Nach jeder Mahlzeit kurz spülen; neben der Spüle lassen, bis es klappt, dann einbauen", title: "Täglich kurz spülen, erst testen, dann einbauen",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Bei jedem Spülgang Wasser von Hand einfüllen", v: "Nimmt ein gutes Stück Arbeitsfläche weg", t: "Töpfe jeden Tag von Hand spülen", l: "Höchstens 8 Maßgedecke", x: "Verzicht auf Einbau und große Kapazität" },
      fatal: "N11", thesis: "Ein Tischgerät, das du selbst befüllst; Töpfe werden weiter von Hand gespült", title: "Tischgerät, ohne Wasseranschluss",
    },
  },
  recommend: { key: "alpha", why: "Für einen Haushalt ab 3 Personen schafft eine große Maschine das Geschirr eines ganzen Tages in einem Durchgang" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Das Geschirr der ganzen Familie hängt an dieser einen Maschine; fällt sie aus, bleibt nur der Abwasch von Hand", kill: "Verwerfen, wenn eine Reparatur länger als 7 Tage dauert und die Familie wieder von Hand spült", label: "Nur ein Gerät" },
};
