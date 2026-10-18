// 擴充功能生活題示範星系（丹麥文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Placering", D2: "Valgkriterium", D3: "Hvor meget ombygning", D4: "Kapacitet & service" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Den anden side skubber ${dims[dim]} til den modsatte yderlighed`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_DA = {
  schema_version: "1.0",
  core: {
    decision: "Skal du bygge køkkenet om efter en opvaskemaskine, eller vælge en, der passer ind i det køkken, du allerede har?",
    metric: "I de første 30 dage kører den mindst 5 gange om ugen, og du bruger højst 5 minutter om dagen på opvask i hånden",
  },
  quadrants: {
    Q1: { scar: "Købte en opvaskemaskine og vaskede stadig op i hånden", sacred: "Tæl dit service først" },
    Q2: { scar: "Opdagede midt i installationen, at slangen var for kort", sacred: "Mål, før du køber" },
    Q3: { scar: "Købte fra en online topliste, og den passede ikke", sacred: "Lån idéer fra andre områder" },
    Q4: { scar: "Har set tre opvaskemaskiner ende som tallerkenstativ", sacred: "Tænk først over, hvad der kan gå galt" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Indbyg ved vask", "Tag underskabet på 45 eller 60 cm ved siden af vasken ud og byg maskinen ind, så den ikke optager bordplads eller spærrer gangarealet", "Passer ikke, hvis skabets bredde, højde eller dybde er mindre end maskinens oplyste indbygningsmål", null),
    N2: node("D2", 0, 1, "Efter maden", "Vælg en model med et hurtigprogram under 1 time, og kør den efter hvert måltid, så beskidt service aldrig står i vasken natten over", "Passer ikke, hvis servicet stadig føles fedtet efter et hurtigprogram mere end 2 gange på 14 dage", "Hurtigprogrammer springer som regel tørringen over, så servicet må lufttørre"),
    N3: node("D1", 1, 0, "Ved vasken", "Stil maskinen højst 1 meter fra vasken, og før afløbsslangen direkte ned i vaskens afløb, uden at bore gennem vægge eller lægge nye rør", "Passer ikke, hvis den medfølgende afløbsslange ikke når vasken og skal forlænges", null),
    N4: node("D4", 0, 2, "Til familien", "Er I 3 eller flere i husstanden, så gå efter 12+ kuverter, så gryder og service kan komme i én omgang i stedet for to", "Passer ikke, hvis service og gryder på mere end 2 af 14 dage ikke kan være i én omgang", null),
    N5: node("D3", 2, 0, "Bordmodel", "Køb en bordopvaskemaskine til 8 kuverter eller færre: intet skab skal ud, ingen rørændringer, og den flytter med dig", "Passer ikke, hvis det på mere end 3 af 14 dage kræver 2 kørsler at få det hele rent", "Æder en god bid af bordpladsen"),
    N6: node("D3", 1, 2, "Prøv først", "Køb en model, der kan stå frit eller bygges ind, lad den stå ved vasken i hele 30 dage, og beslut først derefter, om skabet skal ud, i stedet for at rive det ud på dag ét", "Passer ikke, hvis maskinen i den 30 dage lange prøveperiode spærrer gangen eller en skuffe", null),
    N7: node("D3", 2, 1, "Egen vandtank", "Som en autocamper med egen vandtank: vælg en bordmodel, du fylder i hånden, uden tilslutning til hanen og uden rørændringer", "Passer ikke, hvis du i en given uge 2 gange eller mere vasker op i hånden, fordi du ikke gad fylde den", "At fylde den er mere bøvl, end man tror",
      { lateral: { src: "Camping: indbygget vandtank", dist: 2, drop: "Fast tilslutning til hanen" } }),
    N8: node("D2", 1, 0, "Mål først", "Som en pilots tjekliste før afgang: mål bredde, dybde og højde, før du bestiller, og tjek så stikkontakt og afløb; mangler ét af de 5 punkter, så bestil ikke", "Passer ikke, hvis noget ikke stemmer, eller den ikke kan installeres, når den er leveret", null,
      { lateral: { src: "Luftfart: tjekliste før afgang", dist: 3, drop: "At bestille på mavefornemmelse" } }),
    N9: node("D4", 2, 0, "Opvasketåligt", "Som en restaurant, der kun bruger service, der tåler opvaskemaskine: udskift alle gryder og alt service uden opvaskemærke, så intet skal vaskes i hånden", "Passer ikke, hvis du i de 14 dage efter udskiftningen stadig vasker mere end 3 ting i hånden om dagen", null,
      { lateral: { src: "Restauranter: professionelt service", dist: 4, drop: "Sammenbragt gammelt service" } }),
    N10: node("D2", 2, 0, "Aldrig halvfuld", "Kører du den mindre end halvfuld, bruger den næsten lige så meget vand og strøm som en fuld fyldning, så hver tallerken koster mere end det dobbelte", "Notér dit service i 7 dage, før du bestiller; ligger du i snit under 6 kuverter om dagen, så skift til en bordmodel", "Servicet begynder at lugte, mens du venter på en fuld maskine",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Det kan ikke betale sig at køre en stor maskine halvtom" } }),
    N11: node("D4", 1, 0, "Gryder udenfor", "Propper du af bekvemmelighed wokpander og suppegryder ind, kan en bordmodel ikke tage servicet i én omgang, og du ender med at vaske op i hånden igen", "Drop det, hvis gryder tvinger en ekstra kørsel mere end 2 gange på 14 dage", "Ikke alle i husstanden følger reglen",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "At overfylde maskinen af bekvemmelighed" } }),
    N12: node("D3", 0, 1, "Ingen ombygning", "Hvis installationen af en opvaskemaskine vokser til en ombygning af hele køkkenet, sidder du fast, når arbejdet er i gang og pengene er betalt", "Gå ikke i gang, hvis tilbuddet, før skabet tages ud, er over 2x maskinens pris", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Når arbejdet først er i gang, er der ingen vej tilbage" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "En maskine til 12+ kuverter kan ikke stå på bordet, så det er enten den eller en bordmodel" },
    { type: "excludes", from: "N1", to: "N5", why: "Når der først er bygget en maskine ind i skabet, køber du ikke også en bordmodel; det er det ene eller det andet" },
    { type: "excludes", from: "N4", to: "N11", why: "Pointen med at gå op i størrelse er, at gryderne også skal med, hvilket strider mod at holde gryder udenfor" },
    { type: "excludes", from: "N2", to: "N7", why: "At køre efter hvert måltid betyder at fylde tanken i hånden tre gange om dagen, og det er svært at holde" },
    { type: "excludes", from: "N2", to: "N10", why: "At køre efter hvert måltid er ofte under en halv fyldning, hvilket strider mod reglen om aldrig halvfuld" },
    { type: "excludes", from: "N9", to: "N11", why: "Pointen med at skifte til gryder og service, der tåler opvaskemaskine, er at sætte dem ind, hvilket strider mod at holde gryder udenfor" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm ved siden af, og den glider ikke ind i skabet, så alt skal måles, før du bestiller" },
    { type: "requires", from: "N4", to: "N10", why: "En stor maskine, der kører halvtom, bruger stadig vand og strøm til en fuld fyldning, så hold fast i aldrig halvfuld" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Skab ud og montørløn", v: "Ét skab mindre til opbevaring", t: "Vent på en montør til opmåling og montering", l: "Vent med at køre til en halv fyldning", x: "Opgiv bordmodellen" },
      fatal: "N10", thesis: "Mål skabet, byg en stor maskine ind, og kør kun når den er halvfuld", title: "Stor indbygget maskine, rigtigt fra start",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nye gryder og nyt service, plus vand og strøm ved hvert måltid", v: "Fylder i gangen under prøveperioden", t: "Skabet kommer først ud efter 30 dage", l: "Lufttør servicet efter hurtigprogrammer", x: "Opgiv bordmodellen" },
      fatal: "N12", thesis: "Hurtig opvask efter hvert måltid; lad den stå ved vasken, til det fungerer, og byg den så ind", title: "Hurtig opvask dagligt, prøv før indbygning",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Fyld vand på i hånden hver gang", v: "Æder en god bid af bordpladsen", t: "Vask gryder op i hånden hver dag", l: "8 kuverter eller færre", x: "Opgiv indbygning og stor kapacitet" },
      fatal: "N11", thesis: "En bordmodel, du selv fylder; gryder vaskes fortsat i hånden", title: "Bordmodel, ingen rør",
    },
  },
  recommend: { key: "alpha", why: "For en husstand på 3 eller flere klarer én stor maskine en hel dags opvask i én omgang" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Hele familiens opvask afhænger af denne ene maskine; går den i stykker, er opvask i hånden den eneste reserve", kill: "Drop det, hvis en reparation tager mere end 7 dage, og familien går tilbage til opvask i hånden", label: "Én maskine" },
};
