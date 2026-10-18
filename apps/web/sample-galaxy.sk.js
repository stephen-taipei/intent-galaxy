// 內建示範星系（IntentAnalysisResponse v1.0，斯洛伐克文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Ako je kód rozdelený do vrstiev", D2: "Čím sa motívy líšia", D3: "Ako hlboko ide prispôsobenie", D4: "Ako sú postavené nastavenia motívu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druhá strana: „${dims[dim]}“ presne opačne`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_SK = {
  schema_version: "1.0",
  core: {
    decision: "Má mať každá značka vlastnú kópiu komponentov, alebo majú všetky značky zdieľať jedno jadro a rozdiely prepínať v konfiguračných súboroch?",
    metric: "Do 60 dní: nový motív hotový najviac za 2 dni a CSS každého motívu pod 50KB",
  },
  quadrants: {
    Q1: { scar: "Zdieľané komponenty napchané podmienkami pre jednotlivé značky", sacred: "Žiadne podmienky na značku v jadre" },
    Q2: { scar: "Ručné opravy rozloženia pre vyše 100 motívov, jeden po druhom", sacred: "Nech chyby zachytí kontrola typov" },
    Q3: { scar: "Skopíroval cudzí design system a prehnal to s abstrakciou", sacred: "Diely, ktoré sa dajú vymeniť celé" },
    Q4: { scar: "Trikrát videl, ako sa prispôsobovanie vymklo spod kontroly", sacred: "Hranice vrstiev musia vydržať" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tri vrstvy", "Rozdeľ komponenty do troch vrstiev: jadro len s logikou, pohľad, ktorý všetko prepája, a tenká vrstva motívu pre vzhľad; jadro nesmie poznať názvy motívov ani cesty", "Zlyhá, ak sa do 14 dní v jadre objaví kód, ktorý kontroluje motív", null),
    N2: node("D2", 0, 1, "Len premenné", "Každý rozdiel medzi motívmi zapisuj ako premenné CSS (custom properties), bez akejkoľvek kontroly motívu v komponentoch a rozloženiach", "Zlyhá, ak už 3. motív vyžaduje zmeny komponentov", "Rozdiely v rozložení samotnými farbami nevyriešiš"),
    N3: node("D1", 1, 0, "Jeden motív", "Načítavaj len štýly aktuálneho motívu, namiesto toho, aby si všetky motívy pribalil do prvého načítania stránky", "Zlyhá, ak do 14 dní CSS ktoréhokoľvek motívu presiahne 50KB", null),
    N4: node("D4", 0, 2, "Typovaný config", "Každý motív má úplný konfiguračný objekt v TypeScripte; ak chýba jediné pole, build neprejde", "Zlyhá, ak nový motív stále znamená meniť zdieľané komponenty", null),
    N5: node("D3", 2, 0, "Kópia na značku", "Každý motív si skopíruje priečinok komponentov a upravuje ho sám, takže značky sa nikdy navzájom neovplyvnia", "Zlyhá, ak po 10. motíve oprava jednej chyby znamená zmeny na viac ako 10 miestach", "Jedna oprava znamená záplatovať každú kópiu"),
    N6: node("D3", 1, 2, "Najprv pre 5 %", "Každý nový motív zapni na týždeň len pre 5 % zákazníkov; pre všetkých až vtedy, keď počet chýb zostane v norme", "Zlyhá, ak chybovosť v tom týždni presiahne 1 %", null),
    N7: node("D3", 2, 1, "Nová karoséria", "Ako autá so spoločným podvozkom a rôznou karosériou: vymeníš celé rozloženie a zdieľaný pohľad aj jadro pod ním zostanú", "Zlyhá, ak výmena rozloženia znamená meniť jadro", "Ovládanie sa môže v rôznych rozloženiach správať inak",
      { lateral: { src: "Autá: spoločný podvozok", dist: 2, drop: "Nová forma pre každý model" } }),
    N8: node("D2", 1, 0, "Pevné miesta", "Ako kocky LEGO, ktoré držia len na výstupkoch: rozloženie má pevné miesta, motív do nich smie len vkladať komponenty a mimo nich sa nič nemení", "Zlyhá, ak sa DOM mimo týchto miest zmení čo i len raz", null,
      { lateral: { src: "Hračky: kocky LEGO", dist: 3, drop: "Ľubovoľné úpravy DOM" } }),
    N9: node("D4", 2, 0, "Len rozdiely", "Ako tučný a tenký rez toho istého písma: motív uvádza len to, čím sa líši od predvoleného, a všetko ostatné sa prevezme automaticky", "Zlyhá, ak dedenie siaha hlbšie ako 3 úrovne", null,
      { lateral: { src: "Typografia: rezy písma", dist: 4, drop: "Úplná kópia pre každý motív" } }),
    N10: node("D2", 2, 0, "Strop polí", "Ak každá požiadavka na úpravu pridá pole do konfigurácie, jej údržba bude skôr či neskôr drahšia ako obyčajná kópia", "Prestaň pridávať polia, keď má ktorékoľvek rozhranie konfigurácie viac ako 40", "Toľko nastavení, že im nikto nerozumie",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakcia nakoniec stojí viac ako skopírovaný kód" } }),
    N11: node("D4", 1, 0, "Žiadne výnimky", "Ak biznis môže žiadať podmienky pre značku priamo v zdieľaných komponentoch, rozdelenie do vrstiev sa do štvrť roka rozpadne", "Zahoď tento plán, ak sa do 14 dní do zdieľaných komponentov dostane čo i len 1 podmienka pre značku", "Obetovanie vrstiev kvôli termínu",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Za dodržaný termín chvália, za rozbité vrstvy nikto netrestá" } }),
    N12: node("D3", 0, 1, "Bez prepisu", "Ak treba previesť všetkých 70 modulov, kým sa čokoľvek dostane k používateľom, čím viac je už vložené, tým ťažšie sa prestáva, a prepis sa zvyčajne zasekne v polovici", "Stop, ak sa prvý modul nedostane k používateľom do 14 dní", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Prepísať všetko naraz rozbije harmonogram" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Jedna zdieľaná typovaná konfigurácia a samostatná kópia pre každú značku: vybrať sa dá len jedno" },
    { type: "excludes", from: "N1", to: "N5", why: "Zdieľané trojvrstvové jadro a kópia komponentov pre každú značku: vybrať sa dá len jedno" },
    { type: "excludes", from: "N4", to: "N11", why: "Typovaná konfigurácia blokuje skratky už pri zostavení, takže ručné stráženie vrstiev by kontrolovalo to isté dvakrát" },
    { type: "excludes", from: "N2", to: "N7", why: "Keď motívy menia len premenné CSS, nikto nevymieňa celé komponenty rozloženia" },
    { type: "excludes", from: "N2", to: "N10", why: "So samotnými premennými CSS nie sú žiadne polia konfigurácie, ktoré by mohli pribúdať; vyber jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Dedenie dovoľuje motívu niečo miestne prepísať, a to je v rozpore s poistkou „nikdy neobchádzaj vrstvy“" },
    { type: "requires", from: "N1", to: "N8", why: "Keď sú tri vrstvy, motívy musia upravovať vzhľad cez pevné miesta, inak sa vrstva pohľadu rozbije" },
    { type: "requires", from: "N4", to: "N10", why: "Typovaná konfigurácia potrebuje strop počtu polí, inak narastie tak, že jej nikto nebude rozumieť" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Veľa prepisovania na začiatku", v: "Žiadne rýchle kópie", t: "60 dní na postavenie štruktúry", l: "Treba napísať poriadne testy", x: "Žiadne skratky pre značky" },
      fatal: "N10", thesis: "Tri vrstvy komponentov a typovaný konfiguračný súbor pre každý motív, takže každý motív je len jedna konfigurácia", title: "Konfigurácia · 3 vrstvy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Menší výber rozložení", v: "Menej voľnosti v dizajne", t: "Každý týždeň malá zmena", l: "Zložité rozloženia neprichádzajú do úvahy", x: "Žiadne zmeny štruktúry stránky" },
      fatal: "N12", thesis: "Len premenné CSS a dedenie; nové motívy najprv pre pár používateľov, potom pre všetkých", title: "Len štýly · postupne",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Zdvojený kód", v: "Opravy na mnohých miestach", t: "Najrýchlejšie nasadenie", l: "Viac motívov, viac údržby", x: "Vzdať sa typovanej konfigurácie" },
      fatal: "N11", thesis: "Vymieňaj celé rozloženia a nechaj každú značku mať vlastnú kópiu karosérie", title: "Kópie značiek · spoločný podvozok",
    },
  },
  recommend: { key: "alpha", why: "Pri vyše 100 motívoch drží náklady na údržbu na uzde len prístup postavený na konfigurácii" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Každý motív dedí z toho istého predvoleného motívu", kill: "Rozbi predvolený motív a rozpadne sa rozloženie všetkých motívov", label: "Jeden základ" },
};
