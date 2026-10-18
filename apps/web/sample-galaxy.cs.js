// 內建示範星系（IntentAnalysisResponse v1.0，捷克文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Hranice vrstev", D2: "Způsob vyjádření rozdílů", D3: "Rozsah přizpůsobení", D4: "Skladba motivů" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Protipól — ${dims[dim]}: opačný extrém`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_CS = {
  schema_version: "1.0",
  core: {
    decision: "Má si každá značka forknout vlastní komponenty, nebo má jeden sdílený core řídit konfigurace?",
    metric: "Do 60 dnů: nový motiv nasazený za ≤2 dny a CSS každého motivu <50KB",
  },
  quadrants: {
    Q1: { scar: "Sdílené komponenty nacpané ify pro jednotlivé značky", sacred: "Nula větvení v core" },
    Q2: { scar: "Přes 100 motivů záplatovaných ručně jeden po druhém", sacred: "Typy chytí chyby" },
    Q3: { scar: "Okopírovaný design system, přeabstrahovaný", sacred: "Vyměnitelná struktura" },
    Q4: { scar: "Třikrát viděl, jak se přizpůsobování vymklo kontrole", sacred: "Hranice musí vydržet" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 vrstvy", "Rozděl komponenty na čistý core, koordinační view a list theme; core nesmí importovat ID motivů ani routy", "Chyba, pokud se do 14 dnů v core objeví podmínky na motiv", null),
    N2: node("D2", 0, 1, "CSS proměnné", "Každý rozdíl mezi motivy vyjadřuj jen přes CSS custom properties, bez jakéhokoli větvení v komponentách či layoutech", "Chyba, pokud už 3. motiv vyžaduje změny komponent", "Rozdíly v rozvržení se samotnými barvami vyjádřit nedají"),
    N3: node("D1", 1, 0, "CSS na vyžádání", "Za běhu načítej jen jeden stylesheet aktivního motivu, místo abys všechny motivy přibalil do prvního vykreslení", "Chyba, pokud do 14 dnů CSS kteréhokoli motivu přesáhne 50KB", null),
    N4: node("D4", 0, 2, "Typovaný config", "Každý motiv dodá kompletní konfigurační objekt v TypeScriptu; chybějící pole shodí build", "Chyba, pokud nový motiv stále vyžaduje změny ve sdílených komponentách", null),
    N5: node("D3", 2, 0, "Fork pro značku", "Každý motiv si zkopíruje adresář komponent a upravuje ho samostatně, takže se značky nikdy navzájem neovlivní", "Chyba, pokud po 10. motivu oprava jednoho bugu zasáhne >10 míst", "Jedna oprava bugu znamená záplatovat N kopií"),
    N6: node("D3", 1, 2, "Canary motivy", "Každý nový motiv pusť za feature flagem na týden 5 % tenantů; na 100 % až ve chvíli, kdy chybovost splní cíl", "Chyba, pokud chybovost v canary přesáhne 1 %", null),
    N7: node("D3", 2, 1, "Jiná karoserie", "[D2 podvozková platforma] Layouty jsou jako karoserie aut: vyměníš celou karoserii, zatímco sdílený podvozek (view a core) zůstává", "Chyba, pokud výměna layoutu vyžaduje změny v core", "Interakce se mezi layouty rozjíždějí",
      { lateral: { src: "Automobilový průmysl: sdílená platforma", dist: 2, drop: "Vývoj každého modelu od nuly" } }),
    N8: node("D2", 1, 0, "Pevné sloty", "[D3 kostky LEGO] Layouty deklarují pevné sloty; motivy smějí jen zapojovat komponenty do slotů a mimo ně strukturu měnit nesmějí", "Chyba, pokud se DOM mimo sloty změní byť jedinkrát", null,
      { lateral: { src: "Hračky: spojovací rozhraní LEGO", dist: 3, drop: "Volné úpravy DOM" } }),
    N9: node("D4", 2, 0, "Jen rozdíly", "[D4 rodina písma] Motivy deklarují jen svůj rozdíl oproti výchozímu; všechna ostatní pole se dědí automaticky", "Chyba, pokud dědičnost sahá hlouběji než 3 úrovně", null,
      { lateral: { src: "Typografie: řezy jedné rodiny písma", dist: 4, drop: "Úplná kopie pro každý motiv" } }),
    N10: node("D2", 2, 0, "Limit klíčů", "Pokud každý požadavek na přizpůsobení přidá pole do configu, údržba konfigurace nevyhnutelně vyjde dráž než prostý fork", "Přestaň přidávat pole, jakmile kterékoli rozhraní configu přesáhne 40 polí", "Konfigurační peklo",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakce stojí víc než duplikace" } }),
    N11: node("D4", 1, 0, "Bez obcházení", "Pokud byznys může vyžadovat podmínky na značku přímo ve sdílených komponentách, hranice padne do čtvrt roku", "Neplatí, pokud do 14 dnů přibude do sdílených komponent jakákoli podmínka na značku", "Hranice vyměněné za termíny",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Tlak termínů odměňuje porušování hranic" } }),
    N12: node("D3", 0, 1, "Zákaz přepisu", "Pokud se musí zmigrovat všech 70 modulů, než se cokoli nasadí, utopené náklady zastaví refaktoring v půlce", "Stop, pokud se první modul do 14 dnů nenasadí", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refaktoring drží termíny jako rukojmí" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Sdílený typovaný config a forky komponent pro každou značku jsou volba buď–anebo" },
    { type: "excludes", from: "N1", to: "N5", why: "Sdílený třívrstvý core a kopie komponent pro každou značku se navzájem vylučují" },
    { type: "excludes", from: "N4", to: "N11", why: "Typovaný config blokuje obcházení už při kompilaci, takže ruční kontrola hranic je zbytečná brána navíc" },
    { type: "excludes", from: "N2", to: "N7", why: "Pokud motivy mění jen CSS proměnné, žádné vyměňování celých layoutových komponent se nekoná" },
    { type: "excludes", from: "N2", to: "N10", why: "Čisté CSS proměnné nemají žádná pole configu, která by mohla bobtnat; vyber jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Řetězce dědičnosti umožňují lokální přepisy, což je v rozporu s mantinelem nula obcházení" },
    { type: "requires", from: "N1", to: "N8", why: "Po rozdělení do tří vrstev musí motivy přizpůsobovat přes pevné sloty, jinak se vrstva view prorazí" },
    { type: "requires", from: "N4", to: "N10", why: "Typovaný config potřebuje strop počtu polí, jinak nabobtná v konfigurační peklo" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Velký refaktoring na začátku", v: "Žádné rychlé forky", t: "60 dnů na postavení kostry", l: "Nutnost psát testy integrity", x: "Žádné zkratky pro konkrétní značku" },
      fatal: "N10", thesis: "Třívrstvé hranice a typovaný config zúží každý motiv na jediný list", title: "Config · 3 vrstvy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Omezená variabilita layoutu", v: "Méně designové svobody", t: "Malé kroky každý týden", l: "Složité layouty nepřipadají v úvahu", x: "Žádné úpravy struktury" },
      fatal: "N12", thesis: "Jen CSS proměnné a dědičnost, motivy se zavádějí postupně přes canary", title: "Čisté CSS · postupně",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicitní kód", v: "Opravy bugů na mnoha místech", t: "Nejrychlejší nasazení", l: "Náklady na údržbu rostou lineárně", x: "Vzdát se typovaného configu" },
      fatal: "N11", thesis: "Vyměňuj celé layouty a nech každou značku forknout si vlastní karoserii", title: "Forky značek · sdílený podvozek",
    },
  },
  recommend: { key: "alpha", why: "Při 100+ motivech udrží náklady na údržbu na uzdě jen řízení konfigurací" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Každý motiv dědí ze stejného výchozího motivu", kill: "Rozbij výchozí motiv a rozpadne se layout všech motivů", label: "SPOF: výchozí motiv" },
};
