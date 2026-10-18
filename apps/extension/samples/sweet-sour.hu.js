// 擴充功能內建生活題示範星系（匈牙利文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Honnan jön az édes", D2: "Hová vezesd a sóvárgást", D3: "Mekkora változás", D4: "Mi van otthon" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Az ellentétes nézet a(z) „${dims[dim]}” kérdésben a másik végletig megy`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_HU = {
  schema_version: "1.0",
  core: {
    decision: "Minden édességet egész gyümölcsre cserélj, vagy továbbra is edd, amit szeretsz, csak kevesebbet?",
    metric: "30 napon át hetente összesen legfeljebb 3 cukros nasi és ital (telefonon vezetve, ellenőrizhetően)",
  },
  quadrants: {
    Q1: { scar: "Megevett egy egész zacskó aszalt gyümölcsöt, mert egészséges nasinak hitte", sacred: "Az édesség csak egész gyümölcsből jöhet" },
    Q2: { scar: "Háromszor hagyta abba a cukrot, és mindig a második héten tört meg", sacred: "Csak az számít, amit tényleg tartani tudsz" },
    Q3: { scar: "Lemásolt egy szénhidrátszegény étrendet, és három nap alatt megunta", sacred: "A módszert cseréld, ne az ízt" },
    Q4: { scar: "Túl sok embert láttam leszokni a cukorról, aztán rögtön visszacsúszni", sacred: "Szabályokra támaszkodj, ne az akaraterőre" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Csak gyümölcs", "Ha valami édesre vágysz, csak egész friss gyümölcsöt egyél, például kivit, ananászt, bogyós gyümölcsöt vagy narancsot; a gyümölcslé, az aszalt és a kandírozott gyümölcs nem számít", "Elbukik, ha 14 napon belül több mint 3 napon veszel desszertet a sóvárgás ellen", null),
    N2: node("D2", 0, 1, "Előbb szóda", "Ha rád tör a sóvárgás, előbb igyál meg egy pohár cukormentes szódát citrommal vagy maracujával; ha 15 perc múlva is kell valami édes, tedd el a következő étkezés utánra. Csak az italok változnak: az étkezések maradnak, és pótlék-nasit sem veszel", "Elbukik, ha 14 napon belül az esetek több mint felében a 15 perces várakozás után is édesre vágysz", "Egy ital nem csillapítja a rágcsálási kényszert"),
    N3: node("D1", 1, 0, "Csak evés után", "Édes-savanyú nasit és gyümölcsöt csak étkezés után 1 órán belül egyél; semmit éhgyomorra és semmit lefekvés előtt 3 órán belül", "Elbukik, ha 14 nap után is több mint 3 este nasi után kutatsz lefekvés előtt", null),
    N4: node("D4", 0, 2, "Nasitilalom", "Hetente egyszer vásárolj: rekeszszám idénygyümölcsöt és egy hétre elég natúr, cukrozatlan joghurtot; csak ezek a nasik vannak otthon, cukros nasi soha nem jön be a lakásba", "Elbukik, ha 14 napon belül még mindig van olyan hét, amikor 3-nál többször veszel édességet otthonon kívül", null),
    N5: node("D3", 2, 0, "Fél adag", "Edd továbbra is a kedvenc édes-savanyú nasidat, csak kevesebbet: válts egyadagos kiszerelésre, és felezd meg a napi mennyiséget, pótlék nélkül", "Elbukik, ha a 2. héttől hetente több mint 2 napon a régi mennyiség felénél többet eszel", "Gyakran rögtön nyitod a második csomagot"),
    N6: node("D3", 1, 2, "Ízek tesztelése", "Minden új cukormentes italízből a legkisebb kiszerelést vedd, és idd 3 napig egymás után; csak akkor vegyél belőle egész tálcát, ha ízlik, sosem halmozz be egyszerre", "Elbukik, ha egy teszt után tálcaszám vett íz 14 nap múlva is több mint félig megvan", null),
    N7: node("D3", 2, 1, "Új szósz", "Mint amikor a telefontokot cseréled, nem a telefont: maradjon az édes-savanyú sertés vagy hal alapja, de a szószt magad készítsd paradicsomból, ananászból és ecetből, fele annyi cukorral", "Elbukik, ha 14 napon belül 2 próbálkozás után mindenki azt mondja otthon, hogy nem jó", "Étteremben és rendelt kajánál nem cserélheted a szószt",
      { lateral: { src: "Tech: telefontok csere", dist: 2, drop: "Az étel teljes kihúzása az étlapról" } }),
    N8: node("D2", 1, 0, "Max. 3 adag", "Mint a légitársaságok poggyászlimitje: naponta összesen legfeljebb 3 adag gyümölcs és édes-savanyú nasi, mindegyik nagyjából ökölnyi; ami ezen felül van, holnapra vár, nem a pillanatnyi akaraterőn múlik", "Elbukik, ha hetente több mint 2 napon 3 adagnál többet eszel", null,
      { lateral: { src: "Légitársaságok: poggyász-súlyhatár", dist: 3, drop: "Bármikor, korlát nélkül enni" } }),
    N9: node("D4", 2, 0, "Szódakészlet", "Töltsd fel a készletet, mint a sarki bolt, mielőtt kifogy: a hűtőben mindig legyen egy tálca cukormentes szóda és egy zacskó citrom, és vegyél új tálcát, amikor 3 doboz maradt, hogy a sóvárgás ne küldjön el egy cukros üdítőért vagy jegeskávéért", "Elbukik, ha 14 napon belül még mindig több mint 3 cukros elviteles italt veszel", null,
      { lateral: { src: "Kiskereskedelem: feltöltés kifogyás előtt", dist: 4, drop: "Italt csak akkor venni, amikor kell" } }),
    N10: node("D2", 2, 0, "Pótlék-plafon", "Ha a pótlékok, mint a gyümölcs és a cukrozatlan joghurt, több mint kétszer annyiba kerülnek, mint amennyit eddig hetente nasira költöttél, egy hónapon belül feladod és visszatérsz a nasihoz", "Állj le, ha 14 napon belül a pótlékok többe kerülnek, mint a régi nasibüdzsé kétszerese", "A gyümölcsárak évszakonként nagyon ingadoznak",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "A pótlék túl drága ahhoz, hogy kitarts" } }),
    N11: node("D4", 1, 0, "Nincs nagyker", "Ha ételt és italt tálcaszám veszel az ingyenes szállításért vagy mennyiségi kedvezményért, minél több van otthon, annál többet eszel minden nap", "Állj le, ha 14 napon belül több mint egyszer veszel ételt vagy italt tálcaszám vagy az ingyenes szállítási határ miatt", "A barátoktól és rokonoktól kapott édességet nem tudod kontrollálni",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Az akciók egyre több vásárlásra visznek" } }),
    N12: node("D3", 0, 1, "Nincs kütyü", "Ha megvárod, míg megveszed a szódagépet, az édesítőket és mindenféle pótlékot, mielőtt belekezdenél, az elköltött pénz rávesz, hogy azt is megedd, ami nem ízlik, és 2 héten belül feladod", "Állj le, ha 14 napon belül több mint 1 olyan kütyüt vagy pótlékot veszel, amit nem használsz", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Erőből megeszed, hogy ne vesszen kárba" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Cukros nasit nem tartani otthon és közben a szokásos cukros nasit enni nem megy egyszerre" },
    { type: "excludes", from: "N1", to: "N5", why: "Ha az édesség csak egész gyümölcsből jöhet, nem tarthatod meg a kedvenc cukros nasijaidat" },
    { type: "excludes", from: "N4", to: "N11", why: "Az otthoni gyümölcs a heti rekeszen múlik; tiltsd meg a tálcaszám vásárlást, és a készletterv összeomlik" },
    { type: "excludes", from: "N2", to: "N7", why: "Ez az út csak az italokon változtat és az étkezéseket békén hagyja, ami ellentmond az édes-savanyú szósz átdolgozásának" },
    { type: "excludes", from: "N2", to: "N10", why: "Ez az út csak az italokon változtat és nem vesz pótlék-nasit, így a pótlékok költségplafonjának itt nincs értelme; válassz egyet" },
    { type: "excludes", from: "N9", to: "N11", why: "A szódakészlet tálcaszám vásárlást jelent, ami egyenesen ütközik a „nincs nagyker” szabállyal" },
    { type: "requires", from: "N1", to: "N8", why: "A gyümölcsben is van cukor; még ha csak gyümölcs is az édesség, kell napi limit, különben a túlevés így is megterhel" },
    { type: "requires", from: "N4", to: "N10", why: "A heti rekesz gyümölcs és joghurt összeadódik, ezért kell költségplafon, különben előbb a pénztárcád adja fel" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Heti egy fix bevásárlás", v: "Lemondasz a kedvenc nasijaidról", t: "Az első két hét sóvárgása kemény", l: "Naponta legfeljebb három adag gyümölcs", x: "Nincs hirtelen desszertvadászat" },
      fatal: "N10", thesis: "Az édes csak egész gyümölcsből jöjjön, korlátozott mennyiségben, és cukros nasi ne legyen otthon", title: "Váltás gyümölcsre · nincs nasi otthon",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Mindig legyen szóda a hűtőben", v: "15 percet vársz, mielőtt engedsz a sóvárgásnak", t: "Hetente csak kicsit változtatsz", l: "Az étkezések cukortartalma marad", x: "A régi nasik nem mehetnek úgy, mint eddig" },
      fatal: "N12", thesis: "Sóvárgáskor nyúlj a cukormentes szódához, és az új ízeket kis adagban próbáld ki, mielőtt többet veszel", title: "Előbb az italok · lassú csökkentés",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Minden alkalommal adagot számolsz", v: "Az otthoni édesség továbbra is kísért", t: "Sokáig tart, mire látszik az eredmény", l: "A csökkentés csak az önkontrollon múlik", x: "Lemondás a teljes gyümölcsre váltásról" },
      fatal: "N11", thesis: "Edd tovább, amit szeretsz, de kis kiszerelésben, adaglimittel és átdolgozott édes-savanyú szósszal", title: "Marad a kedvenc · limit és új szósz",
    },
  },
  recommend: { key: "alpha", why: "A gyümölcs természeténél fogva édes és savanykás, és a cukros nasi nélküli otthon igényli a legkevesebb akaraterőt" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Az összes édes-savanyú örömöd egyetlen gyümölcsön vagy italon múlik", kill: "Ha az kifogy vagy megunod, az egész terv összeomlik", label: "Egy pótlék" },
};
