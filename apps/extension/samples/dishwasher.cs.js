// 擴充功能生活題示範星系（捷克文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Umístění", D2: "Jak vybírat", D3: "Rozsah úprav", D4: "Kapacita a nádobí" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druhá strana — ${dims[dim]}: opačný extrém`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_CS = {
  schema_version: "1.0",
  core: {
    decision: "Přestavět kuchyň kvůli myčce, nebo vybrat takovou, která se vejde do kuchyně, kterou už máte?",
    metric: "Prvních 30 dnů: myčka běží aspoň 5× týdně a ruční mytí nádobí zabere nejvýš 5 minut denně",
  },
  quadrants: {
    Q1: { scar: "Koupil myčku a stejně myje ručně", sacred: "Nejdřív spočítej nádobí" },
    Q2: { scar: "Při montáži zjistil, že hadice je krátká", sacred: "Měř, než koupíš" },
    Q3: { scar: "Koupil podle žebříčku z internetu a nevešla se", sacred: "Půjčuj si nápady z jiných oborů" },
    Q4: { scar: "Viděl tři myčky skončit jako odkapávač na nádobí", sacred: "Nejdřív naplánuj selhání" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Do skříňky", "Vyndej 45 nebo 60cm skříňku vedle dřezu a myčku tam vestav, aby nezabírala linku a nepřekážela v průchodu", "Nesedí, pokud je šířka, výška nebo hloubka skříňky menší než udávané rozměry pro vestavbu", null),
    N2: node("D2", 0, 1, "Po každém jídle", "Vyber model s rychlým programem pod 1 hodinu a pouštěj ho po každém jídle, aby špinavé nádobí nikdy nezůstalo v dřezu přes noc", "Nesedí, pokud je nádobí po rychlém programu za 14 dnů víc než 2× mastné", "Rychlé programy většinou vynechávají sušení, takže nádobí schne samo"),
    N3: node("D1", 1, 0, "Vedle dřezu", "Postav myčku do 1 metru od dřezu a vypouštěcí hadici napoj rovnou na sifon dřezu, bez sekání do zdí a nových rozvodů", "Nesedí, pokud přiložená vypouštěcí hadice k dřezu nedosáhne a je potřeba prodloužení", null),
    N4: node("D4", 0, 2, "Pro rodinu", "Při 3 a více lidech v domácnosti ber model na 12+ sad nádobí, aby se hrnce i talíře vešly do jednoho mytí místo dvou", "Nesedí, pokud se víc než 2 dny ze 14 nádobí s hrnci nevejde do jednoho mytí", null),
    N5: node("D3", 2, 0, "Mini na linku", "Kup malou myčku na linku pro nejvýš 8 sad: žádné vyndávání skříněk, žádné úpravy rozvodů a při stěhování ji vezmeš s sebou", "Nesedí, pokud je víc než 3 dny ze 14 potřeba 2 mytí, aby bylo všechno čisté", "Zabere slušný kus pracovní plochy"),
    N6: node("D3", 1, 2, "Nejdřív zkouška", "Kup model, který může stát volně i ve vestavbě, nech ho celých 30 dnů u dřezu a teprve pak rozhodni o vyndání skříňky, místo abys ji vytrhl hned první den", "Nesedí, pokud myčka během 30denní zkoušky blokuje průchod nebo šuplík", null),
    N7: node("D3", 2, 1, "Vlastní nádrž", "Jako obytňák s vlastní nádrží na vodu: vyber myčku na linku, do které vodu naléváš ručně, bez napojení na kohoutek a bez úprav rozvodů", "Nesedí, pokud ji v kterémkoli týdnu 2× a víckrát vynecháš a umyješ to ručně, protože se ti nechtělo nalévat vodu", "Nalévání vody je otravnější, než se zdá",
      { lateral: { src: "Kempování: vestavěná nádrž na vodu", dist: 2, drop: "Pevné napojení na kohoutek" } }),
    N8: node("D2", 1, 0, "Nejdřív změř", "Jako předletový checklist pilota: před objednávkou změř šířku, hloubku a výšku, pak zkontroluj zásuvku a odpad; když chybí kterákoli z 5 položek, neobjednávej", "Nesedí, pokud něco nesouhlasí nebo ji po doručení nejde nainstalovat", null,
      { lateral: { src: "Letectví: předletový checklist", dist: 3, drop: "Objednávání od oka" } }),
    N9: node("D4", 2, 0, "Nádobí do myčky", "Jako restaurace, která používá jen nádobí odolné myčce: vyměň každý hrnec a talíř s označením „nemýt v myčce“, aby nic nezbylo na ruční mytí", "Nesedí, pokud ještě 14 dnů po výměně myješ ručně víc než 3 kusy denně", null,
      { lateral: { src: "Gastro: profesionální nádobí", dist: 4, drop: "Doma směs starého nádobí" } }),
    N10: node("D2", 2, 0, "Ne poloprázdná", "Když myčku pustíš míň než z poloviny plnou, spotřebuje skoro tolik vody a proudu jako plná, takže umytí jednoho kusu vyjde víc než dvakrát dráž", "Před objednávkou si 7 dnů zapisuj nádobí; pokud vychází průměrně méně než 6 sad denně, přejdi na mini", "Než se naplní celá myčka, nádobí začne zapáchat",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Velká myčka puštěná poloprázdná se nevyplatí" } }),
    N11: node("D4", 1, 0, "Bez hrnců", "Když tam z pohodlnosti cpeš woky a velké hrnce, mini nádobí na jedno mytí nepobere a zase skončíš u dřezu", "Zahoď, pokud hrnce za 14 dnů víc než 2× vynutí druhé mytí", "Ne každý doma bude pravidlo dodržovat",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Přeplňování myčky z pohodlnosti" } }),
    N12: node("D3", 0, 1, "Žádná přestavba", "Pokud se z instalace myčky vyklube přestavba celé kuchyně, jakmile práce začnou a peníze jsou venku, už musíš jet až do konce", "Nezačínej, pokud je cenová nabídka před vyndáním skříňky víc než 2× dražší než myčka", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Jakmile se začne, není cesty zpět" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Myčka na 12+ sad se na linku nevejde, takže buď ona, nebo mini na linku" },
    { type: "excludes", from: "N1", to: "N5", why: "Když máš myčku vestavěnou ve skříňce, další mini na linku už nekoupíš; buď jedno, nebo druhé" },
    { type: "excludes", from: "N4", to: "N11", why: "Smysl větší myčky pro rodinu je mýt i hrnce, což je v rozporu s tím, že tam hrnce nepatří" },
    { type: "excludes", from: "N2", to: "N7", why: "Mytí po každém jídle znamená ručně nalévat vodu třikrát denně, a to se těžko dodržuje" },
    { type: "excludes", from: "N2", to: "N10", why: "Mytí po každém jídle často znamená méně než půl náplně, což odporuje pravidlu ne poloprázdná" },
    { type: "excludes", from: "N9", to: "N11", why: "Hrnce a talíře odolné myčce kupuješ právě proto, abys je tam dával, což odporuje pravidlu bez hrnců" },
    { type: "requires", from: "N1", to: "N8", why: "Chyba o 1 cm a myčka do skříňky nezajede, takže před objednávkou je potřeba všechno změřit" },
    { type: "requires", from: "N4", to: "N10", why: "Velká myčka puštěná poloprázdná spotřebuje vodu a proud jako plná, takže se drž pravidla ne poloprázdná" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Demontáž skříňky a práce na instalaci", v: "O jednu úložnou skříňku méně", t: "Čekání na řemeslníka na zaměření a montáž", l: "Pouštět až od poloviny náplně", x: "Vzdát se mini na linku" },
      fatal: "N10", thesis: "Změř skříňku, vestav velkou myčku a pouštěj ji až od poloviny náplně", title: "Velká vestavěná, jednou provždy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nové hrnce a nádobí plus voda a proud po každém jídle", v: "Během zkoušky zabírá průchod", t: "Skříňka jde ven až po 30 dnech", l: "Nádobí po rychlém programu schne samo", x: "Vzdát se mini na linku" },
      fatal: "N12", thesis: "Rychlé mytí po každém jídle; nech myčku u dřezu, dokud se neosvědčí, a pak ji vestav", title: "Denně rychle, zkouška před vestavbou",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Ruční nalévání vody při každém mytí", v: "Zabere slušný kus pracovní plochy", t: "Hrnce každý den ručně", l: "Nejvýš 8 sad nádobí", x: "Vzdát se vestavby i velké kapacity" },
      fatal: "N11", thesis: "Mini na linku, do které naléváš vodu sám; hrnce zůstávají na ruční mytí", title: "Mini na linku, bez rozvodů",
    },
  },
  recommend: { key: "alpha", why: "V domácnosti se 3 a více lidmi zvládne jedna velká myčka nádobí z celého dne na jedno mytí" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Nádobí celé rodiny visí na jediném stroji; když se porouchá, jedinou zálohou je ruční mytí", kill: "Zahoď, pokud oprava trvá déle než 7 dnů a rodina se vrátí k ručnímu mytí", label: "Jediný stroj" },
};
