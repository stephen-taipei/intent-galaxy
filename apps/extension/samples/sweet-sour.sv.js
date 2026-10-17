// 擴充功能內建生活題示範星系（瑞典文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Var sötman kommer ifrån", D2: "Utlopp för suget", D3: "Hur stor förändring", D4: "Vad som finns hemma" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Motsatt synsätt driver ${dims[dim]} till andra ytterligheten`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_SV = {
  schema_version: "1.0",
  core: {
    decision: "Ska du byta ut allt sött mot hel frukt, eller fortsätta äta det du gillar och bara äta mindre av det?",
    metric: "Under 30 dagar högst 3 söta snacks och drycker i veckan sammanlagt (antecknat i mobilen för att kontrollera)",
  },
  quadrants: {
    Q1: { scar: "Åt en hel påse torkad frukt i tron att det var ett nyttigt mellanmål", sacred: "Sötma kommer bara från hel frukt" },
    Q2: { scar: "Slutade med socker tre gånger och föll dit i vecka två varje gång", sacred: "Det räknas bara om du faktiskt kan hålla i det" },
    Q3: { scar: "Kopierade en lågkolhydratmeny och tröttnade på tre dagar", sacred: "Byt metod, inte smak" },
    Q4: { scar: "Sett alldeles för många sluta med socker och glida tillbaka direkt", sacred: "Regler slår viljestyrka" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Hel frukt", "När du är sugen på något sött, ät bara hel färsk frukt, som kiwi, ananas, bär eller apelsiner; juice, torkad frukt och kanderad frukt räknas inte", "Misslyckas om du inom 14 dagar köper bakverk eller dessert för att stilla suget fler än 3 dagar", null),
    N2: node("D2", 0, 1, "Bubbelvatten", "När suget slår till, drick först ett glas osötat kolsyrat vatten med citron eller passionsfrukt; vill du fortfarande ha något sött efter 15 minuter, spara det till efter nästa måltid. Bara dryckerna ändras: måltiderna är desamma och du köper inga ersättningssnacks", "Misslyckas om du inom 14 dagar fortfarande vill ha något sött efter de 15 minuterna i mer än hälften av fallen", "En dryck stillar inte behovet av att tugga på något"),
    N3: node("D1", 1, 0, "Bara efter mat", "Ät sötsura snacks och frukt bara inom 1 timme efter en måltid; inget på fastande mage och inget de 3 timmarna före läggdags", "Misslyckas om du efter 14 dagar fortfarande letar efter snacks före läggdags fler än 3 kvällar", null),
    N4: node("D4", 0, 2, "Godisfritt hem", "Handla en gång i veckan: säsongsfrukt i hel låda och tillräckligt med osötad naturell yoghurt för veckan; det är de enda snacksen i huset, och söta snacks kommer aldrig hem", "Misslyckas om det inom 14 dagar fortfarande finns en vecka då du köper godis ute mer än 3 gånger", null),
    N5: node("D3", 2, 0, "Halvera favorit", "Fortsätt äta de sötsura snacks du älskar, bara mindre: byt till portionsförpackningar och halvera den dagliga mängden, utan ersättningar", "Misslyckas om du från vecka 2 äter mer än hälften av din gamla mängd fler än 2 dagar i veckan", "Ofta öppnar man påse nummer två direkt efter den första"),
    N6: node("D3", 1, 2, "Smaka först", "Köp minsta förpackningen av varje ny smak osötad dryck och drick den 3 dagar i rad; köp ett helt flak bara om du gillar den, och hamstra aldrig allt på en gång", "Misslyckas om en smak du köpte flakvis efter att ha testat fortfarande är mer än halvfull 14 dagar senare", null),
    N7: node("D3", 2, 1, "Byt såsen", "Som att byta mobilskal i stället för mobil: behåll huvudingredienserna i sötsur fläsk eller fisk, men gör såsen själv av tomat, ananas och vinäger med hälften så mycket socker som vanligt", "Misslyckas om alla hemma efter 2 försök med den nya såsen inom 14 dagar säger att den inte är god", "På restaurang och vid avhämtning kan du inte ändra såsen",
      { lateral: { src: "Teknik: byta mobilskal", dist: 2, drop: "Stryka rätten helt från menyn" } }),
    N8: node("D2", 1, 0, "Max 3 om dagen", "Som ett flygbolags bagagegräns: högst 3 portioner frukt och sötsura snacks sammanlagt per dag, var och en ungefär lika stor som din knytnäve; resten får vänta till i morgon, i stället för att lita på viljestyrkan i stunden", "Misslyckas om du äter fler än 3 portioner fler än 2 dagar i en vecka", null,
      { lateral: { src: "Flygbolag: bagagegräns", dist: 3, drop: "Äta när som helst utan gräns" } }),
    N9: node("D4", 2, 0, "Fyll kylen", "Fyll på som en matbutik gör innan hyllan blir tom: ha alltid ett flak osötat kolsyrat vatten och en påse citroner i kylen, och köp ett nytt flak när det är 3 burkar kvar, så att suget aldrig skickar ut dig efter bubble tea eller läsk", "Misslyckas om du inom 14 dagar fortfarande köper fler än 3 söta drycker ute", null,
      { lateral: { src: "Detaljhandel: fyll på före slutsålt", dist: 4, drop: "Köpa en dryck först när man är sugen" } }),
    N10: node("D2", 2, 0, "Kostnadstak", "Om ersättningssnacks som frukt och osötad yoghurt kostar mer än dubbelt så mycket som du tidigare lade på snacks i veckan, ger du upp inom en månad och börjar köpa snacks igen", "Stoppa om ersättningssnacks inom 14 dagar kostar mer än dubbla din gamla snacksbudget", "Fruktpriser svänger mycket med säsongen",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Ersättningarna är för dyra att hålla i" } }),
    N11: node("D4", 1, 0, "Inga storköp", "Köper du mat och dryck i hela lådor för att få fri frakt eller mängdrabatt, slutar det med att du äter mer varje dag ju mer som finns hemma", "Stoppa om du inom 14 dagar köper mat eller dryck i lådor eller för att nå gränsen för fri frakt mer än en gång", "Du styr inte över godis som vänner och familj ger dig",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Rabatter får dig att köpa mer och mer" } }),
    N12: node("D3", 0, 1, "Inga prylar", "Väntar du med att börja tills du har köpt en kolsyremaskin, sötningsmedel och alla sorters ersättningar, pressar de spenderade pengarna dig att tvinga i dig saker du inte gillar, och du ger upp inom 2 veckor", "Stoppa om du inom 14 dagar köper mer än 1 pryl eller ersättning som du faktiskt inte använder", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Du tvingar i dig det så att det inte går till spillo" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Att hålla söta snacks borta från hemmet och ändå äta dina vanliga söta snacks går inte ihop" },
    { type: "excludes", from: "N1", to: "N5", why: "Om sötman bara kommer från hel frukt kan du inte behålla de söta snacks du älskar" },
    { type: "excludes", from: "N4", to: "N11", why: "Frukten hemma bygger på att köpa en låda varje vecka; förbjud lådköp och den förrådsplanen faller ihop" },
    { type: "excludes", from: "N2", to: "N7", why: "Den här vägen ändrar bara dryckerna och lämnar måltiderna i fred, vilket krockar med att göra om den sötsura såsen" },
    { type: "excludes", from: "N2", to: "N10", why: "Den här vägen ändrar bara dryckerna och köper inga ersättningssnacks; ett kostnadstak för ersättningssnacks hör till en annan väg, så välj en" },
    { type: "excludes", from: "N9", to: "N11", why: "Att ha kolsyrat vatten på lager betyder att köpa det flakvis, vilket krockar direkt med att inte storhandla" },
    { type: "requires", from: "N1", to: "N8", why: "Frukt innehåller också socker; även om frukt är ditt enda godis behöver du en daglig gräns, annars tär för mycket ändå på kroppen" },
    { type: "requires", from: "N4", to: "N10", why: "Att köpa frukt och yoghurt i lådor varje vecka blir mycket pengar, så du behöver ett kostnadstak, annars ger plånboken upp först" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "En fast storhandling i veckan", v: "Ge upp de snacks du älskar", t: "De två första veckorna med sug är tuffa", l: "Högst tre portioner frukt om dagen", x: "Inga impulsköp av fikabröd" },
      fatal: "N10", thesis: "Stilla sötsuget bara med hel frukt i begränsade mängder, och håll söta snacks borta från hemmet", title: "Byt till frukt · inget sött hemma",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ha kolsyrat vatten på lager i kylen", v: "Vänta 15 minuter innan du ger efter för suget", t: "Ändra bara lite varje vecka", l: "Sockret i måltiderna är detsamma", x: "Inte längre äta de gamla snacksen som vanligt" },
      fatal: "N12", thesis: "Ta osötat kolsyrat vatten när suget slår till, och testa nya smaker i små mängder innan du köper mer", title: "Byt drycker först · dra ner långsamt",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Räkna portioner varje gång", v: "Det söta hemma lockar fortfarande", t: "Det tar lång tid att se resultat", l: "Att dra ner vilar helt på självdisciplin", x: "Ge upp att byta helt till frukt" },
      fatal: "N11", thesis: "Fortsätt äta det du gillar, men byt till små förpackningar, begränsa portionerna och gör om den sötsura såsen", title: "Behåll favoriter · begränsa och byt sås",
    },
  },
  recommend: { key: "alpha", why: "Frukt är naturligt söt och syrlig, och att hålla söta snacks borta från hemmet kräver minst viljestyrka" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Allt ditt sötsura sug stillas av en enda frukt eller dryck", kill: "Blir just den slutsåld eller tröttnar du på den, faller hela planen ihop", label: "Bara ett byte" },
};
