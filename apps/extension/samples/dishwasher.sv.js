// 擴充功能生活題示範星系（瑞典文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Placering", D2: "Urvalsgrund", D3: "Hur mycket ombyggnad", D4: "Kapacitet & disk" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Andra sidan driver ${dims[dim]} till motsatt ytterlighet`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_SV = {
  schema_version: "1.0",
  core: {
    decision: "Ska du bygga om köket kring en diskmaskin, eller välja en som får plats i köket du redan har?",
    metric: "Under de första 30 dagarna körs den minst 5 gånger i veckan och du diskar för hand högst 5 minuter om dagen",
  },
  quadrants: {
    Q1: { scar: "Köpte en diskmaskin och diskade ändå för hand", sacred: "Räkna disken först" },
    Q2: { scar: "Upptäckte mitt i installationen att slangen var för kort", sacred: "Mät innan du köper" },
    Q3: { scar: "Köpte från en topplista på nätet och den fick inte plats", sacred: "Låna idéer från andra områden" },
    Q4: { scar: "Sett tre diskmaskiner sluta som diskställ", sacred: "Planera för misslyckande först" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Inbyggd vid ho", "Ta bort underskåpet på 45 eller 60 cm bredvid diskhon och bygg in maskinen, så att den inte tar bänkyta eller blockerar gången", "Passar inte om skåpets bredd, höjd eller djup är mindre än maskinens angivna inbyggnadsmått", null),
    N2: node("D2", 0, 1, "Efter maten", "Välj en modell med snabbprogram under 1 timme och kör den efter varje måltid, så att smutsig disk aldrig står i diskhon över natten", "Passar inte om disken fortfarande känns flottig efter ett snabbprogram mer än 2 gånger på 14 dagar", "Snabbprogram hoppar oftast över torkningen, så disken får lufttorka"),
    N3: node("D1", 1, 0, "Bredvid diskhon", "Ställ maskinen högst 1 meter från diskhon och dra avloppsslangen direkt ner i hons avlopp, utan att borra genom väggar eller dra nya rör", "Passar inte om den medföljande avloppsslangen inte når diskhon och måste förlängas", null),
    N4: node("D4", 0, 2, "För familjen", "Är ni 3 eller fler i hushållet, välj 12+ kuvert så att kastruller och disk går i en omgång i stället för två", "Passar inte om disk och kastruller inte får plats i en omgång mer än 2 av 14 dagar", null),
    N5: node("D3", 2, 0, "Bänkmodell", "Köp en bänkdiskmaskin för högst 8 kuvert: inget skåp ska bort, inga rörändringar, och den flyttar med dig", "Passar inte om det mer än 3 av 14 dagar krävs 2 körningar för att få allt rent", "Äter upp en stor bit av arbetsbänken"),
    N6: node("D3", 1, 2, "Testa först", "Köp en modell som fungerar fristående eller inbyggd, låt den stå vid diskhon i hela 30 dagar och bestäm först sedan om skåpet ska bort, i stället för att riva ut det dag ett", "Passar inte om maskinen under den 30 dagar långa provperioden blockerar gången eller en låda", null),
    N7: node("D3", 2, 1, "Egen vattentank", "Som en husbil med egen vattentank: välj en bänkmodell som du fyller för hand, utan anslutning till kranen och utan rörändringar", "Passar inte om du någon vecka diskar för hand 2 gånger eller fler för att du inte orkade fylla den", "Att fylla den är krångligare än man tror",
      { lateral: { src: "Camping: inbyggd vattentank", dist: 2, drop: "Fast anslutning till kranen" } }),
    N8: node("D2", 1, 0, "Mät först", "Som en pilots checklista före start: mät bredd, djup och höjd innan du beställer, och kontrollera sedan uttag och avlopp; saknas någon av de 5 punkterna, beställ inte", "Passar inte om något inte stämmer eller om den inte går att installera när den levererats", null,
      { lateral: { src: "Flyg: checklista före start", dist: 3, drop: "Beställa på magkänsla" } }),
    N9: node("D4", 2, 0, "Maskindiskbart", "Som en restaurang som bara använder maskindiskbart porslin: byt ut alla kastruller och all disk som inte tål maskindisk, så att inget blir kvar att diska för hand", "Passar inte om du under de 14 dagarna efter bytet fortfarande diskar mer än 3 saker för hand om dagen", null,
      { lateral: { src: "Restauranger: storköksporslin", dist: 4, drop: "Hopplock av gammalt porslin" } }),
    N10: node("D2", 2, 0, "Aldrig halvfull", "Kör du den mindre än halvfull drar den nästan lika mycket vatten och el som en full omgång, så varje tallrik kostar mer än dubbelt så mycket", "Anteckna din disk i 7 dagar innan du beställer; ligger du i snitt under 6 kuvert om dagen, byt till en bänkmodell", "Disken börjar lukta medan du väntar på en full maskin",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Det lönar sig inte att köra en stor maskin halvtom" } }),
    N11: node("D4", 1, 0, "Kastruller ute", "Trycker du av bekvämlighet in wokpannor och grytor får en bänkmodell inte in disken i en omgång, och du står och diskar för hand igen", "Släpp det om kastruller tvingar fram en andra omgång mer än 2 gånger på 14 dagar", "Alla i hushållet följer inte regeln",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Överlasta maskinen av bekvämlighet" } }),
    N12: node("D3", 0, 1, "Ingen ombyggnad", "Om installationen av en diskmaskin växer till en ombyggnad av hela köket sitter du fast så fort arbetet har börjat och pengarna är betalda", "Börja inte om offerten innan skåpet tas bort är mer än 2x maskinens pris", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "När arbetet väl har börjat finns ingen väg tillbaka" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "En maskin för 12+ kuvert får inte plats på bänken, så det är antingen den eller en bänkmodell" },
    { type: "excludes", from: "N1", to: "N5", why: "När en maskin väl är inbyggd i skåpet köper du inte också en bänkmodell; det är det ena eller det andra" },
    { type: "excludes", from: "N4", to: "N11", why: "Poängen med att välja större är att kastrullerna också ska med, vilket krockar med att hålla kastruller ute" },
    { type: "excludes", from: "N2", to: "N7", why: "Att köra efter varje måltid betyder att fylla tanken för hand tre gånger om dagen, och det är svårt att hålla i" },
    { type: "excludes", from: "N2", to: "N10", why: "Att köra efter varje måltid blir ofta mindre än en halv omgång, vilket krockar med regeln om aldrig halvfull" },
    { type: "excludes", from: "N9", to: "N11", why: "Poängen med att byta till maskindiskbara kastruller och porslin är att ställa in dem, vilket krockar med att hålla kastruller ute" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm fel och den glider inte in i skåpet, så allt måste mätas innan du beställer" },
    { type: "requires", from: "N4", to: "N10", why: "En stor maskin som körs halvtom drar ändå vatten och el för en full omgång, så håll fast vid aldrig halvfull" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Skåp bort och montörskostnad", v: "Ett skåp mindre för förvaring", t: "Vänta på en montör för mätning och installation", l: "Vänta med att köra tills den är halvfull", x: "Ge upp bänkmodellen" },
      fatal: "N10", thesis: "Mät skåpet, bygg in en stor maskin och kör bara när den är halvfull", title: "Stor inbyggd maskin, gjort en gång",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nya kastruller och nytt porslin, plus vatten och el vid varje måltid", v: "Tar upp gången under provperioden", t: "Skåpet åker ut först efter 30 dagar", l: "Lufttorka disken efter snabbprogram", x: "Ge upp bänkmodellen" },
      fatal: "N12", thesis: "Snabbdisk efter varje måltid; låt den stå vid diskhon tills det fungerar, bygg sedan in den", title: "Snabbdisk varje dag, testa innan inbyggnad",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Fyll på vatten för hand varje körning", v: "Äter upp en stor bit av arbetsbänken", t: "Diska kastruller för hand varje dag", l: "Högst 8 kuvert", x: "Ge upp inbyggnad och stor kapacitet" },
      fatal: "N11", thesis: "En bänkmodell som du fyller själv; kastruller diskas fortfarande för hand", title: "Bänkmodell, inga rör",
    },
  },
  recommend: { key: "alpha", why: "För ett hushåll på 3 eller fler klarar en stor maskin en hel dags disk i en enda omgång" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Hela familjens disk hänger på den här enda maskinen; går den sönder är handdisk den enda reserven", kill: "Släpp det om en reparation tar mer än 7 dagar och familjen går tillbaka till handdisk", label: "En enda maskin" },
};
