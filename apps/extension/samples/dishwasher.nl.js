// 擴充功能生活題示範星系（荷蘭文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Plaatsing", D2: "Keuzecriterium", D3: "Hoeveel verbouwen", D4: "Capaciteit & servies" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `De andere kant duwt ${dims[dim]} naar het tegenovergestelde uiterste`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_NL = {
  schema_version: "1.0",
  core: {
    decision: "Verbouw je de keuken rond een vaatwasser, of kies je er een die past in de keuken die je al hebt?",
    metric: "In de eerste 30 dagen minstens 5 keer per week draaien en niet meer dan 5 minuten per dag met de hand afwassen",
  },
  quadrants: {
    Q1: { scar: "Vaatwasser gekocht en toch nog met de hand afgewassen", sacred: "Tel eerst je vaat" },
    Q2: { scar: "Halverwege de installatie ontdekt dat de slang te kort was", sacred: "Eerst meten, dan kopen" },
    Q3: { scar: "Gekocht van een online toplijstje en hij paste niet", sacred: "Leen ideeën uit andere vakgebieden" },
    Q4: { scar: "Drie vaatwassers als afdruiprek zien eindigen", sacred: "Bedenk eerst wat er misgaat" },
  },
  nodes: {
    N1: node("D1", 0, 2, "In de onderkast", "Haal het onderkastje van 45 of 60 cm naast de spoelbak eruit en bouw de machine in, zodat hij geen aanrechtruimte inneemt en de looproute vrij blijft", "Past niet als breedte, hoogte of diepte van de kast kleiner is dan de opgegeven inbouwmaten", null),
    N2: node("D2", 0, 1, "Na het eten", "Kies een model met een snelprogramma onder 1 uur en draai het na elke maaltijd, zodat er nooit vuile vaat een nacht in de spoelbak staat", "Past niet als de vaat binnen 14 dagen meer dan 2 keer nog vettig aanvoelt na een snelprogramma", "Snelprogramma's slaan het drogen meestal over, dus je laat de vaat zelf aan de lucht drogen"),
    N3: node("D1", 1, 0, "Naast spoelbak", "Zet de machine binnen 1 meter van de spoelbak en leg de afvoerslang direct in de afvoer van de spoelbak, zonder door muren te boren of nieuwe leidingen", "Past niet als de meegeleverde afvoerslang de spoelbak niet haalt en verlengd moet worden", null),
    N4: node("D4", 0, 2, "Op gezinsmaat", "Met 3 of meer mensen in huis kies je voor 12+ couverts, zodat pannen en borden in één keer gaan in plaats van twee", "Past niet als vaat en pannen op meer dan 2 van de 14 dagen niet in één lading passen", null),
    N5: node("D3", 2, 0, "Tafelmodel", "Koop een tafelvaatwasser met 8 couverts of minder: geen kast eruit, geen leidingwerk, en hij verhuist met je mee", "Past niet als er op meer dan 3 van de 14 dagen 2 rondes nodig zijn om alles schoon te krijgen", "Kost een flink stuk werkblad"),
    N6: node("D3", 1, 2, "Eerst proberen", "Koop een model dat vrijstaand of ingebouwd werkt, laat het 30 dagen naast de spoelbak staan en beslis dan pas of de kast eruit gaat, in plaats van die op dag één te slopen", "Past niet als de machine tijdens de proefperiode van 30 dagen de looproute of een lade blokkeert", null),
    N7: node("D3", 2, 1, "Eigen watertank", "Net als een camper met eigen watertank: kies een tafelmodel dat je met de hand vult, zonder aansluiting op de kraan en zonder leidingwerk", "Past niet als je in een week 2 keer of vaker toch met de hand afwast omdat vullen je te veel moeite was", "Vullen is meer gedoe dan je denkt",
      { lateral: { src: "Kamperen: ingebouwde watertank", dist: 2, drop: "Vaste aansluiting op de kraan" } }),
    N8: node("D2", 1, 0, "Eerst meten", "Net als de checklist van een piloot voor vertrek: meet breedte, diepte en hoogte voordat je bestelt, en controleer dan stopcontact en afvoer; ontbreekt er één van de 5, dan bestel je niet", "Past niet als er iets niet klopt of hij na levering niet te installeren is", null,
      { lateral: { src: "Luchtvaart: checklist voor vertrek", dist: 3, drop: "Op gevoel bestellen" } }),
    N9: node("D4", 2, 0, "Vaatwasproof", "Net als een restaurant dat alleen vaatwasserbestendig servies gebruikt: vervang elke pan en elk bord zonder vaatwassymbool, zodat er niets meer met de hand hoeft", "Past niet als je in de 14 dagen na de vervanging nog steeds meer dan 3 stuks per dag met de hand afwast", null,
      { lateral: { src: "Horeca: professioneel servies", dist: 4, drop: "Allegaartje van oud servies" } }),
    N10: node("D2", 2, 0, "Nooit half vol", "Draai je hem minder dan half vol, dan verbruikt hij bijna evenveel water en stroom als een volle lading, dus elk bord kost meer dan het dubbele", "Houd 7 dagen je vaat bij voordat je bestelt; kom je gemiddeld onder 6 couverts per dag, stap dan over op een tafelmodel", "De vaat gaat stinken terwijl je op een volle lading wacht",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Een grote machine half leeg draaien loont niet" } }),
    N11: node("D4", 1, 0, "Pannen eruit", "Prop je uit gemak wokpannen en soeppannen erin, dan past de vaat niet meer in één lading van een tafelmodel en sta je weer met de hand af te wassen", "Schrappen als pannen binnen 14 dagen meer dan 2 keer een tweede lading afdwingen", "Niet iedereen in huis houdt zich aan de regel",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Uit gemak de machine overvol laden" } }),
    N12: node("D3", 0, 1, "Geen verbouwing", "Als het plaatsen van een vaatwasser uitgroeit tot een complete keukenverbouwing, zit je eraan vast zodra het werk begonnen en het geld betaald is", "Niet beginnen als de offerte voordat de kast eruit gaat meer dan 2x de prijs van de machine is", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Is het werk eenmaal begonnen, dan is er geen weg terug" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Een machine voor 12+ couverts past niet op het aanrecht, dus het is die of een tafelmodel" },
    { type: "excludes", from: "N1", to: "N5", why: "Is er eenmaal een machine in de kast ingebouwd, dan koop je niet ook nog een tafelmodel; het is het een of het ander" },
    { type: "excludes", from: "N4", to: "N11", why: "Het hele punt van een grotere machine is dat de pannen ook meegaan, dat botst met pannen eruit houden" },
    { type: "excludes", from: "N2", to: "N7", why: "Na elke maaltijd draaien betekent drie keer per dag de tank met de hand vullen, en dat hou je moeilijk vol" },
    { type: "excludes", from: "N2", to: "N10", why: "Na elke maaltijd draaien is vaak minder dan een halve lading, wat botst met de regel nooit half vol" },
    { type: "excludes", from: "N9", to: "N11", why: "Het punt van vaatwasbestendige pannen en borden is dat ze erin gaan, dat botst met pannen eruit houden" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm ernaast en hij past niet in de kast, dus alles meten voordat je bestelt" },
    { type: "requires", from: "N4", to: "N10", why: "Een grote machine die half leeg draait verbruikt nog steeds water en stroom voor een volle lading, dus houd je aan nooit half vol" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kast eruit halen en installatiekosten", v: "Eén kast minder opbergruimte", t: "Wachten op een installateur om te meten en te plaatsen", l: "Pas draaien bij een halve lading", x: "Het tafelmodel opgeven" },
      fatal: "N10", thesis: "Meet de kast, bouw een grote machine in en draai alleen als hij half vol is", title: "Grote inbouwmachine, in één keer goed",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nieuwe pannen en borden, plus water en stroom bij elke maaltijd", v: "Staat tijdens de proefperiode in de looproute", t: "De kast gaat er pas na 30 dagen uit", l: "Vaat na snelprogramma's aan de lucht laten drogen", x: "Het tafelmodel opgeven" },
      fatal: "N12", thesis: "Na elke maaltijd een snelle was; laat hem naast de spoelbak staan tot het werkt, en bouw hem dan in", title: "Dagelijks snel wassen, eerst proberen dan inbouwen",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Elke ronde het water met de hand bijvullen", v: "Kost een flink stuk werkblad", t: "Elke dag pannen met de hand afwassen", l: "8 couverts of minder", x: "Inbouw en grote capaciteit opgeven" },
      fatal: "N11", thesis: "Een tafelmodel dat je zelf vult; pannen blijven handwerk", title: "Tafelmodel, geen leidingwerk",
    },
  },
  recommend: { key: "alpha", why: "Voor een huishouden van 3 of meer verwerkt één grote machine de vaat van een hele dag in één lading" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "De vaat van het hele gezin hangt aan deze ene machine; gaat hij kapot, dan is met de hand afwassen de enige back-up", kill: "Schrappen als een reparatie langer dan 7 dagen duurt en het gezin terugvalt op met de hand afwassen", label: "Eén machine" },
};
