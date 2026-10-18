// 擴充功能生活題示範星系（匈牙利文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Elhelyezés", D2: "Hogyan válassz", D3: "Mennyi átalakítás", D4: "Kapacitás és edények" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A másik oldal a(z) „${dims[dim]}” kérdésben az ellenkező végletig megy`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_HU = {
  schema_version: "1.0",
  core: {
    decision: "Átalakítsd a konyhát egy mosogatógép kedvéért, vagy olyat válassz, ami befér a mostani konyhádba?",
    metric: "Az első 30 napban hetente legalább 5-ször menjen, és naponta legfeljebb 5 percet mosogass kézzel",
  },
  quadrants: {
    Q1: { scar: "Vett mosogatógépet, mégis kézzel mosogat", sacred: "Előbb számold meg az edényeidet" },
    Q2: { scar: "Szerelés közben derült ki, hogy rövid a cső", sacred: "Mérj, mielőtt veszel" },
    Q3: { scar: "Netes toplistából vette, és nem fért be", sacred: "Lesd el más területek megoldásait" },
    Q4: { scar: "Láttam már három mosogatógépet tányértartóvá válni", sacred: "Gondold végig, hogyan bukhat el" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Beépítés", "Szedd ki a mosogató melletti 45 vagy 60 cm-es szekrényt, és építsd be oda a gépet, így nem foglal pultot és nem állja el az utat", "Nem jó, ha a szekrény szélessége, magassága vagy mélysége kisebb a gép megadott beépítési méreténél", null),
    N2: node("D2", 0, 1, "Étkezés után", "Válassz 1 óránál rövidebb gyorsprogramos modellt, és indítsd el minden étkezés után, hogy a koszos edény ne álljon éjszakára a mosogatóban", "Nem jó, ha 14 napon belül több mint 2-szer zsíros marad az edény a gyorsprogram után", "A gyorsprogram általában kihagyja a szárítást, így az edény magától szárad"),
    N3: node("D1", 1, 0, "Mosogató mellé", "Tedd a gépet a mosogatótól legfeljebb 1 méterre, és a lefolyócsövet vezesd egyenesen a mosogató szifonjába, falfúrás és új vízszerelés nélkül", "Nem jó, ha a mellékelt lefolyócső nem ér el a mosogatóig és toldás kell", null),
    N4: node("D4", 0, 2, "Családi méret", "Ha hárman vagy többen laktok otthon, vegyél 12+ terítékeset, hogy a lábasok és a tányérok egy körben férjenek be, ne kettőben", "Nem jó, ha 14 napból több mint 2 napon nem fér be egy körbe az edény és a lábasok", null),
    N5: node("D3", 2, 0, "Asztali mini", "Vegyél legfeljebb 8 terítékes asztali minit: nem kell szekrényt bontani, nem kell vízszerelés, és költözéskor viheted magaddal", "Nem jó, ha 14 napból több mint 3 napon 2 kör kell, hogy minden tiszta legyen", "Elvesz egy jó darabot az előkészítő pultból"),
    N6: node("D3", 1, 2, "Előbb próba", "Vegyél szabadonálló és beépíthető módon is használható modellt, tartsd 30 teljes napig a mosogató mellett, és csak utána döntsd el, kiszeded-e a szekrényt, ne az első napon bonts", "Nem jó, ha a 30 napos próba alatt a gép elállja az utat vagy egy fiókot", null),
    N7: node("D3", 2, 1, "Tartályos gép", "Mint egy lakóautó saját víztartállyal: válassz kézzel feltölthető asztali modellt, csaptelep-bekötés és vízszerelés nélkül", "Nem jó, ha bármelyik héten 2-szer vagy többször kihagyod és kézzel mosogatsz, mert lusta voltál feltölteni", "A feltöltés macerásabb, mint gondolnád",
      { lateral: { src: "Kemping: beépített víztartály", dist: 2, drop: "Állandó csapbekötés" } }),
    N8: node("D2", 1, 0, "Előbb mérj", "Mint a pilóta felszállás előtti ellenőrzőlistája: rendelés előtt mérd le a szélességet, mélységet és magasságot, aztán nézd meg a konnektort és a lefolyót; ha az 5-ből bármelyik hiányzik, ne rendelj", "Nem jó, ha valamelyik méret nem stimmel, vagy megérkezés után nem lehet beszerelni", null,
      { lateral: { src: "Repülés: felszállás előtti ellenőrzés", dist: 3, drop: "Rendelés zsigerből" } }),
    N9: node("D4", 2, 0, "Gépbiztos edény", "Mint egy étterem, ahol csak gépben mosható edényt használnak: cserélj le minden lábast és tányért, amin az áll, hogy nem mosogatógépbe való, hogy semmi ne maradjon kézi mosogatásra", "Nem jó, ha a csere utáni 14 napban még mindig napi 3-nál több darabot mosogatsz kézzel", null,
      { lateral: { src: "Vendéglátás: professzionális edények", dist: 4, drop: "Vegyes régi edénykészlet otthon" } }),
    N10: node("D2", 2, 0, "Nincs félig", "Ha félig sem telve indítod, majdnem annyi vizet és áramot fogyaszt, mint teli, így minden tányér elmosása több mint kétszer annyiba kerül", "Rendelés előtt 7 napig jegyezd fel az edényeket; ha átlagosan napi 6 terítéknél kevesebb, válts minire", "Az edény szagos lesz, amíg a teli töltetre vár",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Nagy gépet félüresen járatni nem éri meg" } }),
    N11: node("D4", 1, 0, "Lábas nélkül", "Ha kényelemből wokot és fazekat zsúfolsz bele, a mini nem fogadja be egy körben az edényt, és megint kézzel mosogatsz", "Dobd el ezt a tervet, ha 14 napon belül több mint 2-szer kell a lábasok miatt második kört indítani", "Nem mindenki tartja be otthon a szabályt",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Kényelemből túltömött gép" } }),
    N12: node("D3", 0, 1, "Nincs felújítás", "Ha a mosogatógép beépítése az egész konyha felújításává dagad, a munka elkezdése és a kifizetés után már végig kell vinned", "Ne kezdj bele, ha a szekrénybontás előtti árajánlat több mint a gép árának kétszerese", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Ha elindult a munka, nincs visszaút" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Egy 12+ terítékes gép nem fér a pultra, tehát vagy az, vagy egy asztali mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Ha a gép be van építve a szekrénybe, nem veszel mellé asztali minit is; vagy az egyik, vagy a másik" },
    { type: "excludes", from: "N4", to: "N11", why: "A családi méret lényege, hogy a lábasok is gépbe menjenek, ami ellentmond a lábasok kizárásának" },
    { type: "excludes", from: "N2", to: "N7", why: "Minden étkezés utáni indítás napi háromszori kézi tartálytöltést jelent, amit nehéz tartani" },
    { type: "excludes", from: "N2", to: "N10", why: "Minden étkezés utáni indítás gyakran fél töltetnél kevesebb, ami ellentmond a „nincs félig” szabálynak" },
    { type: "excludes", from: "N9", to: "N11", why: "A gépbiztos edényekre váltás lényege, hogy gépbe kerüljenek, ami ellentmond a lábasok kizárásának" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm eltérés, és nem csúszik be a szekrénybe, ezért rendelés előtt mindent le kell mérni" },
    { type: "requires", from: "N4", to: "N10", why: "A félüresen járatott nagy gép is teli töltetnyi vizet és áramot fogyaszt, ezért tartsd magad a „nincs félig” szabályhoz" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Szekrénybontás és szerelési munkadíj", v: "Eggyel kevesebb tárolószekrény", t: "Várni kell a szerelőre a felméréshez és beépítéshez", l: "Indítás előtt meg kell várni a fél töltetet", x: "Lemondás az asztali miniről" },
      fatal: "N10", thesis: "Mérd le a szekrényt, építs be nagy gépet, és csak legalább félig telve indítsd", title: "Beépített nagy gép, egyszer és jól",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Új edények, plusz víz és áram minden étkezés után", v: "A próba alatt elállja az utat", t: "A szekrény csak 30 nap után jön ki", l: "Gyorsprogram után levegőn szárad az edény", x: "Lemondás az asztali miniről" },
      fatal: "N12", thesis: "Gyors mosás minden étkezés után; maradjon a mosogató mellett, amíg be nem válik, aztán építsd be", title: "Napi gyorsmosás, próba a beépítés előtt",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Minden körnél kézzel töltöd fel a vizet", v: "Elvesz egy darabot az előkészítő pultból", t: "A lábasokat minden nap kézzel mosod", l: "Legfeljebb 8 teríték", x: "Lemondás a beépítésről és a nagy kapacitásról" },
      fatal: "N11", thesis: "Egy magad töltötte asztali mini; a lábasokat továbbra is kézzel mosod", title: "Asztali mini, vízszerelés nélkül",
    },
  },
  recommend: { key: "alpha", why: "Háromfős vagy nagyobb háztartásban egy nagy gép egyetlen körben elviszi az egész napi edényt" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Az egész család edénye ezen az egy gépen múlik; ha elromlik, az egyetlen tartalék a kézi mosogatás", kill: "Dobd el ezt a tervet, ha a javítás több mint 7 napig tart, és a család visszaáll a kézi mosogatásra", label: "Egyetlen gép" },
};
