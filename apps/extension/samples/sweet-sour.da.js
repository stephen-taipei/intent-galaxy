// 擴充功能內建生活題示範星系（丹麥文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Hvor det søde kommer fra", D2: "Udløb for trangen", D3: "Hvor stor en ændring", D4: "Hvad der er derhjemme" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Det modsatte synspunkt skubber ${dims[dim]} til den anden yderlighed`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_DA = {
  schema_version: "1.0",
  core: {
    decision: "Skal du bytte al sødt ud med hel frugt, eller blive ved med at spise det, du kan lide, bare mindre af det?",
    metric: "I 30 dage højst 3 søde snacks og drikke om ugen tilsammen (noteret på telefonen som kontrol)",
  },
  quadrants: {
    Q1: { scar: "Spiste en hel pose tørret frugt i den tro, at det var en sund snack", sacred: "Sødme kommer kun fra hel frugt" },
    Q2: { scar: "Droppede sukker tre gange og faldt i hver gang i uge to", sacred: "Det tæller kun, hvis du faktisk kan holde det" },
    Q3: { scar: "Kopierede en lavkulhydrat-madplan og var træt af den efter tre dage", sacred: "Skift metoden, ikke smagen" },
    Q4: { scar: "Har set for mange droppe sukker og glide lige tilbage", sacred: "Regler slår viljestyrke" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Hel frugt", "Når du får lyst til noget sødt, så spis kun hel, frisk frugt som kiwi, ananas, bær eller appelsiner; juice, tørret frugt og kandiseret frugt tæller ikke", "Fejler, hvis du inden for 14 dage køber kage eller dessert for at stille trangen på mere end 3 dage", null),
    N2: node("D2", 0, 1, "Drik danskvand", "Når trangen melder sig, så drik først et glas usødet danskvand med citron eller passionsfrugt; vil du stadig have noget sødt efter 15 minutter, så gem det til efter næste måltid. Kun drikkevarerne ændres: måltiderne er de samme, og du køber ingen erstatningssnacks", "Fejler, hvis du inden for 14 dage stadig vil have noget sødt efter de 15 minutters venten i mere end halvdelen af tilfældene", "En drik fjerner ikke trangen til at tygge på noget"),
    N3: node("D1", 1, 0, "Kun efter mad", "Spis kun sursøde snacks og frugt inden for 1 time efter et måltid; intet på tom mave og intet i de 3 timer før sengetid", "Fejler, hvis du efter 14 dage med dette stadig går på jagt efter snacks før sengetid på mere end 3 aftener", null),
    N4: node("D4", 0, 2, "Slikfrit hjem", "Handl én gang om ugen: sæsonfrugt i kassevis og nok usødet naturel yoghurt til ugen; det er de eneste snacks i huset, og søde snacks kommer aldrig med hjem", "Fejler, hvis der inden for 14 dage stadig er en uge, hvor du køber slik ude mere end 3 gange", null),
    N5: node("D3", 2, 0, "Halvér favorit", "Bliv ved med at spise de sursøde snacks, du elsker, bare mindre: skift til enkeltportioner og halvér din daglige mængde, uden erstatninger", "Fejler, hvis du fra uge 2 spiser mere end halvdelen af din gamle mængde på mere end 2 dage om ugen", "Man åbner tit pose nummer to lige efter den første"),
    N6: node("D3", 1, 2, "Smag først", "Køb den mindste pakning af hver ny smag usødet drik, og drik den 3 dage i træk; køb kun en hel ramme, hvis du kan lide den, og hamstr aldrig det hele på én gang", "Fejler, hvis en smag, du købte i ramme efter at have smagt, stadig er mere end halvfuld 14 dage senere", null),
    N7: node("D3", 2, 1, "Skift saucen", "Som at skifte telefoncover i stedet for telefon: behold hovedingredienserne i sursødt svinekød eller fisk, men lav saucen selv af tomat, ananas og eddike med halvt så meget sukker som normalt", "Fejler, hvis alle derhjemme efter 2 forsøg med den nye sauce inden for 14 dage siger, at den ikke smager godt", "Du kan ikke ændre saucen på restaurant eller ved takeaway",
      { lateral: { src: "Tech: skift telefoncoveret", dist: 2, drop: "Fjerne retten helt fra menuen" } }),
    N8: node("D2", 1, 0, "Maks 3 om dagen", "Som en flyselskabs bagagegrænse: højst 3 portioner frugt og sursøde snacks tilsammen om dagen, hver på størrelse med din knytnæve; resten venter til i morgen, i stedet for at stole på viljestyrken i øjeblikket", "Fejler, hvis du får mere end 3 portioner på mere end 2 dage i en uge", null,
      { lateral: { src: "Flyselskaber: bagagegrænse", dist: 3, drop: "Spise når som helst uden grænse" } }),
    N9: node("D4", 2, 0, "Fyld køleskabet", "Fyld op, som et supermarked gør, før hylden er tom: hav altid en ramme usødet danskvand og en pose citroner i køleskabet, og køb en ny ramme, når der er 3 tilbage, så trangen aldrig sender dig ud efter bubble tea eller sodavand", "Fejler, hvis du inden for 14 dage stadig køber mere end 3 søde drikke ude", null,
      { lateral: { src: "Detailhandel: fyld op før udsolgt", dist: 4, drop: "Kun købe en drik, når du har lyst" } }),
    N10: node("D2", 2, 0, "Udgiftsloft", "Hvis erstatningssnacks som frugt og usødet yoghurt koster mere end dobbelt så meget, som du før brugte på snacks om ugen, giver du op inden for en måned og begynder at købe snacks igen", "Stop, hvis erstatningssnacks inden for 14 dage koster mere end det dobbelte af dit gamle snackbudget", "Frugtpriser svinger meget med sæsonen",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Erstatningerne er for dyre at holde ved" } }),
    N11: node("D4", 1, 0, "Ingen storkøb", "Køber du mad og drikke i kassevis for at få gratis fragt eller mængderabat, ender du med at spise mere hver dag, jo mere der er derhjemme", "Stop, hvis du inden for 14 dage mere end én gang køber mad eller drikke i kassevis eller for at nå grænsen for gratis fragt", "Du styrer ikke det slik, venner og familie giver dig",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Rabatter får dig til at købe mere og mere" } }),
    N12: node("D3", 0, 1, "Intet udstyr", "Venter du med at starte, til du har købt en sodastreamer, sødemidler og alle slags erstatninger, presser de brugte penge dig til at tvinge ting i dig, du ikke kan lide, og du giver op inden for 2 uger", "Stop, hvis du inden for 14 dage køber mere end 1 apparat eller erstatning, du ikke reelt bruger", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Du tvinger det i dig, så det ikke går til spilde" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "At holde søde snacks ude af huset og stadig spise dine sædvanlige søde snacks kan ikke lade sig gøre samtidig" },
    { type: "excludes", from: "N1", to: "N5", why: "Hvis sødme kun kommer fra hel frugt, kan du ikke beholde de søde snacks, du elsker" },
    { type: "excludes", from: "N4", to: "N11", why: "Frugten derhjemme afhænger af at købe en kasse hver uge; forbyd køb i kassevis, og den forsyningsplan falder fra hinanden" },
    { type: "excludes", from: "N2", to: "N7", why: "Denne vej ændrer kun drikkevarerne og lader måltiderne være, hvilket strider mod at lave den sursøde sauce om" },
    { type: "excludes", from: "N2", to: "N10", why: "Denne vej ændrer kun drikkevarerne og køber ingen erstatningssnacks; et udgiftsloft på erstatningssnacks hører til en anden vej, så vælg én" },
    { type: "excludes", from: "N9", to: "N11", why: "At have danskvand på lager betyder at købe det i ramme, hvilket støder direkte sammen med ikke at storkøbe" },
    { type: "requires", from: "N1", to: "N8", why: "Frugt indeholder også sukker; selv hvis frugt er din eneste godbid, har du brug for en daglig grænse, ellers tærer for meget stadig på kroppen" },
    { type: "requires", from: "N4", to: "N10", why: "At købe frugt og yoghurt i kassevis hver uge løber op, så du har brug for et udgiftsloft, ellers giver pengepungen op først" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Én fast indkøbstur om ugen", v: "Opgiv de snacks, du elsker", t: "De første to uger med trang er hårde", l: "Højst tre portioner frugt om dagen", x: "Ingen impulsture efter kage hos bageren" },
      fatal: "N10", thesis: "Få kun din søde trang dækket af hel frugt i begrænsede mængder, og hold søde snacks ude af huset", title: "Skift til frugt · intet sødt derhjemme",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Hold danskvand på lager i køleskabet", v: "Vent 15 minutter, før du giver efter for trangen", t: "Ændr kun en smule hver uge", l: "Sukkeret i måltiderne er det samme", x: "Ikke længere spise de gamle snacks som vanligt" },
      fatal: "N12", thesis: "Grib usødet danskvand, når trangen melder sig, og prøv nye smage i små mængder, før du køber mere", title: "Skift drikke først · skær langsomt ned",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Tæl portioner hver gang", v: "Det søde derhjemme frister stadig", t: "Det tager lang tid at se resultater", l: "At skære ned hviler helt på selvdisciplin", x: "Opgiv at skifte helt til frugt" },
      fatal: "N11", thesis: "Bliv ved med at spise det, du kan lide, men skift til små pakker, begræns portionerne og lav den sursøde sauce om", title: "Behold favoritter · begræns og skift sauce",
    },
  },
  recommend: { key: "alpha", why: "Frugt er naturligt sød og syrlig, og at holde søde snacks ude af huset kræver mindst viljestyrke" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Al din trang til sursødt dækkes af én eneste frugt eller drik", kill: "Bliver netop den udsolgt, eller får du nok af den, falder hele planen fra hinanden", label: "Én erstatning" },
};
