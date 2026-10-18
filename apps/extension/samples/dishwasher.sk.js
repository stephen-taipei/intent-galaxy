// 擴充功能生活題示範星系（斯洛伐克文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Umiestnenie", D2: "Ako vyberať", D3: "Rozsah úprav", D4: "Kapacita a riad" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druhá strana — ${dims[dim]}: opačný extrém`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_SK = {
  schema_version: "1.0",
  core: {
    decision: "Prerobiť kuchyňu kvôli umývačke riadu, alebo vybrať takú, ktorá sa zmestí do kuchyne, ktorú už máte?",
    metric: "Prvých 30 dní: umývačka beží aspoň 5× týždenne a ručné umývanie riadu zaberie najviac 5 minút denne",
  },
  quadrants: {
    Q1: { scar: "Kúpil umývačku a aj tak umýva ručne", sacred: "Najprv spočítaj riad" },
    Q2: { scar: "Pri montáži zistil, že hadica je krátka", sacred: "Meraj, kým kúpiš" },
    Q3: { scar: "Kúpil podľa rebríčka z internetu a nezmestila sa", sacred: "Požičiavaj si nápady z iných odborov" },
    Q4: { scar: "Videl tri umývačky skončiť ako odkvapkávač na riad", sacred: "Najprv naplánuj zlyhanie" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Do skrinky", "Vyber 45 alebo 60 cm skrinku vedľa drezu a umývačku tam zabuduj, aby nezaberala linku a neprekážala v prechode", "Nesedí, ak je šírka, výška alebo hĺbka skrinky menšia ako uvádzané rozmery na zabudovanie", null),
    N2: node("D2", 0, 1, "Po každom jedle", "Vyber model s rýchlym programom pod 1 hodinu a púšťaj ho po každom jedle, aby špinavý riad nikdy nezostal v dreze cez noc", "Nesedí, ak je riad po rýchlom programe za 14 dní viac ako 2× mastný", "Rýchle programy väčšinou vynechávajú sušenie, takže riad schne sám"),
    N3: node("D1", 1, 0, "Vedľa drezu", "Postav umývačku do 1 metra od drezu a vypúšťaciu hadicu napoj rovno na sifón drezu, bez sekania do stien a nových rozvodov", "Nesedí, ak priložená vypúšťacia hadica k drezu nedosiahne a treba predĺženie", null),
    N4: node("D4", 0, 2, "Pre rodinu", "Pri 3 a viac ľuďoch v domácnosti ber model na 12+ súprav riadu, aby sa hrnce aj taniere zmestili do jedného umývania namiesto dvoch", "Nesedí, ak sa viac ako 2 dni zo 14 riad s hrncami nezmestí do jedného umývania", null),
    N5: node("D3", 2, 0, "Mini na linku", "Kúp malú umývačku na linku pre najviac 8 súprav: žiadne vyberanie skriniek, žiadne úpravy rozvodov a pri sťahovaní ju vezmeš so sebou", "Nesedí, ak viac ako 3 dni zo 14 treba 2 umývania, aby bolo všetko čisté", "Zaberie poriadny kus pracovnej plochy"),
    N6: node("D3", 1, 2, "Najprv skúška", "Kúp model, ktorý môže stáť voľne aj zabudovaný, nechaj ho celých 30 dní pri dreze a až potom rozhodni o vybratí skrinky, namiesto toho, aby si ju vytrhol hneď prvý deň", "Nesedí, ak umývačka počas 30-dňovej skúšky blokuje prechod alebo zásuvku", null),
    N7: node("D3", 2, 1, "Vlastná nádrž", "Ako obytné auto s vlastnou nádržou na vodu: vyber umývačku na linku, do ktorej vodu lievaš ručne, bez napojenia na batériu a bez úprav rozvodov", "Nesedí, ak ju v ktoromkoľvek týždni 2× a viackrát vynecháš a umyješ to ručne, lebo sa ti nechcelo liať vodu", "Lievanie vody je otravnejšie, než sa zdá",
      { lateral: { src: "Kempovanie: zabudovaná nádrž na vodu", dist: 2, drop: "Pevné napojenie na batériu" } }),
    N8: node("D2", 1, 0, "Najprv odmeraj", "Ako predletový checklist pilota: pred objednávkou odmeraj šírku, hĺbku a výšku, potom skontroluj zásuvku a odpad; ak chýba ktorákoľvek z 5 položiek, neobjednávaj", "Nesedí, ak niečo nesúhlasí alebo ju po doručení nejde nainštalovať", null,
      { lateral: { src: "Letectvo: predletový checklist", dist: 3, drop: "Objednávanie od oka" } }),
    N9: node("D4", 2, 0, "Odolný riad", "Ako reštaurácia, ktorá používa iba riad odolný v umývačke: vymeň každý hrniec a tanier s označením „neumývať v umývačke“, aby nič nezostalo na ručné umývanie", "Nesedí, ak ešte 14 dní po výmene umývaš ručne viac ako 3 kusy denne", null,
      { lateral: { src: "Gastro: profesionálny riad", dist: 4, drop: "Doma zmes starého riadu" } }),
    N10: node("D2", 2, 0, "Nie poloprázdna", "Keď umývačku pustíš menej ako do polovice plnú, spotrebuje skoro toľko vody a elektriny ako plná, takže umytie jedného kusu vyjde viac ako dvakrát drahšie", "Pred objednávkou si 7 dní zapisuj riad; ak vychádza priemerne menej ako 6 súprav denne, prejdi na mini", "Kým sa naplní celá umývačka, riad začne zapáchať",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Veľká umývačka pustená poloprázdna sa neoplatí" } }),
    N11: node("D4", 1, 0, "Bez hrncov", "Keď tam z pohodlnosti napcháš woky a veľké hrnce, mini riad na jedno umývanie nepoberie a zase skončíš pri dreze", "Zahoď, ak hrnce za 14 dní viac ako 2× vynútia druhé umývanie", "Nie každý doma bude pravidlo dodržiavať",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Preplňovanie umývačky z pohodlnosti" } }),
    N12: node("D3", 0, 1, "Bez prestavby", "Ak sa z inštalácie umývačky vykľuje prestavba celej kuchyne, len čo práce začnú a peniaze sú vonku, už musíš ísť až do konca", "Nezačínaj, ak je cenová ponuka pred vybratím skrinky viac ako 2× drahšia než umývačka", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Keď sa raz začne, niet cesty späť" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Umývačka na 12+ súprav sa na linku nezmestí, takže buď ona, alebo mini na linku" },
    { type: "excludes", from: "N1", to: "N5", why: "Keď máš umývačku zabudovanú v skrinke, ďalšiu mini na linku už nekúpiš; buď jedno, alebo druhé" },
    { type: "excludes", from: "N4", to: "N11", why: "Zmysel väčšej umývačky pre rodinu je umývať aj hrnce, čo je v rozpore s tým, že hrnce tam nepatria" },
    { type: "excludes", from: "N2", to: "N7", why: "Umývanie po každom jedle znamená ručne liať vodu trikrát denne, a to sa ťažko dodržiava" },
    { type: "excludes", from: "N2", to: "N10", why: "Umývanie po každom jedle často znamená menej ako pol náplne, čo odporuje pravidlu nie poloprázdna" },
    { type: "excludes", from: "N9", to: "N11", why: "Hrnce a taniere odolné v umývačke kupuješ práve preto, aby si ich tam dával, čo odporuje pravidlu bez hrncov" },
    { type: "requires", from: "N1", to: "N8", why: "Chyba o 1 cm a umývačka do skrinky nezajde, takže pred objednávkou treba všetko odmerať" },
    { type: "requires", from: "N4", to: "N10", why: "Veľká umývačka pustená poloprázdna spotrebuje vodu a elektrinu ako plná, takže sa drž pravidla nie poloprázdna" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Demontáž skrinky a práca na inštalácii", v: "O jednu úložnú skrinku menej", t: "Čakanie na remeselníka na zameranie a montáž", l: "Púšťať až od polovice náplne", x: "Vzdať sa mini na linku" },
      fatal: "N10", thesis: "Odmeraj skrinku, zabuduj veľkú umývačku a púšťaj ju až od polovice náplne", title: "Veľká zabudovaná, raz a dobre",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nové hrnce a riad plus voda a elektrina po každom jedle", v: "Počas skúšky zaberá prechod", t: "Skrinka ide von až po 30 dňoch", l: "Riad po rýchlom programe schne sám", x: "Vzdať sa mini na linku" },
      fatal: "N12", thesis: "Rýchle umývanie po každom jedle; nechaj umývačku pri dreze, kým sa neosvedčí, a potom ju zabuduj", title: "Denne rýchlo, skúška pred zabudovaním",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Ručné lievanie vody pri každom umývaní", v: "Zaberie poriadny kus pracovnej plochy", t: "Hrnce každý deň ručne", l: "Najviac 8 súprav riadu", x: "Vzdať sa zabudovania aj veľkej kapacity" },
      fatal: "N11", thesis: "Mini na linku, do ktorej lievaš vodu sám; hrnce zostávajú na ručné umývanie", title: "Mini na linku, bez rozvodov",
    },
  },
  recommend: { key: "alpha", why: "V domácnosti s 3 a viac ľuďmi zvládne jedna veľká umývačka riad z celého dňa na jedno umývanie" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Riad celej rodiny visí na jedinom stroji; keď sa pokazí, jedinou zálohou je ručné umývanie", kill: "Zahoď, ak oprava trvá dlhšie ako 7 dní a rodina sa vráti k ručnému umývaniu", label: "Jediný stroj" },
};
