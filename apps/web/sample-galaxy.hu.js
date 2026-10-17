// 內建示範星系（IntentAnalysisResponse v1.0，匈牙利文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Rétegek határai", D2: "Az eltérések kifejezése", D3: "Testreszabás mértéke", D4: "Téma összetétele" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Ellenpólus: vidd a(z) „${dims[dim]}” tengelyt az ellenkező végletbe`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_HU = {
  schema_version: "1.0",
  core: {
    decision: "Minden márka forkolja a saját komponenseit, vagy egyetlen közös core-t vezéreljen konfiguráció?",
    metric: "60 napon belül: egy új téma ≤2 nap alatt élesedik, és minden téma CSS-e <50KB",
  },
  quadrants: {
    Q1: { scar: "Márkás if-ekkel teletömött közös komponensek", sacred: "Nulla elágazás a core-ban" },
    Q2: { scar: "100+ téma egyenként, kézzel foltozva", sacred: "A típusok kiszűrik a hibát" },
    Q3: { scar: "Lemásoltunk egy design systemet, és túlabsztraháltuk", sacred: "Cserélhető struktúra" },
    Q4: { scar: "Háromszor láttam elszabadulni a testreszabást", sacred: "A határok kitartanak" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Három réteg", "Bontsd a komponenseket tiszta core-ra, koordináló view-ra és theme levélre; a core nem importálhat téma-ID-kat és route-okat", "Téves, ha 14 napon belül témavizsgálat jelenik meg a core-ban", null),
    N2: node("D2", 0, 1, "Csak CSS vars", "Minden témaeltérést kizárólag CSS custom propertykkel fejezz ki, nulla elágazással a komponensekben és layoutokban", "Téves, ha már a 3. téma is komponensmódosítást igényel", "A layout-eltérések nem fejezhetők ki pusztán színekkel"),
    N3: node("D1", 1, 0, "Lazy téma-CSS", "Futásidőben csak az aktív téma egyetlen stylesheetjét töltsd be, ne csomagold az összes témát az első renderbe", "Téves, ha 14 napon belül bármelyik téma CSS-e túllépi az 50KB-ot", null),
    N4: node("D4", 0, 2, "Típusos config", "Minden téma teljes TypeScript config objektumot ad; bármely hiányzó mező eltöri a buildet", "Téves, ha egy új témához még mindig a közös komponenseket kell módosítani", null),
    N5: node("D3", 2, 0, "Fork márkánként", "Minden téma lemásolja a komponenskönyvtárat és önállóan módosítja, így a márkák soha nem hatnak egymásra", "Téves, ha a 10. téma után egy bug javítása >10 helyet érint", "Egy bugfix N másolat foltozását jelenti"),
    N6: node("D3", 1, 2, "Canary témák", "Minden új téma feature flag mögött egy hétig a tenantok 5%-ánál fut; 100%-ra csak akkor megy, ha a hibaarány eléri a célt", "Téves, ha a canary hibaarány meghaladja az 1%-ot", null),
    N7: node("D3", 2, 1, "Héjcsere", "[D2 autóplatform] A layoutok olyanok, mint a karosszéria: az egész héj cserélhető, a közös alváz (view és core) marad", "Téves, ha a layoutcsere core-módosítást igényel", "Az interakciók eltérnek a layoutok között",
      { lateral: { src: "Autóipar: platform-alváz", dist: 2, drop: "Minden modellhez új szerszámozás" } }),
    N8: node("D2", 1, 0, "Fix slotok", "[D3 LEGO-kockák] A layoutok fix slotokat deklarálnak; a témák csak komponenseket illeszthetnek a slotokba, a slotokon kívüli struktúrához nem nyúlhatnak", "Téves, ha a slotokon kívüli DOM akár egyszer is módosul", null,
      { lateral: { src: "Játékok: LEGO-kocka csatlakozás", dist: 3, drop: "Szabad DOM-testreszabás" } }),
    N9: node("D4", 2, 0, "Diff öröklés", "[D4 betűcsalád] A témák csak az alapértelmezettől való eltérésüket deklarálják; minden más mezőt automatikusan örökölnek", "Téves, ha az öröklés 3 szintnél mélyebb", null,
      { lateral: { src: "Betűtervezés: vastagsági családok", dist: 4, drop: "Teljes másolat témánként" } }),
    N10: node("D2", 2, 0, "Kulcsplafon", "Ha minden testreszabási kérés új config mezőt hoz, a config karbantartása elkerülhetetlenül drágább lesz, mint egy sima fork", "Állj le a mezők hozzáadásával, amint bármely config interfész túllépi a 40 mezőt", "Config-pokol",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Az absztrakció drágább, mint a duplikáció" } }),
    N11: node("D4", 1, 0, "Nincs kerülőút", "Ha az üzlet közvetlenül a közös komponensekbe követelhet márkavizsgálatot, a határ egy negyedéven belül elesik", "Érvénytelen, ha 14 napon belül akár egy márkavizsgálat is bekerül a közös komponensekbe", "Határokat cserélünk határidőkre",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "A határidőnyomás jutalmazza a határok áthágását" } }),
    N12: node("D3", 0, 1, "Nincs big bang", "Ha mind a 70 modult migrálni kell, mielőtt bármi élesedne, az elsüllyedt költség félúton megakasztja a refaktort", "Állj le, ha az első modul 14 napon belül nem élesedett", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "A big-bang refaktor túszul ejti a határidőket" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "A közös típusos config és a márkánkénti komponens-fork vagy-vagy választás" },
    { type: "excludes", from: "N1", to: "N5", why: "Egy közös háromrétegű core és a márkánkénti komponensmásolatok kizárják egymást" },
    { type: "excludes", from: "N4", to: "N11", why: "A típusos config már fordításkor blokkolja a kerülőutakat, így a kézi határellenőrzés felesleges védőkorláttá válik" },
    { type: "excludes", from: "N2", to: "N7", why: "Ha a témák csak CSS-változókat módosítanak, nincs teljes layout-komponens csere" },
    { type: "excludes", from: "N2", to: "N10", why: "A tiszta CSS-változóknak nincsenek felfúvódó config mezői; válassz egyet" },
    { type: "excludes", from: "N9", to: "N11", why: "Az öröklési láncok helyi felülírást engednek, ami ütközik a nulla kerülőút védőkorláttal" },
    { type: "requires", from: "N1", to: "N8", why: "Három rétegre bontás után a témáknak fix slotokon át kell testreszabniuk, különben a view réteg átszakad" },
    { type: "requires", from: "N4", to: "N10", why: "A típusos confignak mezőplafon kell, különben config-pokollá dagad" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Előzetes refaktor-munka", v: "Nincs gyors fork", t: "60 nap a váz felépítésére", l: "Integritási teszteket kell írni", x: "Nincs márkaspecifikus rövidítés" },
      fatal: "N10", thesis: "A háromrétegű határok és a típusos config minden témát egyetlen levélre zsugorítanak", title: "Config-vezérelt · 3 réteg",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Korlátozott layout-változatosság", v: "Kisebb tervezői szabadság", t: "Kis lépések hetente", l: "Az összetett layoutok kiesnek", x: "Nincs strukturális testreszabás" },
      fatal: "N12", thesis: "Csak CSS-változók és öröklés, a témák fokozatosan, canaryn keresztül élesednek", title: "Csak stílus · fokozatosan",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplikált kód", v: "A bugfixek sok helyet érintenek", t: "A leggyorsabb élesítés", l: "A karbantartási költség lineárisan nő", x: "Lemondás a típusos configról" },
      fatal: "N11", thesis: "Cseréld az egész layoutot, és minden márka forkolja a saját héját", title: "Márka-forkok · közös alváz",
    },
  },
  recommend: { key: "alpha", why: "100+ témánál csak a config-vezérelt tervezés tartja kordában a karbantartási költséget" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Minden téma ugyanabból az alapértelmezett témából örököl", kill: "Ha a default elromlik, minden téma layoutja szétesik", label: "default SPOF" },
};
