// 內建示範星系（IntentAnalysisResponse v1.0，丹麥文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Lag-grænser", D2: "Hvordan variation udtrykkes", D3: "Tilpasningens omfang", D4: "Temaets opbygning" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Modposition: skub ${dims[dim]} til den modsatte yderlighed`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_DA = {
  schema_version: "1.0",
  core: {
    decision: "Skal hvert brand forke sine egne komponenter, eller skal én fælles core styres af konfiguration?",
    metric: "Inden for 60 dage: et nyt tema går live på ≤2 dage, og hvert temas CSS er <50KB",
  },
  quadrants: {
    Q1: { scar: "Fælles komponenter proppet med brand-ifs", sacred: "Nul forgreninger i core" },
    Q2: { scar: "100+ temaer håndpatchet ét ad gangen", sacred: "Typer fanger fejl" },
    Q3: { scar: "Kopierede et designsystem og overabstraherede", sacred: "Udskiftelig struktur" },
    Q4: { scar: "Har set tilpasninger løbe løbsk tre gange", sacred: "Grænser holder" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tre lag", "Del komponenter op i en ren core, en koordinerende view og et tema-blad; core må ikke importere tema-ID'er eller routes", "Forkert, hvis der dukker tema-tjek op i core inden for 14 dage", null),
    N2: node("D2", 0, 1, "Kun CSS-vars", "Udtryk enhver temaforskel udelukkende med CSS custom properties, uden nogen forgrening i komponenter eller layouts", "Forkert, hvis allerede det 3. tema kræver komponentændringer", "Layoutforskelle kan ikke udtrykkes med farver alene"),
    N3: node("D1", 1, 0, "Lazy tema-CSS", "Indlæs ved runtime kun det aktive temas ene stylesheet i stedet for at bundte alle temaer i første paint", "Forkert, hvis et enkelt temas CSS overstiger 50KB inden for 14 dage", null),
    N4: node("D4", 0, 2, "Typede configs", "Hvert tema leverer et komplet TypeScript-configobjekt; ethvert manglende felt får buildet til at fejle", "Forkert, hvis et nyt tema stadig kræver ændringer i fælles komponenter", null),
    N5: node("D3", 2, 0, "Fork pr. brand", "Hvert tema kopierer komponentmappen og ændrer den selvstændigt, så brands aldrig påvirker hinanden", "Forkert, hvis en bugfix efter det 10. tema rører mere end 10 steder", "Én bugfix betyder at patche N kopier"),
    N6: node("D3", 1, 2, "Canary-temaer", "Udrul hvert nyt tema bag et feature flag til 5 % af lejerne i en uge; gå først til 100 %, når fejlraten rammer målet", "Forkert, hvis canary-fejlraten overstiger 1 %", null),
    N7: node("D3", 2, 1, "Skift skallen", "[D2 bilplatform] Layouts er som karrosserier: skift hele skallen, mens det fælles chassis (view og core) bliver stående", "Forkert, hvis et layoutskift kræver ændringer i core", "Interaktioner glider fra hinanden mellem layouts",
      { lateral: { src: "Bilindustri: platformchassis", dist: 2, drop: "At bygge hver bilmodel op fra bunden" } }),
    N8: node("D2", 1, 0, "Faste slots", "[D3 LEGO-klodser] Layouts erklærer faste slots; temaer må kun sætte komponenter i slots og må ikke ændre struktur uden for dem", "Forkert, hvis DOM uden for slots ændres bare én gang", null,
      { lateral: { src: "Legetøj: LEGO-klodsernes kobling", dist: 3, drop: "Fri DOM-tilpasning" } }),
    N9: node("D4", 2, 0, "Arv forskelle", "[D4 skriftfamilie] Temaer erklærer kun deres forskel fra default; alle andre felter arves automatisk", "Forkert, hvis arven går mere end 3 niveauer ned", null,
      { lateral: { src: "Typografi: snit i en skriftfamilie", dist: 4, drop: "Fuld kopi pr. tema" } }),
    N10: node("D2", 2, 0, "Loft på config", "Hvis hvert tilpasningsønske tilføjer et configfelt, vil vedligeholdelsen af config uundgåeligt koste mere end bare at forke", "Stop med at tilføje felter, så snart et enkelt config-interface har over 40 felter", "Config-helvede",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraktion koster mere end duplikering" } }),
    N11: node("D4", 1, 0, "Ingen omveje", "Hvis forretningen kan kræve brand-tjek direkte i fælles komponenter, falder grænsen inden for et kvartal", "Ugyldig, hvis et brand-tjek lander i fælles komponenter inden for 14 dage", "At bytte grænser for deadlines",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadlinepres belønner at bryde grænser" } }),
    N12: node("D3", 0, 1, "Ingen big bang", "Hvis alle 70 moduler skal migreres, før noget går live, går refaktoreringen i stå halvvejs på grund af sunk cost", "Stop, hvis det første modul ikke er live inden for 14 dage", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big bang-refaktorering holder deadlines som gidsler" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Fælles typet config og komponent-forks pr. brand er et enten-eller" },
    { type: "excludes", from: "N1", to: "N5", why: "En fælles core i tre lag og komponentkopier pr. brand udelukker hinanden" },
    { type: "excludes", from: "N4", to: "N11", why: "Typet config blokerer allerede omveje ved kompilering, så manuel grænsegennemgang bliver en overflødig bom" },
    { type: "excludes", from: "N2", to: "N7", why: "Hvis temaer kun ændrer CSS-variabler, skiftes der ikke hele layoutkomponenter ud" },
    { type: "excludes", from: "N2", to: "N10", why: "Rene CSS-variabler har ingen configfelter, der kan svulme op; vælg én" },
    { type: "excludes", from: "N9", to: "N11", why: "Arvekæder tillader lokale overrides, hvilket strider mod et sikkerhedsværn uden nogen omveje" },
    { type: "requires", from: "N1", to: "N8", why: "Når der er delt op i tre lag, skal temaer tilpasse via faste slots, ellers bliver view-laget gennemhullet" },
    { type: "requires", from: "N4", to: "N10", why: "Typede configs kræver et loft over antal felter, ellers vokser de til config-helvede" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refaktoreringsarbejde på forhånd", v: "Ingen hurtige forks", t: "60 dage til at bygge skelettet", l: "Integritetstests er et must", x: "Ingen brandspecifikke genveje" },
      fatal: "N10", thesis: "Grænser i tre lag plus typet config skærer hvert tema ned til ét enkelt blad", title: "Config-styret · tre lag",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Begrænset layoutvariation", v: "Mindre designfrihed", t: "Små skridt hver uge", l: "Komplekse layouts er udelukket", x: "Ingen strukturelle tilpasninger" },
      fatal: "N12", thesis: "Brug kun CSS-variabler og arv, og udrul temaer gradvist bag canaries", title: "Ren styling · gradvist",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplikeret kode", v: "Bugfixes rammer mange steder", t: "Hurtigst i luften", l: "Vedligeholdelsesomkostninger vokser lineært", x: "Opgiv typet config" },
      fatal: "N11", thesis: "Skift hele layouts, og lad hvert brand forke sin egen skal", title: "Brand-forks · fælles chassis",
    },
  },
  recommend: { key: "alpha", why: "Med 100+ temaer er det kun config-styret design, der holder vedligeholdelsesomkostningerne nede" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Alle temaer arver fra det samme default-tema", kill: "Går default i stykker, går alle temaers layout i stykker", label: "Sårbar default" },
};
