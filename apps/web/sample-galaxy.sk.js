// 內建示範星系（IntentAnalysisResponse v1.0，斯洛伐克文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Hranice vrstiev", D2: "Spôsob vyjadrenia rozdielov", D3: "Rozsah prispôsobenia", D4: "Skladba motívov" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Protipól — ${dims[dim]}: opačný extrém`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_SK = {
  schema_version: "1.0",
  core: {
    decision: "Má si každá značka forknúť vlastné komponenty, alebo má jeden zdieľaný core riadiť konfigurácia?",
    metric: "Do 60 dní: nový motív nasadený za ≤2 dni a CSS každého motívu <50KB",
  },
  quadrants: {
    Q1: { scar: "Zdieľané komponenty napchané ifmi pre jednotlivé značky", sacred: "Nula vetvení v core" },
    Q2: { scar: "Vyše 100 motívov záplatovaných ručne jeden po druhom", sacred: "Typy zachytia chyby" },
    Q3: { scar: "Skopírovaný design system, preabstrahovaný", sacred: "Vymeniteľná štruktúra" },
    Q4: { scar: "Trikrát videl, ako sa prispôsobovanie vymklo spod kontroly", sacred: "Hranice musia vydržať" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 vrstvy", "Rozdeľ komponenty na čistý core, koordinačný view a list theme; core nesmie importovať ID motívov ani routy", "Chyba, ak sa do 14 dní v core objavia podmienky na motív", null),
    N2: node("D2", 0, 1, "CSS premenné", "Každý rozdiel medzi motívmi vyjadruj iba cez CSS custom properties, bez akéhokoľvek vetvenia v komponentoch či layoutoch", "Chyba, ak už 3. motív vyžaduje zmeny komponentov", "Rozdiely v rozložení sa samotnými farbami vyjadriť nedajú"),
    N3: node("D1", 1, 0, "CSS na žiadosť", "Počas behu načítaj iba jeden stylesheet aktívneho motívu namiesto pribalenia všetkých motívov do prvého vykreslenia", "Chyba, ak do 14 dní CSS ktoréhokoľvek motívu presiahne 50KB", null),
    N4: node("D4", 0, 2, "Typovaný config", "Každý motív dodá kompletný konfiguračný objekt v TypeScripte; chýbajúce pole zhodí build", "Chyba, ak nový motív stále vyžaduje zmeny v zdieľaných komponentoch", null),
    N5: node("D3", 2, 0, "Fork pre značku", "Každý motív si skopíruje adresár komponentov a upravuje ho samostatne, takže značky sa nikdy navzájom neovplyvnia", "Chyba, ak po 10. motíve oprava jedného bugu zasiahne >10 miest", "Jedna oprava bugu znamená záplatovať N kópií"),
    N6: node("D3", 1, 2, "Canary motívy", "Každý nový motív pusti za feature flagom na týždeň 5 % tenantov; na 100 % až vtedy, keď chybovosť splní cieľ", "Chyba, ak chybovosť v canary presiahne 1 %", null),
    N7: node("D3", 2, 1, "Iná karoséria", "[D2 podvozková platforma] Layouty sú ako karosérie áut: vymeníš celú karosériu, zatiaľ čo zdieľaný podvozok (view a core) zostáva", "Chyba, ak výmena layoutu vyžaduje zmeny v core", "Interakcie sa medzi layoutmi rozchádzajú",
      { lateral: { src: "Automobilový priemysel: zdieľaná platforma", dist: 2, drop: "Vývoj každého modelu od nuly" } }),
    N8: node("D2", 1, 0, "Pevné sloty", "[D3 kocky LEGO] Layouty deklarujú pevné sloty; motívy smú iba zapájať komponenty do slotov a mimo nich štruktúru meniť nesmú", "Chyba, ak sa DOM mimo slotov zmení čo i len raz", null,
      { lateral: { src: "Hračky: spojovacie rozhranie LEGO", dist: 3, drop: "Voľné úpravy DOM" } }),
    N9: node("D4", 2, 0, "Len rozdiely", "[D4 rodina písma] Motívy deklarujú iba svoj rozdiel oproti predvolenému; všetky ostatné polia sa dedia automaticky", "Chyba, ak dedičnosť siaha hlbšie ako 3 úrovne", null,
      { lateral: { src: "Typografia: rezy jednej rodiny písma", dist: 4, drop: "Úplná kópia pre každý motív" } }),
    N10: node("D2", 2, 0, "Limit kľúčov", "Ak každá požiadavka na prispôsobenie pridá pole do configu, údržba konfigurácie nevyhnutne vyjde drahšie ako obyčajný fork", "Prestaň pridávať polia, keď ktorékoľvek rozhranie configu presiahne 40 polí", "Konfiguračné peklo",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakcia stojí viac ako duplikácia" } }),
    N11: node("D4", 1, 0, "Bez obchádzania", "Ak biznis môže žiadať podmienky na značku priamo v zdieľaných komponentoch, hranica padne do štvrťroka", "Neplatí, ak do 14 dní pribudne do zdieľaných komponentov akákoľvek podmienka na značku", "Hranice vymenené za termíny",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Tlak termínov odmeňuje porušovanie hraníc" } }),
    N12: node("D3", 0, 1, "Zákaz prepisu", "Ak sa musí zmigrovať všetkých 70 modulov, kým sa čokoľvek nasadí, utopené náklady zastavia refaktoring v polovici", "Stop, ak sa prvý modul do 14 dní nenasadí", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refaktoring drží termíny ako rukojemníkov" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Zdieľaný typovaný config a forky komponentov pre každú značku sú voľba buď–alebo" },
    { type: "excludes", from: "N1", to: "N5", why: "Zdieľaný trojvrstvový core a kópie komponentov pre každú značku sa navzájom vylučujú" },
    { type: "excludes", from: "N4", to: "N11", why: "Typovaný config blokuje obchádzanie už pri kompilácii, takže ručná kontrola hraníc je zbytočná brána navyše" },
    { type: "excludes", from: "N2", to: "N7", why: "Ak motívy menia iba CSS premenné, žiadne vymieňanie celých layoutových komponentov sa nekoná" },
    { type: "excludes", from: "N2", to: "N10", why: "Čisté CSS premenné nemajú žiadne polia configu, ktoré by mohli napučať; vyber jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Reťazce dedičnosti umožňujú lokálne prepisy, čo je v rozpore s mantinelom nula obchádzania" },
    { type: "requires", from: "N1", to: "N8", why: "Po rozdelení do troch vrstiev musia motívy prispôsobovať cez pevné sloty, inak sa vrstva view prerazí" },
    { type: "requires", from: "N4", to: "N10", why: "Typovaný config potrebuje strop počtu polí, inak napučí do konfiguračného pekla" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Veľký refaktoring na začiatku", v: "Žiadne rýchle forky", t: "60 dní na postavenie kostry", l: "Treba písať testy integrity", x: "Žiadne skratky pre konkrétnu značku" },
      fatal: "N10", thesis: "Trojvrstvové hranice a typovaný config zúžia každý motív na jediný list", title: "Config · 3 vrstvy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Obmedzená variabilita layoutu", v: "Menej dizajnovej slobody", t: "Malé kroky každý týždeň", l: "Zložité layouty neprichádzajú do úvahy", x: "Žiadne úpravy štruktúry" },
      fatal: "N12", thesis: "Iba CSS premenné a dedičnosť, motívy sa zavádzajú postupne cez canary", title: "Čisté CSS · postupne",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicitný kód", v: "Opravy bugov na mnohých miestach", t: "Najrýchlejšie nasadenie", l: "Náklady na údržbu rastú lineárne", x: "Vzdať sa typovaného configu" },
      fatal: "N11", thesis: "Vymieňaj celé layouty a nechaj každú značku forknúť si vlastnú karosériu", title: "Forky značiek · zdieľaný podvozok",
    },
  },
  recommend: { key: "alpha", why: "Pri 100+ motívoch udrží náklady na údržbu na uzde iba riadenie konfiguráciou" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Každý motív dedí z toho istého predvoleného motívu", kill: "Pokaz predvolený motív a rozpadne sa layout všetkých motívov", label: "SPOF: predvolený motív" },
};
