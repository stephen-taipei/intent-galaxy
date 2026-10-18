// 擴充功能內建生活題示範星系（斯洛伐克文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Odkiaľ sladkosť", D2: "Kam s chuťou na sladké", D3: "Aká veľká zmena", D4: "Čo máš doma" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Opačný názor — ${dims[dim]}: druhý pól`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_SK = {
  schema_version: "1.0",
  core: {
    decision: "Nahradiť všetko sladké celým ovocím, alebo ďalej jesť, čo máš rád, len menej?",
    metric: "Počas 30 dní najviac 3 sladké maškrty a nápoje spolu za týždeň (zapisované v telefóne na kontrolu)",
  },
  quadrants: {
    Q1: { scar: "Zjedol celé vrecko sušeného ovocia v domnení, že je to zdravá desiata", sacred: "Sladkosť iba z celého ovocia" },
    Q2: { scar: "Trikrát sa vzdal cukru a zakaždým povolil v druhom týždni", sacred: "Platí iba to, čo sa dá vydržať" },
    Q3: { scar: "Skopíroval low-carb jedálniček a po troch dňoch ho mal plné zuby", sacred: "Zmeň metódu, nie chuť" },
    Q4: { scar: "Videl priveľa ľudí vzdať sa cukru a hneď sa k nemu vrátiť", sacred: "Pravidlá porazia vôľu" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Celé ovocie", "Kedykoľvek máš chuť na sladké, jedz iba celé čerstvé ovocie, napríklad kiwi, ananás, čučoriedky alebo pomaranče; džúsy, sušené a kandizované ovocie sa nerátajú", "Zlyhá, ak si do 14 dní viac ako 3 dni kúpiš dezert, aby si zahnal chuť", null),
    N2: node("D2", 0, 1, "Perlivá voda", "Keď príde chuť, vypi najprv pohár nesladenej perlivej vody s citrónom alebo marakujou; ak máš po 15 minútach stále chuť na sladké, nechaj si to na po ďalšom jedle. Menia sa iba nápoje: jedlá zostávajú rovnaké a náhradné maškrty nekupuješ", "Zlyhá, ak do 14 dní máš po 15-minútovom čakaní stále chuť na sladké vo viac ako polovici prípadov", "Nápoj nezaženie chuť niečo hrýzť"),
    N3: node("D1", 1, 0, "Len po jedle", "Sladkokyslé maškrty a ovocie jedz iba do 1 hodiny po jedle; nič nalačno a nič 3 hodiny pred spaním", "Zlyhá, ak po 14 dňoch stále viac ako 3 večery hľadáš maškrtu pred spaním", null),
    N4: node("D4", 0, 2, "Nula sladkostí", "Nakupuj raz týždenne: sezónne ovocie po debničkách a toľko bieleho jogurtu bez cukru, koľko na týždeň stačí; to sú jediné maškrty doma a sladkosti domov nikdy nenosíš", "Zlyhá, ak do 14 dní nastane týždeň, keď si vonku kúpiš sladkosti viac ako 3×", null),
    N5: node("D3", 2, 0, "Polovičné dávky", "Ďalej jedz sladkokyslé maškrty, ktoré máš rád, len menej: prejdi na malé balenia a dennú dávku zníž na polovicu, bez akýchkoľvek náhrad", "Zlyhá, ak od 2. týždňa viac ako 2 dni v týždni zješ viac ako polovicu pôvodného množstva", "Často otvoríš druhé balenie hneď po prvom"),
    N6: node("D3", 1, 2, "Testuj nápoje", "Každú novú príchuť nesladeného nápoja kúp v najmenšom balení a pi ju 3 dni po sebe; celé balenie kupuj, iba keď ti chutí, nikdy si nerob zásoby naraz", "Zlyhá, ak je príchuť kúpená po teste vo veľkom balení po 14 dňoch stále viac ako z polovice plná", null),
    N7: node("D3", 2, 1, "Vymeň omáčku", "Ako keď vymeníš obal na mobil namiesto mobilu: nechaj hlavné suroviny sladkokyslého kurčaťa alebo ryby, ale omáčku si urob sám z paradajok, ananásu a octu, s polovicou bežného cukru", "Zlyhá, ak po 2 pokusoch s novou omáčkou počas 14 dní všetci doma povedia, že nechutí", "V reštaurácii ani pri jedle so sebou omáčku nezmeníš",
      { lateral: { src: "Technika: výmena obalu na mobil", dist: 2, drop: "Úplne vyškrtnúť jedlo z jedálnička" } }),
    N8: node("D2", 1, 0, "Max 3 porcie", "Ako limit batožiny v lietadle: najviac 3 porcie ovocia a sladkokyslých maškŕt spolu denne, každá zhruba veľkosti päste; čo je navyše, počká do zajtra, namiesto spoliehania sa na okamžitú vôľu", "Zlyhá, ak viac ako 2 dni v týždni zješ cez 3 porcie", null,
      { lateral: { src: "Letecké spoločnosti: hmotnostný limit batožiny", dist: 3, drop: "Jesť kedykoľvek bez obmedzenia" } }),
    N9: node("D4", 2, 0, "Zásoba vody", "Dopĺňaj ako večierka, kým tovar dôjde: v chladničke maj vždy balenie nesladenej perlivej vody a sieťku citrónov a nové balenie kúp, keď zostávajú 3 plechovky, aby ťa chuť nikdy nevyhnala po limonádu či sladenú kávu so sebou", "Zlyhá, ak si do 14 dní stále kúpiš viac ako 3 sladené nápoje so sebou", null,
      { lateral: { src: "Maloobchod: doplniť skôr, ako sa vypredá", dist: 4, drop: "Kupovať nápoj, až keď máš chuť" } }),
    N10: node("D2", 2, 0, "Strop nákladov", "Ak náhradné maškrty ako ovocie a nesladený jogurt stoja viac ako dvojnásobok toho, čo si predtým týždenne minul na maškrty, do mesiaca to vzdáš a vrátiš sa k starým maškrtám", "Stop, ak do 14 dní náhrady stoja viac ako dvojnásobok pôvodného rozpočtu na maškrty", "Ceny ovocia sa počas sezóny dosť menia",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Náhrady sú na dlhodobé udržanie pridrahé" } }),
    N11: node("D4", 1, 0, "Žiadne akcie", "Keď kupuješ jedlo a nápoje po kartónoch kvôli doprave zdarma alebo množstevnej zľave, čím viac toho máš doma, tým viac toho každý deň zješ", "Stop, ak si do 14 dní viac ako raz kúpiš jedlo alebo nápoje po kartónoch alebo kvôli doprave zdarma", "Sladkosti darované rodinou a priateľmi neovplyvníš",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Zľavy ťa nútia kupovať čoraz viac" } }),
    N12: node("D3", 0, 1, "Bez vybavenia", "Ak začneš až po kúpe výrobníka sódy, sladidiel a všetkých možných náhrad, minuté peniaze ťa budú nútiť jesť veci, ktoré ti nechutia, a do 2 týždňov to vzdáš", "Stop, ak si do 14 dní kúpiš viac ako 1 vychytávku alebo náhradu, ktorú potom nepoužívaš", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Nútiš sa do toho, aby to nevyšlo nazmar" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Nemať sladkosti doma a zároveň ich jesť ako zvyčajne sa nedá" },
    { type: "excludes", from: "N1", to: "N5", why: "Keď má sladkosť pochádzať iba z celého ovocia, obľúbené sladkosti si nenecháš" },
    { type: "excludes", from: "N4", to: "N11", why: "Ovocie doma stojí na nákupe debničky každý týždeň; zákaz nákupov vo veľkom tento plán zásob rozbije" },
    { type: "excludes", from: "N2", to: "N7", why: "Táto cesta mení iba nápoje a jedlá necháva tak, čo odporuje prerábaniu sladkokyslej omáčky" },
    { type: "excludes", from: "N2", to: "N10", why: "Táto cesta mení iba nápoje a nekupuje náhradné maškrty; strop výdavkov na náhrady patrí k inej ceste, tak si vyber jednu" },
    { type: "excludes", from: "N9", to: "N11", why: "Stála zásoba perlivej vody znamená kupovať ju po kartónoch, čo sa priamo bije so zákazom nákupov vo veľkom" },
    { type: "requires", from: "N1", to: "N8", why: "Aj ovocie obsahuje cukor; aj keď je to tvoja jediná sladkosť, potrebuješ denný limit, inak prejedanie aj tak zaťaží telo" },
    { type: "requires", from: "N4", to: "N10", why: "Týždenné debničky ovocia a jogurtu sa nasčítajú, takže potrebuješ strop výdavkov, inak to ako prvá vzdá peňaženka" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Jeden pevný nákup týždenne", v: "Vzdať sa obľúbených maškŕt", t: "Prvé dva týždne chutí sú ťažké", l: "Najviac tri porcie ovocia denne", x: "Žiadne spontánne výpravy po dezert" },
      fatal: "N10", thesis: "Sladké iba z celého ovocia, v obmedzenom množstve, a sladkosti mimo domova", title: "Na ovocie · doma nič sladké",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Stála zásoba perlivej vody v chladničke", v: "15 minút čakania, kým podľahneš chuti", t: "Každý týždeň meníš len trochu", l: "Cukor v jedlách zostáva rovnaký", x: "Koniec s jedením starých maškŕt ako predtým" },
      fatal: "N12", thesis: "Pri chuti na sladké siahni po nesladenej perlivej vode a nové príchute skúšaj v malom, kým kúpiš viac", title: "Najprv nápoje · pomaly menej",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Zakaždým počítať porcie", v: "Sladkosti doma stále lákajú", t: "Výsledky prídu až po dlhom čase", l: "Obmedzovanie stojí iba na sebadisciplíne", x: "Vzdať sa úplného prechodu na ovocie" },
      fatal: "N11", thesis: "Ďalej jedz, čo máš rád, ale v malých baleniach, s limitom porcií a s prerobenou sladkokyslou omáčkou", title: "Obľúbené zostávajú · limit a nová omáčka",
    },
  },
  recommend: { key: "alpha", why: "Ovocie je prirodzene sladkokyslé a domov bez sladkostí si vyžaduje najmenej vôle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Celá tvoja chuť na sladkokyslé visí na jednom ovocí alebo nápoji", kill: "Keď sa tá jedna vec vypredá alebo sa ti prejie, celý plán sa rozpadne", label: "Jediná náhrada" },
};
