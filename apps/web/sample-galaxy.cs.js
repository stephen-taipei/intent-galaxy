// 內建示範星系（IntentAnalysisResponse v1.0，捷克文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Jak je kód rozdělený do vrstev", D2: "Čím se motivy liší", D3: "Jak hluboko jde přizpůsobení", D4: "Jak jsou postavená nastavení motivu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druhá strana: „${dims[dim]}“ přesně opačně`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_CS = {
  schema_version: "1.0",
  core: {
    decision: "Má mít každá značka vlastní kopii komponent, nebo mají všechny značky sdílet jedno jádro a rozdíly přepínat v konfiguračních souborech?",
    metric: "Do 60 dnů: nový motiv hotový nejvýš za 2 dny a CSS každého motivu pod 50KB",
  },
  quadrants: {
    Q1: { scar: "Sdílené komponenty nacpané podmínkami pro jednotlivé značky", sacred: "Žádné podmínky na značku v jádru" },
    Q2: { scar: "Ruční opravy rozvržení pro přes 100 motivů, jeden po druhém", sacred: "Ať chyby chytí kontrola typů" },
    Q3: { scar: "Okopíroval cizí design system a přehnal to s abstrakcí", sacred: "Díly, které jde vyměnit celé" },
    Q4: { scar: "Třikrát viděl, jak se přizpůsobování vymklo kontrole", sacred: "Hranice vrstev musí vydržet" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tři vrstvy", "Rozděl komponenty do tří vrstev: jádro jen s logikou, pohled, který vše propojuje, a tenká vrstva motivu pro vzhled; jádro nesmí znát názvy motivů ani cesty", "Selže, pokud se do 14 dnů v jádru objeví kód, který kontroluje motiv", null),
    N2: node("D2", 0, 1, "Jen proměnné", "Každý rozdíl mezi motivy zapisuj jako proměnné CSS (custom properties), bez jakékoli kontroly motivu v komponentách a rozvrženích", "Selže, pokud už 3. motiv vyžaduje změny komponent", "Rozdíly v rozvržení samotnými barvami nevyřešíš"),
    N3: node("D1", 1, 0, "Jeden motiv", "Načítej jen styly aktuálního motivu, místo abys všechny motivy přibalil do prvního načtení stránky", "Selže, pokud do 14 dnů CSS kteréhokoli motivu přesáhne 50KB", null),
    N4: node("D4", 0, 2, "Typovaný config", "Každý motiv má úplný konfigurační objekt v TypeScriptu; chybí-li jediné pole, build neprojde", "Selže, pokud nový motiv stále znamená měnit sdílené komponenty", null),
    N5: node("D3", 2, 0, "Kopie na značku", "Každý motiv si zkopíruje složku komponent a upravuje ji sám, takže se značky nikdy navzájem neovlivní", "Selže, pokud po 10. motivu oprava jedné chyby znamená změny na víc než 10 místech", "Jedna oprava znamená záplatovat každou kopii"),
    N6: node("D3", 1, 2, "Nejdřív pro 5 %", "Každý nový motiv zapni na týden jen pro 5 % zákazníků; pro všechny až tehdy, když počet chyb zůstane v normě", "Selže, pokud chybovost v tom týdnu přesáhne 1 %", null),
    N7: node("D3", 2, 1, "Nová karoserie", "Jako auta se společným podvozkem a různou karoserií: vyměníš celé rozvržení a sdílený pohled i jádro pod ním zůstanou", "Selže, pokud výměna rozvržení znamená měnit jádro", "Ovládání se může v různých rozvrženích chovat jinak",
      { lateral: { src: "Auta: společný podvozek", dist: 2, drop: "Nová forma pro každý model" } }),
    N8: node("D2", 1, 0, "Pevná místa", "Jako kostky LEGO, které drží jen na výstupcích: rozvržení má pevná místa, motiv do nich smí jen vkládat komponenty a mimo ně se nic nemění", "Selže, pokud se DOM mimo tato místa změní byť jedinkrát", null,
      { lateral: { src: "Hračky: kostky LEGO", dist: 3, drop: "Libovolné úpravy DOM" } }),
    N9: node("D4", 2, 0, "Jen rozdíly", "Jako tučný a tenký řez téhož písma: motiv uvádí jen to, čím se liší od výchozího, a vše ostatní se převezme automaticky", "Selže, pokud dědění sahá hlouběji než 3 úrovně", null,
      { lateral: { src: "Typografie: řezy písma", dist: 4, drop: "Úplná kopie pro každý motiv" } }),
    N10: node("D2", 2, 0, "Strop polí", "Pokud každý požadavek na úpravu přidá pole do konfigurace, její údržba bude dřív nebo později dražší než obyčejná kopie", "Přestaň přidávat pole, jakmile má kterékoli rozhraní konfigurace víc než 40", "Tolik nastavení, že jim nikdo nerozumí",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakce nakonec stojí víc než zkopírovaný kód" } }),
    N11: node("D4", 1, 0, "Žádné výjimky", "Pokud byznys může žádat podmínky pro značku přímo ve sdílených komponentách, rozdělení do vrstev se do čtvrt roku rozpadne", "Zahoď tento plán, pokud se do 14 dnů do sdílených komponent dostane byť 1 podmínka pro značku", "Obětování vrstev kvůli termínu",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Za dodržený termín chválí, za rozbité vrstvy nikdo netrestá" } }),
    N12: node("D3", 0, 1, "Bez přepisu", "Pokud se musí převést všech 70 modulů, než se cokoli dostane k uživatelům, čím víc už je vloženo, tím hůř se přestává, a přepis se obvykle zasekne v půlce", "Stop, pokud se první modul nedostane k uživatelům do 14 dnů", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Přepsat všechno najednou rozbije harmonogram" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Jedna sdílená typovaná konfigurace a samostatná kopie pro každou značku: vybrat jde jen jedno" },
    { type: "excludes", from: "N1", to: "N5", why: "Sdílené třívrstvé jádro a kopie komponent pro každou značku: vybrat jde jen jedno" },
    { type: "excludes", from: "N4", to: "N11", why: "Typovaná konfigurace blokuje zkratky už při sestavení, takže ruční hlídání vrstev by kontrolovalo totéž dvakrát" },
    { type: "excludes", from: "N2", to: "N7", why: "Když motivy mění jen proměnné CSS, nikdo nevyměňuje celé komponenty rozvržení" },
    { type: "excludes", from: "N2", to: "N10", why: "Se samotnými proměnnými CSS nejsou žádná pole konfigurace, která by mohla přibývat; vyber jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Dědění dovoluje motivu něco místně přepsat, a to je v rozporu s pojistkou „nikdy neobcházej vrstvy“" },
    { type: "requires", from: "N1", to: "N8", why: "Jakmile jsou tři vrstvy, motivy musí upravovat vzhled přes pevná místa, jinak se vrstva pohledu rozbije" },
    { type: "requires", from: "N4", to: "N10", why: "Typovaná konfigurace potřebuje strop počtu polí, jinak naroste tak, že jí nikdo nebude rozumět" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Hodně přepisování na začátku", v: "Žádné rychlé kopie", t: "60 dnů na postavení struktury", l: "Je třeba napsat pořádné testy", x: "Žádné zkratky pro značky" },
      fatal: "N10", thesis: "Tři vrstvy komponent a typovaný konfigurační soubor pro každý motiv, takže každý motiv je jen jedna konfigurace", title: "Konfigurace · 3 vrstvy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Menší výběr rozvržení", v: "Méně volnosti v designu", t: "Každý týden malá změna", l: "Složitá rozvržení nepřipadají v úvahu", x: "Žádné změny struktury stránky" },
      fatal: "N12", thesis: "Jen proměnné CSS a dědění; nové motivy nejdřív pro pár uživatelů, pak pro všechny", title: "Jen styly · postupně",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Zdvojený kód", v: "Opravy na mnoha místech", t: "Nejrychlejší nasazení", l: "Víc motivů, víc údržby", x: "Vzdát se typované konfigurace" },
      fatal: "N11", thesis: "Vyměňuj celá rozvržení a nech každou značku mít vlastní kopii karoserie", title: "Kopie značek · společný podvozek",
    },
  },
  recommend: { key: "alpha", why: "Při více než 100 motivech drží náklady na údržbu na uzdě jen přístup postavený na konfiguraci" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Každý motiv dědí ze stejného výchozího motivu", kill: "Rozbij výchozí motiv a rozpadne se rozvržení všech motivů", label: "Vše na jednom" },
};
