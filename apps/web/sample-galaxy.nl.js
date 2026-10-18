// 內建示範星系（IntentAnalysisResponse v1.0，荷蘭文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Laaggrenzen", D2: "Hoe variatie wordt uitgedrukt", D3: "Omvang van maatwerk", D4: "Opbouw van themes" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Tegenpositie: duw ${dims[dim]} naar het andere uiterste`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_NL = {
  schema_version: "1.0",
  core: {
    decision: "Forkt elk merk zijn eigen componenten, of stuurt configuratie één gedeelde core aan?",
    metric: "Binnen 60 dagen: een nieuw theme staat in ≤2 dagen live, en de CSS per theme is <50KB",
  },
  quadrants: {
    Q1: { scar: "Gedeelde componenten volgepropt met merk-ifs", sacred: "Nul vertakkingen in de core" },
    Q2: { scar: "100+ themes één voor één met de hand gepatcht", sacred: "Types vangen fouten af" },
    Q3: { scar: "Een designsystem gekopieerd en overgeabstraheerd", sacred: "Verwisselbare structuur" },
    Q4: { scar: "Drie keer maatwerk zien ontsporen", sacred: "Grenzen houden stand" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Drie lagen", "Splits componenten in een pure core, een coördinerende view en een theme-blad; de core mag geen theme-ID's of routes importeren", "Fout als er binnen 14 dagen theme-checks in de core opduiken", null),
    N2: node("D2", 0, 1, "Alleen CSS-vars", "Druk elk verschil tussen themes uitsluitend uit via CSS custom properties, zonder enige vertakking in componenten of layouts", "Fout als het 3e theme al componentwijzigingen nodig heeft", "Layoutverschillen kun je niet met alleen kleuren uitdrukken"),
    N3: node("D1", 1, 0, "Theme-CSS lazy", "Laad tijdens runtime alleen de ene stylesheet van het actieve theme, in plaats van alle themes in de eerste paint te bundelen", "Fout als de CSS van één theme binnen 14 dagen boven 50KB uitkomt", null),
    N4: node("D4", 0, 2, "Getypte configs", "Elk theme levert een volledig TypeScript-configobject; elk ontbrekend veld laat de build falen", "Fout als een nieuw theme toch wijzigingen in gedeelde componenten vereist", null),
    N5: node("D3", 2, 0, "Fork per merk", "Elk theme kopieert de componentenmap en past die zelfstandig aan, zodat merken elkaar nooit raken", "Fout als na het 10e theme één bugfix meer dan 10 plekken raakt", "Eén bugfix betekent N kopieën patchen"),
    N6: node("D3", 1, 2, "Canary-themes", "Rol elk nieuw theme een week lang achter een feature flag uit naar 5% van de tenants; pas naar 100% als het foutpercentage op doel zit", "Fout als het canary-foutpercentage boven 1% komt", null),
    N7: node("D3", 2, 1, "Schil wisselen", "[D2 autoplatform] Layouts zijn als carrosserieën: wissel de hele schil terwijl het gedeelde chassis (view en core) blijft staan", "Fout als het wisselen van een layout wijzigingen in de core vraagt", "Interacties lopen uiteen tussen layouts",
      { lateral: { src: "Auto-industrie: platformchassis", dist: 2, drop: "Elk model vanaf nul opnieuw ontwerpen" } }),
    N8: node("D2", 1, 0, "Vaste slots", "[D3 LEGO-steentjes] Layouts declareren vaste slots; themes mogen alleen componenten in slots steken en geen structuur daarbuiten wijzigen", "Fout als de DOM buiten de slots ook maar één keer wordt aangepast", null,
      { lateral: { src: "Speelgoed: LEGO-koppelsysteem", dist: 3, drop: "Vrij DOM-maatwerk" } }),
    N9: node("D4", 2, 0, "Diffs erven", "[D4 letterfamilie] Themes declareren alleen hun verschil met de default; alle andere velden worden automatisch geërfd", "Fout als de overerving dieper gaat dan 3 niveaus", null,
      { lateral: { src: "Letterontwerp: gewichten in een familie", dist: 4, drop: "Volledige kopie per theme" } }),
    N10: node("D2", 2, 0, "Config aftoppen", "Als elk maatwerkverzoek een configveld toevoegt, kost het onderhoud van de config onvermijdelijk meer dan gewoon forken", "Stop met velden toevoegen zodra één configinterface meer dan 40 velden heeft", "Config-hel",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstractie kost meer dan duplicatie" } }),
    N11: node("D4", 1, 0, "Geen bypass", "Als de business merkchecks direct in gedeelde componenten kan afdwingen, valt de grens binnen een kwartaal", "Vervalt als er binnen 14 dagen een merkcheck in gedeelde componenten belandt", "Grenzen inruilen voor deadlines",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadlinedruk beloont het breken van grenzen" } }),
    N12: node("D3", 0, 1, "Geen big bang", "Als alle 70 modules gemigreerd moeten zijn voordat er iets live gaat, strandt de refactor halverwege door sunk cost", "Stop als de eerste module niet binnen 14 dagen live staat", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang-refactor houdt deadlines in gijzeling" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Gedeelde getypte config en componentforks per merk zijn een of-ofkeuze" },
    { type: "excludes", from: "N1", to: "N5", why: "Een gedeelde core in drie lagen en componentkopieën per merk sluiten elkaar uit" },
    { type: "excludes", from: "N4", to: "N11", why: "Getypte config blokkeert omwegen al bij het compileren, dus een handmatige grenscontrole is een dubbele drempel" },
    { type: "excludes", from: "N2", to: "N7", why: "Als themes alleen CSS-variabelen wijzigen, worden er geen hele layoutcomponenten gewisseld" },
    { type: "excludes", from: "N2", to: "N10", why: "Pure CSS-variabelen hebben geen configvelden die kunnen uitdijen; kies er één" },
    { type: "excludes", from: "N9", to: "N11", why: "Overervingsketens staan lokale overrides toe, wat botst met een vangrail zonder enige omweg" },
    { type: "requires", from: "N1", to: "N8", why: "Na de splitsing in drie lagen moeten themes via vaste slots aanpassen, anders wordt de view-laag doorboord" },
    { type: "requires", from: "N4", to: "N10", why: "Getypte configs hebben een veldlimiet nodig, anders groeien ze uit tot een config-hel" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refactorwerk vooraf", v: "Geen snelle forks", t: "60 dagen om het skelet te bouwen", l: "Integriteitstests zijn verplicht", x: "Geen merkspecifieke shortcuts" },
      fatal: "N10", thesis: "Grenzen in drie lagen plus getypte config brengen elk theme terug tot één blad", title: "Configgestuurd · drie lagen",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Beperkte layoutvariatie", v: "Minder ontwerpvrijheid", t: "Kleine stapjes per week", l: "Complexe layouts vallen af", x: "Geen structureel maatwerk" },
      fatal: "N12", thesis: "Gebruik alleen CSS-variabelen en overerving, en rol themes geleidelijk uit via canaries", title: "Puur styling · geleidelijk",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Gedupliceerde code", v: "Bugfixes raken veel plekken", t: "Het snelst live", l: "Onderhoudskosten groeien lineair", x: "Getypte config opgeven" },
      fatal: "N11", thesis: "Wissel hele layouts en laat elk merk zijn eigen schil forken", title: "Merkforks · gedeeld chassis",
    },
  },
  recommend: { key: "alpha", why: "Met 100+ themes houdt alleen een configgestuurd ontwerp de onderhoudskosten in toom" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Elk theme erft van hetzelfde default-theme", kill: "Gaat de default stuk, dan breekt de layout van elk theme", label: "default-SPOF" },
};
