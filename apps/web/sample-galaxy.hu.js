// 內建示範星系（IntentAnalysisResponse v1.0，匈牙利文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Hogyan rétegezzük a kódot", D2: "Miben térnek el a témák", D3: "Milyen mély a testreszabás", D4: "Hogyan épülnek fel a témabeállítások" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A másik oldal: a(z) „${dims[dim]}” kérdésben épp az ellenkező irányba megy`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_HU = {
  schema_version: "1.0",
  core: {
    decision: "Minden márka forkolja a komponensek saját példányát, vagy minden márka egy közös magot használjon, és az eltéréseket beállítófájlokkal kapcsolják?",
    metric: "60 napon belül: egy új téma legfeljebb 2 nap alatt élesedik, és minden téma CSS-e 50KB alatt marad",
  },
  quadrants: {
    Q1: { scar: "Márkás if-ekkel teletömött közös komponensek", sacred: "Semmi márkavizsgálat a magban" },
    Q2: { scar: "100+ téma layoutját javítottuk kézzel, egyenként", sacred: "A hibákat fogja meg a típusellenőrzés" },
    Q3: { scar: "Lemásoltuk valaki más design systemét, és túlbonyolítottuk", sacred: "Egészben cserélhető részek" },
    Q4: { scar: "Háromszor láttam, ahogy a testreszabás kicsúszik a kézből", sacred: "A rétegek határai kitartanak" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Három réteg", "Bontsd a komponenseket három rétegre: egy csak logikát tartalmazó magra, egy mindent összekötő view-ra és egy témarétegre a megjelenéshez; a mag nem importálhat téma-ID-kat és route-okat", "Nem vált be, ha 14 napon belül témát vizsgáló kód jelenik meg a magban", null),
    N2: node("D2", 0, 1, "Csak CSS vars", "A témák közti minden eltérést CSS-változókkal (custom properties) írj le, a komponensekben és layoutokban semmilyen témavizsgálat nélkül", "Nem vált be, ha már a 3. témához is a komponenseket kell módosítani", "A layoutbeli eltéréseket pusztán színekkel nem lehet megoldani"),
    N3: node("D1", 1, 0, "Csak egy téma", "Futás közben csak az aktuális téma stíluslapját töltsd be, ne csomagold az összes témát az oldal első betöltésébe", "Nem vált be, ha 14 napon belül bármelyik téma CSS-e 50KB fölé megy", null),
    N4: node("D4", 0, 2, "Típusos config", "Minden téma teljes TypeScript beállítás-objektumot ad; ha bármelyik mező kimarad, a build elbukik", "Nem vált be, ha egy új témához még mindig a közös komponenseket kell módosítani", null),
    N5: node("D3", 2, 0, "Márkánként fork", "Minden téma lemásolja a komponensek mappáját, és maga szerkeszti, így a márkák sosem zavarják egymást", "Nem vált be, ha a 10. téma után egyetlen hiba javítása több mint 10 helyen igényel módosítást", "Egy hibajavítás minden másolat javítását jelenti"),
    N6: node("D3", 1, 2, "Először 5%-nak", "Minden új témát egy hétig feature flag mögött csak az ügyfelek 5%-ának kapcsolj be; mindenkinek csak akkor, ha a hibaarány a célon belül marad", "Nem vált be, ha azon a héten a hibaarány 1% fölé megy", null),
    N7: node("D3", 2, 1, "Cserélhető ház", "Mint az autók, amelyek közös alvázon csak a karosszériát cserélik: cseréld le az egész layoutot, a közös view és a mag alatta maradjon a helyén", "Nem vált be, ha a layout cseréjéhez a magot is módosítani kell", "A kezelőelemek layoutonként másképp viselkedhetnek",
      { lateral: { src: "Autók: közös alváz", dist: 2, drop: "Új öntőforma minden modellhez" } }),
    N8: node("D2", 1, 0, "Fix slotok", "Mint a LEGO-kockák, amelyek csak a bütykökre pattannak: a layoutok fix slotokat adnak meg, a témák csak ezekbe tehetnek komponenst, és a slotokon kívül semmi sem változhat", "Nem vált be, ha a slotokon kívüli DOM akár egyszer is megváltozik", null,
      { lateral: { src: "Játékok: LEGO-kockák", dist: 3, drop: "A DOM szabad szerkesztése" } }),
    N9: node("D4", 2, 0, "Csak eltérések", "Mint ugyanannak a betűtípusnak a félkövér és a vékony változata: a téma csak azt sorolja fel, miben tér el az alaptémától, minden más mezőt automatikusan átvesz", "Nem vált be, ha az öröklés 3 szintnél mélyebbre megy", null,
      { lateral: { src: "Tipográfia: betűvastagságok", dist: 4, drop: "Teljes másolat témánként" } }),
    N10: node("D2", 2, 0, "Mezőkorlát", "Ha minden testreszabási kérés új mezőt ad a confighoz, a config karbantartása előbb-utóbb többe kerül, mint egy egyszerű fork", "Ne adj hozzá több mezőt, amint bármelyik beállítási interfész 40 mező fölé ér", "Annyi beállítás, hogy senki sem érti őket",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Az általánosítás végül többe kerül, mint a másolt kód" } }),
    N11: node("D4", 1, 0, "Nincs trükközés", "Ha az üzleti oldal közvetlenül a közös komponensekbe kérhet márkavizsgálatot, a rétegek határai egy negyedéven belül szétesnek", "Dobd el ezt a tervet, ha 14 napon belül akár 1 márkavizsgálat is bekerül a közös komponensekbe", "A rétegeket feláldozzuk a határidőért",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "A határidő tartásáért dicséret jár, a rétegek megtöréséért semmi büntetés" } }),
    N12: node("D3", 0, 1, "Nincs újraírás", "Ha mind a 70 modult át kell vinni, mielőtt bármi élesedne, minél többet fektettél bele, annál nehezebb megállni, és az újraírás általában félúton elakad", "Állj le, ha az első modul 14 napon belül nem élesedett", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Ha egyszerre írsz újra mindent, borul az ütemterv" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Egy közös típusos config vagy minden márkának külön fork: csak az egyiket választhatod" },
    { type: "excludes", from: "N1", to: "N5", why: "Egy közös háromrétegű mag vagy minden márkának külön komponensmásolat: csak az egyiket választhatod" },
    { type: "excludes", from: "N4", to: "N11", why: "A típusos config már buildkor kiszűri a kerülőutakat, így a rétegek kézi ellenőrzése csak ugyanazt nézi meg még egyszer" },
    { type: "excludes", from: "N2", to: "N7", why: "Ha a témák csak CSS-változókat módosítanak, senki sem cserél le egész layoutkomponenseket" },
    { type: "excludes", from: "N2", to: "N10", why: "Ha csak CSS-változók vannak, nincsenek configmezők, amelyek felhalmozódhatnának; válassz egyet" },
    { type: "excludes", from: "N9", to: "N11", why: "Az öröklés megengedi, hogy egy téma helyben felülírjon részeket, ez pedig ütközik a „soha ne kerüld meg a rétegeket” vészfékkel" },
    { type: "requires", from: "N1", to: "N8", why: "Ha három réteg van, a témáknak fix slotokon keresztül kell testreszabniuk, különben a view réteget szétbarkácsolják" },
    { type: "requires", from: "N4", to: "N10", why: "A típusos confignak mezőkorlát kell, különben addig nő, amíg senki sem érti" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Átírási munka már az elején", v: "Nincsenek gyors forkok", t: "60 nap a szerkezet felépítésére", l: "Alapos teszteket kell írni", x: "Nincsenek külön kerülőutak a márkáknak" },
      fatal: "N10", thesis: "Három réteg a komponenseknek és témánként egy típusos beállítófájl, így minden téma csak egy config", title: "Config-alapú · 3 réteg",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kevés layoutváltozat", v: "Kevesebb tervezői szabadság", t: "Hetente egy kis változás", l: "Az összetett layoutok kiesnek", x: "Az oldalszerkezet nem változhat" },
      fatal: "N12", thesis: "Csak CSS-változók és öröklés; az új témákat előbb kevés felhasználó látja, aztán egyre több", title: "Csak stílus · fokozatos bevezetés",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplikált kód", v: "A hibajavítások sok helyet érintenek", t: "Ez élesedik a leggyorsabban", l: "Több téma, több karbantartás", x: "Lemondás a típusos configról" },
      fatal: "N11", thesis: "Egész layoutok cseréje, és minden márka forkolja a saját héját", title: "Márkás forkok · közös alváz",
    },
  },
  recommend: { key: "alpha", why: "100+ témánál csak a config-alapú felépítés tartja kordában a karbantartási költséget" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Minden téma ugyanabból az alaptémából örököl", kill: "Ha az alaptéma elromlik, vele együtt minden téma layoutja szétesik", label: "Egy alaptéma" },
};
