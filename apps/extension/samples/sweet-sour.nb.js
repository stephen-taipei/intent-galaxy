// 擴充功能內建生活題示範星系（挪威文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Hvor det søte kommer fra", D2: "Utløp for suget", D3: "Hvor stor endring", D4: "Hva som finnes hjemme" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Det motsatte synet presser ${dims[dim]} til det andre ytterpunktet`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_NB = {
  schema_version: "1.0",
  core: {
    decision: "Skal du bytte ut alt søtt med hel frukt, eller fortsette å spise det du liker og bare spise mindre av det?",
    metric: "I 30 dager høyst 3 søte snacks og drikker i uken til sammen (notert på mobilen for å sjekke)",
  },
  quadrants: {
    Q1: { scar: "Spiste en hel pose tørket frukt i troen på at det var et sunt mellommåltid", sacred: "Sødme kommer bare fra hel frukt" },
    Q2: { scar: "Kuttet sukker tre ganger og sprakk i uke to hver gang", sacred: "Det teller bare hvis du faktisk klarer å holde det" },
    Q3: { scar: "Kopierte en lavkarbo-matplan og gikk lei etter tre dager", sacred: "Bytt metode, ikke smak" },
    Q4: { scar: "Har sett altfor mange kutte sukker og gli rett tilbake", sacred: "Regler slår viljestyrke" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Hel frukt", "Når du får lyst på noe søtt, spis bare hel, fersk frukt, som kiwi, ananas, bær eller appelsiner; juice, tørket frukt og kandisert frukt teller ikke", "Mislykkes hvis du innen 14 dager kjøper kaker eller dessert for å stille suget mer enn 3 dager", null),
    N2: node("D2", 0, 1, "Kullsyrevann", "Når suget kommer, drikk først et glass usøtet kullsyrevann med sitron eller pasjonsfrukt; vil du fortsatt ha noe søtt etter 15 minutter, spar det til etter neste måltid. Bare drikken endres: måltidene er de samme, og du kjøper ingen erstatningssnacks", "Mislykkes hvis du innen 14 dager fortsatt vil ha noe søtt etter de 15 minuttene i mer enn halvparten av tilfellene", "En drikk stiller ikke behovet for å tygge på noe"),
    N3: node("D1", 1, 0, "Bare etter mat", "Spis surt-søte snacks og frukt bare innen 1 time etter et måltid; ingenting på tom mage og ingenting de 3 siste timene før leggetid", "Mislykkes hvis du etter 14 dager fortsatt leter etter snacks før leggetid mer enn 3 kvelder", null),
    N4: node("D4", 0, 2, "Snopfritt hjem", "Handle én gang i uken: sesongfrukt i kassevis og nok usøtet naturell yoghurt til uken; det er de eneste snacksene i huset, og søte snacks kommer aldri hjem", "Mislykkes hvis det innen 14 dager fortsatt er en uke der du kjøper godteri ute mer enn 3 ganger", null),
    N5: node("D3", 2, 0, "Halver favoritt", "Fortsett å spise de surt-søte snacksene du elsker, bare mindre: bytt til porsjonspakker og halver den daglige mengden, uten erstatninger", "Mislykkes hvis du fra uke 2 spiser mer enn halvparten av den gamle mengden mer enn 2 dager i uken", "Ofte åpner man pose nummer to rett etter den første"),
    N6: node("D3", 1, 2, "Smak først", "Kjøp den minste pakken av hver ny smak usøtet drikke og drikk den 3 dager på rad; kjøp et helt brett bare hvis du liker den, og hamstre aldri alt på én gang", "Mislykkes hvis en smak du kjøpte i brett etter testingen fortsatt er mer enn halvfull 14 dager senere", null),
    N7: node("D3", 2, 1, "Bytt sausen", "Som å bytte mobildeksel i stedet for mobil: behold hovedingrediensene i surt-søtt svinekjøtt eller fisk, men lag sausen selv av tomat, ananas og eddik med halvparten så mye sukker som vanlig", "Mislykkes hvis alle hjemme etter 2 forsøk med den nye sausen innen 14 dager sier at den ikke smaker godt", "På restaurant og ved takeaway kan du ikke endre sausen",
      { lateral: { src: "Teknologi: bytte mobildeksel", dist: 2, drop: "Stryke retten helt fra menyen" } }),
    N8: node("D2", 1, 0, "Maks 3 om dagen", "Som et flyselskaps bagasjegrense: høyst 3 porsjoner frukt og surt-søte snacks til sammen per dag, hver omtrent like stor som knyttneven din; resten venter til i morgen, i stedet for å stole på viljestyrken i øyeblikket", "Mislykkes hvis du spiser mer enn 3 porsjoner mer enn 2 dager i en uke", null,
      { lateral: { src: "Flyselskap: bagasjegrense", dist: 3, drop: "Spise når som helst uten grense" } }),
    N9: node("D4", 2, 0, "Fullt kjøleskap", "Fyll på slik en dagligvarebutikk gjør før hylla er tom: ha alltid et brett usøtet kullsyrevann og en pose sitroner i kjøleskapet, og kjøp et nytt brett når det er 3 bokser igjen, så suget aldri sender deg ut etter bubble tea eller brus", "Mislykkes hvis du innen 14 dager fortsatt kjøper mer enn 3 søte drikker ute", null,
      { lateral: { src: "Varehandel: fyll på før utsolgt", dist: 4, drop: "Kjøpe drikke bare når du har lyst" } }),
    N10: node("D2", 2, 0, "Kostnadstak", "Hvis erstatningssnacks som frukt og usøtet yoghurt koster mer enn dobbelt så mye som du før brukte på snacks i uken, gir du opp innen en måned og begynner å kjøpe snacks igjen", "Stopp hvis erstatningssnacks innen 14 dager koster mer enn det dobbelte av det gamle snacksbudsjettet", "Fruktprisene svinger mye med sesongen",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Erstatningene er for dyre å holde på med" } }),
    N11: node("D4", 1, 0, "Ingen storkjøp", "Kjøper du mat og drikke i kassevis for å få gratis frakt eller kvantumsrabatt, ender du med å spise mer hver dag jo mer som finnes hjemme", "Stopp hvis du innen 14 dager kjøper mat eller drikke i kassevis eller for å nå grensen for gratis frakt mer enn én gang", "Du styrer ikke godteri som venner og familie gir deg",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Rabatter får deg til å kjøpe mer og mer" } }),
    N12: node("D3", 0, 1, "Ingen dingser", "Venter du med å begynne til du har kjøpt en kullsyremaskin, søtningsmidler og alle slags erstatninger, presser pengene du har brukt deg til å tvinge i deg ting du ikke liker, og du gir opp innen 2 uker", "Stopp hvis du innen 14 dager kjøper mer enn 1 dings eller erstatning som du faktisk ikke bruker", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Du tvinger det i deg så det ikke går til spille" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Å holde søte snacks ute av huset og samtidig spise de vanlige søte snacksene dine går ikke sammen" },
    { type: "excludes", from: "N1", to: "N5", why: "Hvis sødmen bare kommer fra hel frukt, kan du ikke beholde de søte snacksene du elsker" },
    { type: "excludes", from: "N4", to: "N11", why: "Frukten hjemme bygger på å kjøpe en kasse hver uke; forby kjøp i kassevis, og den forsyningsplanen faller sammen" },
    { type: "excludes", from: "N2", to: "N7", why: "Denne veien endrer bare drikken og lar måltidene være, noe som strider mot å lage om den surt-søte sausen" },
    { type: "excludes", from: "N2", to: "N10", why: "Denne veien endrer bare drikken og kjøper ingen erstatningssnacks; et kostnadstak for erstatningssnacks hører til en annen vei, så velg én" },
    { type: "excludes", from: "N9", to: "N11", why: "Å ha kullsyrevann på lager betyr å kjøpe det i brett, noe som kolliderer direkte med å ikke storhandle" },
    { type: "requires", from: "N1", to: "N8", why: "Frukt inneholder også sukker; selv om frukt er det eneste søte du spiser, trenger du en daglig grense, ellers tærer for mye fortsatt på kroppen" },
    { type: "requires", from: "N4", to: "N10", why: "Å kjøpe frukt og yoghurt i kassevis hver uke blir fort mye, så du trenger et kostnadstak, ellers gir lommeboka opp først" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Én fast handletur i uken", v: "Gi opp snacksene du elsker", t: "De to første ukene med sug er tøffe", l: "Høyst tre porsjoner frukt om dagen", x: "Ingen impulsturer til bakeriet etter noe søtt" },
      fatal: "N10", thesis: "Stille søtsuget bare med hel frukt i begrensede mengder, og hold søte snacks ute av huset", title: "Bytt til frukt · ikke noe søtt hjemme",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ha kullsyrevann på lager i kjøleskapet", v: "Vent 15 minutter før du gir etter for suget", t: "Endre bare litt hver uke", l: "Sukkeret i måltidene er det samme", x: "Ikke lenger spise de gamle snacksene som vanlig" },
      fatal: "N12", thesis: "Ta et glass usøtet kullsyrevann når suget kommer, og test nye smaker i små mengder før du kjøper mer", title: "Bytt drikke først · kutt ned sakte",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Tell porsjoner hver gang", v: "Det søte hjemme frister fortsatt", t: "Det tar lang tid å se resultater", l: "Å kutte ned hviler helt på selvdisiplin", x: "Gi opp å bytte helt til frukt" },
      fatal: "N11", thesis: "Fortsett å spise det du liker, men bytt til små pakker, begrens porsjonene og lag den surt-søte sausen på nytt", title: "Behold favoritter · begrens og bytt saus",
    },
  },
  recommend: { key: "alpha", why: "Frukt er naturlig søt og syrlig, og å holde søte snacks ute av huset krever minst viljestyrke" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Hele surt-søtt-suget ditt dekkes av én eneste frukt eller drikk", kill: "Blir akkurat den utsolgt, eller går du lei av den, faller hele planen sammen", label: "Bare ett bytte" },
};
