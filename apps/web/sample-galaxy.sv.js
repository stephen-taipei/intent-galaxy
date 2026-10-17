// 內建示範星系（IntentAnalysisResponse v1.0，瑞典文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Lagergränser", D2: "Hur variation uttrycks", D3: "Anpassningens omfång", D4: "Temats uppbyggnad" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Motposition: driv ${dims[dim]} till motsatt ytterlighet`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_SV = {
  schema_version: "1.0",
  core: {
    decision: "Ska varje varumärke forka sina egna komponenter, eller ska en gemensam core styras av konfiguration?",
    metric: "Inom 60 dagar: ett nytt tema går live på ≤2 dagar, och varje temas CSS är <50KB",
  },
  quadrants: {
    Q1: { scar: "Gemensamma komponenter fulla av varumärkes-ifs", sacred: "Noll förgreningar i core" },
    Q2: { scar: "100+ teman handpatchade ett i taget", sacred: "Typer fångar misstag" },
    Q3: { scar: "Kopierade ett designsystem och överabstraherade", sacred: "Utbytbar struktur" },
    Q4: { scar: "Sett anpassningar spåra ur tre gånger", sacred: "Gränser håller" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tre lager", "Dela upp komponenter i en ren core, en samordnande view och ett tema-löv; core får inte importera tema-ID:n eller routes", "Fel om temakontroller dyker upp i core inom 14 dagar", null),
    N2: node("D2", 0, 1, "Bara CSS-vars", "Uttryck varje temaskillnad enbart genom CSS custom properties, utan någon förgrening i komponenter eller layouter", "Fel om redan det 3:e temat kräver komponentändringar", "Layoutskillnader kan inte uttryckas med bara färger"),
    N3: node("D1", 1, 0, "Lazy tema-CSS", "Ladda vid körning bara det aktiva temats enda stilmall i stället för att bunta alla teman i första paint", "Fel om något enskilt temas CSS överstiger 50KB inom 14 dagar", null),
    N4: node("D4", 0, 2, "Typade configs", "Varje tema levererar ett komplett TypeScript-configobjekt; varje saknat fält får bygget att fallera", "Fel om ett nytt tema ändå kräver ändringar i gemensamma komponenter", null),
    N5: node("D3", 2, 0, "Fork per brand", "Varje tema kopierar komponentkatalogen och ändrar den fristående, så att varumärken aldrig påverkar varandra", "Fel om en buggfix efter det 10:e temat berör fler än 10 ställen", "En buggfix betyder att patcha N kopior"),
    N6: node("D3", 1, 2, "Canary-teman", "Släpp varje nytt tema bakom en feature flag till 5 % av hyresgästerna i en vecka; gå till 100 % först när felfrekvensen når målet", "Fel om canary-felfrekvensen överstiger 1 %", null),
    N7: node("D3", 2, 1, "Byt skalet", "[D2 bilplattform] Layouter är som karosser: byt hela skalet medan det gemensamma chassit (view och core) står kvar", "Fel om ett layoutbyte kräver ändringar i core", "Interaktioner glider isär mellan layouter",
      { lateral: { src: "Fordonsindustri: plattformschassi", dist: 2, drop: "Att bygga varje bilmodell från grunden" } }),
    N8: node("D2", 1, 0, "Fasta slots", "[D3 LEGO-bitar] Layouter deklarerar fasta slots; teman får bara stoppa komponenter i slots och får inte ändra struktur utanför dem", "Fel om DOM utanför slots ändras ens en gång", null,
      { lateral: { src: "Leksaker: LEGO-bitarnas koppling", dist: 3, drop: "Fri DOM-anpassning" } }),
    N9: node("D4", 2, 0, "Ärv skillnader", "[D4 typsnittsfamilj] Teman deklarerar bara sin skillnad mot default; alla andra fält ärvs automatiskt", "Fel om arvet går djupare än 3 nivåer", null,
      { lateral: { src: "Typografi: vikter i en familj", dist: 4, drop: "Full kopia per tema" } }),
    N10: node("D2", 2, 0, "Tak för config", "Om varje anpassningsönskemål lägger till ett configfält kommer underhållet av config ofrånkomligen att kosta mer än att bara forka", "Sluta lägga till fält så fort ett enskilt config-interface har fler än 40 fält", "Config-helvete",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraktion kostar mer än duplicering" } }),
    N11: node("D4", 1, 0, "Inga genvägar", "Om verksamheten kan kräva varumärkeskontroller direkt i gemensamma komponenter faller gränsen inom ett kvartal", "Ogiltigt om en varumärkeskontroll hamnar i gemensamma komponenter inom 14 dagar", "Byta gränser mot deadlines",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadlinepress belönar att bryta gränser" } }),
    N12: node("D3", 0, 1, "Ingen big bang", "Om alla 70 moduler måste migreras innan något går live kommer sunk cost att få refaktoreringen att stanna halvvägs", "Avbryt om den första modulen inte är live inom 14 dagar", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big bang-refaktorering tar deadlines som gisslan" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Gemensam typad config och komponentforkar per varumärke är ett antingen-eller" },
    { type: "excludes", from: "N1", to: "N5", why: "En gemensam core i tre lager och komponentkopior per varumärke utesluter varandra" },
    { type: "excludes", from: "N4", to: "N11", why: "Typad config blockerar redan genvägar vid kompilering, så manuell gränsgranskning blir en dubbel spärr" },
    { type: "excludes", from: "N2", to: "N7", why: "Om teman bara ändrar CSS-variabler byts inga hela layoutkomponenter ut" },
    { type: "excludes", from: "N2", to: "N10", why: "Rena CSS-variabler har inga configfält som kan svälla; välj ett" },
    { type: "excludes", from: "N9", to: "N11", why: "Arvskedjor tillåter lokala overrides, vilket krockar med ett skyddsräcke utan några genvägar" },
    { type: "requires", from: "N1", to: "N8", why: "När det är uppdelat i tre lager måste teman anpassa via fasta slots, annars punkteras view-lagret" },
    { type: "requires", from: "N4", to: "N10", why: "Typade configs behöver ett tak för antalet fält, annars sväller de till config-helvete" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refaktoreringsarbete i förväg", v: "Inga snabba forkar", t: "60 dagar för att bygga skelettet", l: "Integritetstester är ett måste", x: "Inga varumärkesspecifika genvägar" },
      fatal: "N10", thesis: "Gränser i tre lager plus typad config krymper varje tema till ett enda löv", title: "Config-styrt · tre lager",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Begränsad layoutvariation", v: "Mindre designfrihet", t: "Små steg varje vecka", l: "Komplexa layouter är uteslutna", x: "Inga strukturella anpassningar" },
      fatal: "N12", thesis: "Använd bara CSS-variabler och arv, och rulla ut teman stegvis bakom canaries", title: "Ren styling · stegvis",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicerad kod", v: "Buggfixar berör många ställen", t: "Snabbast i drift", l: "Underhållskostnaden växer linjärt", x: "Ge upp typad config" },
      fatal: "N11", thesis: "Byt hela layouter och låt varje varumärke forka sitt eget skal", title: "Varumärkesforkar · gemensamt chassi",
    },
  },
  recommend: { key: "alpha", why: "Med 100+ teman är det bara config-styrd design som håller underhållskostnaden i schack" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Varje tema ärver från samma default-tema", kill: "Går default sönder, går varje temas layout sönder", label: "default-SPOF" },
};
