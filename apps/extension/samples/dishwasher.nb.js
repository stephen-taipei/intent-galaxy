// 擴充功能生活題示範星系（挪威文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Plassering", D2: "Valggrunnlag", D3: "Hvor mye ombygging", D4: "Kapasitet & servise" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Den andre siden presser ${dims[dim]} til motsatt ytterpunkt`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_NB = {
  schema_version: "1.0",
  core: {
    decision: "Skal du bygge om kjøkkenet rundt en oppvaskmaskin, eller velge en som passer inn i kjøkkenet du allerede har?",
    metric: "De første 30 dagene går den minst 5 ganger i uken, og du bruker høyst 5 minutter om dagen på håndoppvask",
  },
  quadrants: {
    Q1: { scar: "Kjøpte oppvaskmaskin og tok fortsatt oppvasken for hånd", sacred: "Tell oppvasken først" },
    Q2: { scar: "Oppdaget midt i monteringen at slangen var for kort", sacred: "Mål før du kjøper" },
    Q3: { scar: "Kjøpte fra en toppliste på nett, og den fikk ikke plass", sacred: "Lån ideer fra andre fagfelt" },
    Q4: { scar: "Har sett tre oppvaskmaskiner ende som tørkestativ", sacred: "Planlegg for fiasko først" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Inn i skapet", "Ta ut underskapet på 45 eller 60 cm ved siden av vasken og bygg inn maskinen, så den ikke tar benkeplass eller sperrer gangen", "Passer ikke hvis skapets bredde, høyde eller dybde er mindre enn maskinens oppgitte innbyggingsmål", null),
    N2: node("D2", 0, 1, "Etter maten", "Velg en modell med hurtigprogram under 1 time og kjør den etter hvert måltid, så skittent servise aldri står i vasken over natten", "Passer ikke hvis serviset fortsatt kjennes fett etter et hurtigprogram mer enn 2 ganger på 14 dager", "Hurtigprogrammer hopper som regel over tørkingen, så serviset må lufttørke"),
    N3: node("D1", 1, 0, "Ved vasken", "Sett maskinen høyst 1 meter fra vasken og før avløpsslangen rett ned i vaskens avløp, uten å bore gjennom vegger eller legge nye rør", "Passer ikke hvis den medfølgende avløpsslangen ikke når vasken og må forlenges", null),
    N4: node("D4", 0, 2, "For familien", "Er dere 3 eller flere i husstanden, velg 12+ kuverter, så gryter og servise går i én runde i stedet for to", "Passer ikke hvis servise og gryter ikke får plass i én runde mer enn 2 av 14 dager", null),
    N5: node("D3", 2, 0, "Benkemodell", "Kjøp en benkeoppvaskmaskin for 8 kuverter eller færre: ingen skap ut, ingen rørendringer, og den flytter med deg", "Passer ikke hvis det mer enn 3 av 14 dager trengs 2 runder for å få alt rent", "Tar en god bit av arbeidsbenken"),
    N6: node("D3", 1, 2, "Test først", "Kjøp en modell som fungerer frittstående eller innebygd, la den stå ved vasken i hele 30 dager, og bestem først da om skapet skal ut, i stedet for å rive det ut dag én", "Passer ikke hvis maskinen sperrer gangen eller en skuff i løpet av den 30 dager lange prøveperioden", null),
    N7: node("D3", 2, 1, "Egen vanntank", "Som en bobil med egen vanntank: velg en benkemodell du fyller for hånd, uten tilkobling til kranen og uten rørendringer", "Passer ikke hvis du i en uke tar oppvasken for hånd 2 ganger eller mer fordi du ikke gadd å fylle den", "Å fylle den er mer styr enn man tror",
      { lateral: { src: "Camping: innebygd vanntank", dist: 2, drop: "Fast tilkobling til kranen" } }),
    N8: node("D2", 1, 0, "Mål først", "Som en pilots sjekkliste før avgang: mål bredde, dybde og høyde før du bestiller, og sjekk så stikkontakt og avløp; mangler ett av de 5 punktene, ikke bestill", "Passer ikke hvis noe ikke stemmer, eller den ikke kan monteres når den er levert", null,
      { lateral: { src: "Luftfart: sjekkliste før avgang", dist: 3, drop: "Å bestille på magefølelsen" } }),
    N9: node("D4", 2, 0, "Tåler oppvask", "Som en restaurant som bare bruker servise som tåler oppvaskmaskin: bytt ut alle gryter og alt servise uten oppvaskmerke, så ingenting må vaskes for hånd", "Passer ikke hvis du de 14 dagene etter byttet fortsatt vasker mer enn 3 ting for hånd om dagen", null,
      { lateral: { src: "Restauranter: profesjonelt servise", dist: 4, drop: "Sammenrasket gammelt servise" } }),
    N10: node("D2", 2, 0, "Aldri halvfull", "Kjører du den mindre enn halvfull, bruker den nesten like mye vann og strøm som en full runde, så hver tallerken koster mer enn det dobbelte", "Noter oppvasken din i 7 dager før du bestiller; ligger du i snitt under 6 kuverter om dagen, bytt til en benkemodell", "Oppvasken begynner å lukte mens du venter på en full maskin",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Det lønner seg ikke å kjøre en stor maskin halvtom" } }),
    N11: node("D4", 1, 0, "Gryter utenfor", "Stapper du av bekvemmelighet inn wokpanner og kjeler, får en benkemodell ikke plass til oppvasken i én runde, og du ender med håndoppvask igjen", "Dropp det hvis gryter tvinger fram en ekstra runde mer enn 2 ganger på 14 dager", "Ikke alle i husstanden følger regelen",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Å overfylle maskinen av bekvemmelighet" } }),
    N12: node("D3", 0, 1, "Ingen ombygging", "Hvis installasjonen av en oppvaskmaskin vokser til en ombygging av hele kjøkkenet, sitter du fast så snart arbeidet er i gang og pengene er betalt", "Ikke start hvis tilbudet før skapet tas ut er mer enn 2x maskinens pris", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Når arbeidet først er i gang, er det ingen vei tilbake" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "En maskin for 12+ kuverter får ikke plass på benken, så det er enten den eller en benkemodell" },
    { type: "excludes", from: "N1", to: "N5", why: "Når en maskin først er bygd inn i skapet, kjøper du ikke også en benkemodell; det er det ene eller det andre" },
    { type: "excludes", from: "N4", to: "N11", why: "Poenget med å gå opp i størrelse er at grytene også skal inn, noe som strider mot å holde gryter utenfor" },
    { type: "excludes", from: "N2", to: "N7", why: "Å kjøre etter hvert måltid betyr å fylle tanken for hånd tre ganger om dagen, og det er vanskelig å holde ut" },
    { type: "excludes", from: "N2", to: "N10", why: "Å kjøre etter hvert måltid blir ofte mindre enn en halv runde, noe som strider mot regelen om aldri halvfull" },
    { type: "excludes", from: "N9", to: "N11", why: "Poenget med å bytte til gryter og servise som tåler oppvaskmaskin er å sette dem inn, noe som strider mot å holde gryter utenfor" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm feil, og den glir ikke inn i skapet, så alt må måles før du bestiller" },
    { type: "requires", from: "N4", to: "N10", why: "En stor maskin som går halvtom bruker likevel vann og strøm for en full runde, så hold deg til aldri halvfull" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Skap ut og montørkostnad", v: "Ett skap mindre til oppbevaring", t: "Vent på en montør for oppmåling og montering", l: "Vent med å kjøre til den er halvfull", x: "Gi opp benkemodellen" },
      fatal: "N10", thesis: "Mål skapet, bygg inn en stor maskin og kjør bare når den er halvfull", title: "Stor innebygd maskin, gjort én gang",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nye gryter og nytt servise, pluss vann og strøm ved hvert måltid", v: "Tar plass i gangen i prøveperioden", t: "Skapet kommer ut først etter 30 dager", l: "Lufttørk serviset etter hurtigprogram", x: "Gi opp benkemodellen" },
      fatal: "N12", thesis: "Hurtigvask etter hvert måltid; la den stå ved vasken til det fungerer, og bygg den så inn", title: "Hurtigvask daglig, test før innbygging",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Fyll vann for hånd hver runde", v: "Tar en god bit av arbeidsbenken", t: "Vask gryter for hånd hver dag", l: "8 kuverter eller færre", x: "Gi opp innbygging og stor kapasitet" },
      fatal: "N11", thesis: "En benkemodell du fyller selv; gryter vaskes fortsatt for hånd", title: "Benkemodell, ingen rør",
    },
  },
  recommend: { key: "alpha", why: "For en husstand på 3 eller flere klarer én stor maskin en hel dags oppvask i én runde" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Hele familiens oppvask avhenger av denne ene maskinen; går den i stykker, er håndoppvask den eneste reserven", kill: "Dropp det hvis en reparasjon tar mer enn 7 dager og familien går tilbake til håndoppvask", label: "Én maskin" },
};
