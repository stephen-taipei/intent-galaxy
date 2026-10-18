// 擴充功能內建生活題示範星系（荷蘭文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Waar het zoet vandaan komt", D2: "Uitlaatklep voor trek", D3: "Hoe groot de verandering", D4: "Wat er thuis in huis is" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `De tegenovergestelde visie duwt ${dims[dim]} naar het andere uiterste`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_NL = {
  schema_version: "1.0",
  core: {
    decision: "Vervang je alle zoetigheid door hele vruchten, of blijf je eten wat je lekker vindt en eet je er gewoon minder van?",
    metric: "30 dagen lang niet meer dan 3 zoete snacks en drankjes per week samen (bijgehouden op je telefoon)",
  },
  quadrants: {
    Q1: { scar: "Een hele zak gedroogd fruit opgegeten in de veronderstelling dat het een gezonde snack was", sacred: "Zoet komt alleen uit hele vruchten" },
    Q2: { scar: "Drie keer gestopt met suiker en elke keer in week twee gezwicht", sacred: "Het telt alleen als je het echt volhoudt" },
    Q3: { scar: "Een koolhydraatarm menu overgenomen en er na drie dagen genoeg van gehad", sacred: "Verander de methode, niet de smaak" },
    Q4: { scar: "Te veel mensen zien stoppen met suiker en meteen weer terugvallen", sacred: "Regels winnen van wilskracht" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Hele vruchten", "Heb je zin in iets zoets, eet dan alleen heel vers fruit, zoals kiwi, ananas, bessen of sinaasappels; sap, gedroogd fruit en gekonfijt fruit tellen niet", "Mislukt als je binnen 14 dagen op meer dan 3 dagen een toetje of gebak koopt om de trek te stillen", null),
    N2: node("D2", 0, 1, "Bruiswater", "Komt de trek opzetten, drink dan eerst een glas ongezoet bruiswater met citroen of passievrucht; wil je na 15 minuten nog steeds iets zoets, bewaar het dan voor na je volgende maaltijd. Alleen de drankjes veranderen: maaltijden blijven hetzelfde en je koopt geen vervangende snacks", "Mislukt als je binnen 14 dagen in meer dan de helft van de gevallen na 15 minuten wachten nog steeds iets zoets wilt", "Een drankje stilt de behoefte om op iets te kauwen niet"),
    N3: node("D1", 1, 0, "Alleen na eten", "Eet zoetzure snacks en fruit alleen binnen 1 uur na een maaltijd; niets op een lege maag en niets in de 3 uur voor het slapengaan", "Mislukt als je na 14 dagen op meer dan 3 avonden nog steeds voor het slapen naar snacks zoekt", null),
    N4: node("D4", 0, 2, "Snoepvrij huis", "Doe één keer per week boodschappen: seizoensfruit per kist en genoeg ongezoete yoghurt naturel voor de week; dat zijn de enige snacks in huis, en zoete snacks komen er nooit in", "Mislukt als er binnen 14 dagen nog een week is waarin je buiten de deur meer dan 3 keer snoep koopt", null),
    N5: node("D3", 2, 0, "Favoriet half", "Blijf de zoetzure snacks eten waar je van houdt, alleen minder: stap over op losse porties en halveer je dagelijkse hoeveelheid, zonder vervangers", "Mislukt als je vanaf week 2 op meer dan 2 dagen per week meer dan de helft van je oude hoeveelheid eet", "Vaak trek je direct na het eerste zakje het tweede open"),
    N6: node("D3", 1, 2, "Eerst proeven", "Koop van elke nieuwe smaak ongezoete drank de kleinste verpakking en drink die 3 dagen achter elkaar; koop pas een hele tray als je het lekker vindt, nooit alles tegelijk inslaan", "Mislukt als een smaak die je na het proeven per tray kocht 14 dagen later nog meer dan half vol is", null),
    N7: node("D3", 2, 1, "Saus wisselen", "Net als een nieuw telefoonhoesje in plaats van een nieuwe telefoon: houd de hoofdingrediënten van zoetzuur varkensvlees of vis, maar maak de saus zelf van tomaat, ananas en azijn, met de helft van de gebruikelijke suiker", "Mislukt als na 2 keer de nieuwe saus maken binnen 14 dagen iedereen thuis zegt dat het niet lekker is", "Bij de afhaalchinees of in een restaurant kun je de saus niet aanpassen",
      { lateral: { src: "Techniek: telefoonhoesje wisselen", dist: 2, drop: "Het gerecht helemaal van het menu schrappen" } }),
    N8: node("D2", 1, 0, "Max 3 porties", "Net als een bagagelimiet bij de luchtvaartmaatschappij: maximaal 3 porties fruit en zoetzure snacks samen per dag, elk ongeveer zo groot als je vuist; wat erboven zit wacht tot morgen, in plaats van op wilskracht van het moment te vertrouwen", "Mislukt als je op meer dan 2 dagen in een week meer dan 3 porties neemt", null,
      { lateral: { src: "Luchtvaart: bagagelimiet", dist: 3, drop: "Eten wanneer je wilt, zonder limiet" } }),
    N9: node("D4", 2, 0, "Bubbels in huis", "Vul aan zoals een supermarkt doet voordat het schap leeg is: houd altijd een tray ongezoet bruiswater en een net citroenen in de koelkast, en koop een nieuwe tray als je er nog 3 hebt, zodat trek je nooit naar bubbletea of frisdrank stuurt", "Mislukt als je binnen 14 dagen nog steeds meer dan 3 zoete drankjes buiten de deur koopt", null,
      { lateral: { src: "Winkels: aanvullen voordat het uitverkocht is", dist: 4, drop: "Alleen een drankje kopen als je er zin in hebt" } }),
    N10: node("D2", 2, 0, "Kosten aftoppen", "Kosten vervangende snacks zoals fruit en ongezoete yoghurt meer dan twee keer zoveel als je vroeger per week aan snacks uitgaf, dan geef je het binnen een maand op en koop je weer snacks", "Stoppen als vervangende snacks binnen 14 dagen meer dan het dubbele van je oude snackbudget kosten", "Fruitprijzen schommelen flink met de seizoenen",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Vervangers zijn te duur om vol te houden" } }),
    N11: node("D4", 1, 0, "Geen bulk", "Koop je eten en drinken per kist om gratis verzending of bulkkorting te krijgen, dan eet je elke dag meer naarmate er meer in huis is", "Stoppen als je binnen 14 dagen meer dan één keer eten of drinken per kist koopt of om aan een minimumbedrag voor gratis verzending te komen", "Snoep dat vrienden en familie meenemen heb je niet in de hand",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Kortingen laten je steeds meer kopen" } }),
    N12: node("D3", 0, 1, "Geen gadgets", "Wacht je met beginnen tot je een bruiswatermaker, zoetstoffen en allerlei vervangers hebt gekocht, dan dwingt het uitgegeven geld je om dingen weg te werken die je niet lekker vindt, en stop je binnen 2 weken", "Stoppen als je binnen 14 dagen meer dan 1 apparaat of vervanger koopt die je eigenlijk niet gebruikt", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Je werkt het weg zodat het niet verspild wordt" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Zoete snacks de deur uit houden en toch je gewone zoete snacks blijven eten kan niet allebei" },
    { type: "excludes", from: "N1", to: "N5", why: "Als zoet alleen uit hele vruchten komt, kun je de zoete snacks waar je van houdt niet houden" },
    { type: "excludes", from: "N4", to: "N11", why: "Het fruit thuis hangt af van elke week een kist kopen; verbied kopen per kist en dat voorraadplan valt om" },
    { type: "excludes", from: "N2", to: "N7", why: "Dit pad verandert alleen de drankjes en laat de maaltijden met rust, wat botst met het herzien van de zoetzure saus" },
    { type: "excludes", from: "N2", to: "N10", why: "Dit pad verandert alleen de drankjes en koopt geen vervangende snacks; een uitgavenplafond voor vervangers hoort bij een ander pad, dus kies er één" },
    { type: "excludes", from: "N9", to: "N11", why: "Bruiswater op voorraad houden betekent het per tray kopen, en dat botst direct met niet in bulk kopen" },
    { type: "requires", from: "N1", to: "N8", why: "Ook fruit bevat suiker; zelfs als fruit je enige traktatie is, heb je een daglimiet nodig, anders eist te veel eten nog steeds zijn tol" },
    { type: "requires", from: "N4", to: "N10", why: "Elke week fruit en yoghurt per kist kopen tikt aan, dus je hebt een uitgavenplafond nodig, anders geeft je portemonnee het eerst op" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Eén vaste boodschappenronde per week", v: "Je favoriete snacks opgeven", t: "De eerste twee weken trek zijn zwaar", l: "Maximaal drie porties fruit per dag", x: "Geen impulsieve ritjes naar de bakker voor iets zoets" },
      fatal: "N10", thesis: "Haal je zoet alleen uit hele vruchten, in beperkte hoeveelheden, en houd zoete snacks de deur uit", title: "Over op fruit · geen snoep in huis",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Bruiswater op voorraad in de koelkast", v: "15 minuten wachten voordat je aan trek toegeeft", t: "Elke week maar een beetje veranderen", l: "De suiker in je maaltijden blijft gelijk", x: "Je oude snacks niet meer eten zoals altijd" },
      fatal: "N12", thesis: "Pak ongezoet bruiswater als de trek toeslaat, en probeer nieuwe smaken eerst in kleine hoeveelheden voordat je meer koopt", title: "Eerst drankjes wisselen · langzaam minderen",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Elke keer porties tellen", v: "Snoep in huis blijft verleiden", t: "Het duurt lang voordat je resultaat ziet", l: "Minderen hangt helemaal af van zelfbeheersing", x: "Volledig overstappen op fruit opgeven" },
      fatal: "N11", thesis: "Blijf eten wat je lekker vindt, maar stap over op kleine verpakkingen, beperk porties en maak de zoetzure saus opnieuw", title: "Favorieten houden · beperken en saus wisselen",
    },
  },
  recommend: { key: "alpha", why: "Fruit is van nature zoet en fris, en zoete snacks de deur uit houden kost de minste wilskracht" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Al je zoetzure behoeften komen uit één enkele vrucht of één drankje", kill: "Is dat ene uitverkocht of ben je het zat, dan valt het hele plan uit elkaar", label: "Eén vervanger" },
};
