// 內建示範星系（IntentAnalysisResponse v1.0，挪威文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Lagdeling", D2: "Hvordan variasjon uttrykkes", D3: "Omfang av tilpasning", D4: "Temaets oppbygning" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Motposisjon: press ${dims[dim]} til motsatt ytterpunkt`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_NB = {
  schema_version: "1.0",
  core: {
    decision: "Skal hvert merke forke sine egne komponenter, eller skal én felles core styres av konfigurasjon?",
    metric: "Innen 60 dager: et nytt tema går live på ≤2 dager, og hvert temas CSS er <50KB",
  },
  quadrants: {
    Q1: { scar: "Felles komponenter fylt med merke-ifs", sacred: "Null forgreninger i core" },
    Q2: { scar: "100+ temaer håndpatchet ett om gangen", sacred: "Typer fanger feil" },
    Q3: { scar: "Kopierte et designsystem og overabstraherte", sacred: "Utskiftbar struktur" },
    Q4: { scar: "Har sett tilpasninger løpe løpsk tre ganger", sacred: "Grensene holder" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tre lag", "Del komponentene i en ren core, en koordinerende view og et tema-blad; core får ikke importere tema-ID-er eller ruter", "Feil hvis tema-sjekker dukker opp i core innen 14 dager", null),
    N2: node("D2", 0, 1, "Kun CSS-vars", "Uttrykk enhver temaforskjell utelukkende gjennom CSS custom properties, uten noen forgreninger i komponenter eller layouter", "Feil hvis allerede det 3. temaet trenger komponentendringer", "Layoutforskjeller kan ikke uttrykkes med farger alene"),
    N3: node("D1", 1, 0, "Lazy tema-CSS", "Last bare det aktive temaets ene stilark ved kjøretid i stedet for å bunte alle temaer inn i første paint", "Feil hvis CSS-en til ett enkelt tema overstiger 50KB innen 14 dager", null),
    N4: node("D4", 0, 2, "Typede configs", "Hvert tema leverer et komplett TypeScript-configobjekt; ethvert manglende felt får bygget til å feile", "Feil hvis et nytt tema likevel krever endringer i felles komponenter", null),
    N5: node("D3", 2, 0, "Fork per merke", "Hvert tema kopierer komponentmappen og endrer den uavhengig, så merkene aldri påvirker hverandre", "Feil hvis en feilretting etter det 10. temaet berører mer enn 10 steder", "Én feilretting betyr å patche N kopier"),
    N6: node("D3", 1, 2, "Canary-temaer", "Rull ut hvert nytt tema bak et feature flag til 5 % av leietakerne i en uke; gå til 100 % først når feilraten treffer målet", "Feil hvis canary-feilraten overstiger 1 %", null),
    N7: node("D3", 2, 1, "Bytt skallet", "[D2 bilplattform] Layouter er som karosserier: bytt hele skallet mens det felles chassiset (view og core) står igjen", "Feil hvis et layoutbytte krever endringer i core", "Interaksjoner glir fra hverandre mellom layouter",
      { lateral: { src: "Bilindustri: plattformchassis", dist: 2, drop: "Å bygge hver bilmodell fra bunnen av" } }),
    N8: node("D2", 1, 0, "Faste slots", "[D3 LEGO-klosser] Layouter deklarerer faste slots; temaer kan bare plugge komponenter inn i slots og får ikke endre struktur utenfor dem", "Feil hvis DOM utenfor slots endres så mye som én gang", null,
      { lateral: { src: "Leker: LEGO-klossenes kobling", dist: 3, drop: "Fri DOM-tilpasning" } }),
    N9: node("D4", 2, 0, "Arv forskjeller", "[D4 skriftfamilie] Temaer deklarerer bare forskjellen fra default; alle andre felt arves automatisk", "Feil hvis arven går dypere enn 3 nivåer", null,
      { lateral: { src: "Typografi: vekter i en familie", dist: 4, drop: "Full kopi per tema" } }),
    N10: node("D2", 2, 0, "Tak på config", "Hvis hvert tilpasningsønske legger til et configfelt, vil vedlikeholdet av config uunngåelig koste mer enn å bare forke", "Slutt å legge til felt så snart ett enkelt config-grensesnitt har over 40 felt", "Config-helvete",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraksjon koster mer enn duplisering" } }),
    N11: node("D4", 1, 0, "Ingen omveier", "Hvis forretningssiden kan kreve merkesjekker direkte i felles komponenter, faller grensen innen et kvartal", "Ugyldig hvis en merkesjekk havner i felles komponenter innen 14 dager", "Å bytte grenser mot frister",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Fristpress belønner å bryte grenser" } }),
    N12: node("D3", 0, 1, "Ingen big bang", "Hvis alle 70 moduler må migreres før noe går live, vil sunk cost få refaktoreringen til å stoppe halvveis", "Stopp hvis den første modulen ikke er live innen 14 dager", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big bang-refaktorering holder fristene som gisler" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Felles typet config og komponent-forker per merke er et enten-eller" },
    { type: "excludes", from: "N1", to: "N5", why: "En felles core i tre lag og komponentkopier per merke utelukker hverandre" },
    { type: "excludes", from: "N4", to: "N11", why: "Typet config blokkerer allerede omveier ved kompilering, så manuell grensegjennomgang blir en overflødig bom" },
    { type: "excludes", from: "N2", to: "N7", why: "Hvis temaer bare endrer CSS-variabler, byttes ingen hele layoutkomponenter ut" },
    { type: "excludes", from: "N2", to: "N10", why: "Rene CSS-variabler har ingen configfelt som kan svulme opp; velg én" },
    { type: "excludes", from: "N9", to: "N11", why: "Arvekjeder tillater lokale overrides, noe som kolliderer med et rekkverk uten noen omveier" },
    { type: "requires", from: "N1", to: "N8", why: "Når det er delt i tre lag, må temaer tilpasse via faste slots, ellers blir view-laget punktert" },
    { type: "requires", from: "N4", to: "N10", why: "Typede configs trenger et tak på antall felt, ellers vokser de til config-helvete" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refaktoreringsarbeid på forhånd", v: "Ingen raske forker", t: "60 dager på å bygge skjelettet", l: "Integritetstester er et must", x: "Ingen merkespesifikke snarveier" },
      fatal: "N10", thesis: "Grenser i tre lag pluss typet config krymper hvert tema til ett enkelt blad", title: "Config-styrt · tre lag",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Begrenset layoutvariasjon", v: "Mindre designfrihet", t: "Små steg hver uke", l: "Komplekse layouter er utelukket", x: "Ingen strukturelle tilpasninger" },
      fatal: "N12", thesis: "Bruk bare CSS-variabler og arv, og rull ut temaer gradvis bak canaries", title: "Ren styling · gradvis",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplisert kode", v: "Feilrettinger berører mange steder", t: "Raskest ut", l: "Vedlikeholdskostnaden vokser lineært", x: "Gi opp typet config" },
      fatal: "N11", thesis: "Bytt hele layouter og la hvert merke forke sitt eget skall", title: "Merke-forker · felles chassis",
    },
  },
  recommend: { key: "alpha", why: "Med 100+ temaer er det bare config-styrt design som holder vedlikeholdskostnaden i sjakk" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Hvert tema arver fra det samme default-temaet", kill: "Går default i stykker, går layouten til hvert tema i stykker", label: "Sårbar default" },
};
