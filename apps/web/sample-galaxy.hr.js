// 內建示範星系（IntentAnalysisResponse v1.0，克羅埃西亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Granice slojeva", D2: "Način izražavanja razlika", D3: "Opseg prilagodbe", D4: "Sastav tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Suprotni stav — ${dims[dim]}: suprotna krajnost`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_HR = {
  schema_version: "1.0",
  core: {
    decision: "Treba li svaki brend forkati vlastite komponente ili jedan zajednički core treba pokretati konfiguracija?",
    metric: "Unutar 60 dana: nova tema isporučena za ≤2 dana, a CSS svake teme <50KB",
  },
  quadrants: {
    Q1: { scar: "Zajedničke komponente natrpane if-ovima za brendove", sacred: "Nula grananja u coreu" },
    Q2: { scar: "Više od 100 tema krpano ručno jedna po jedna", sacred: "Tipovi hvataju greške" },
    Q3: { scar: "Kopiran design system, pretjerano apstrahiran", sacred: "Zamjenjiva struktura" },
    Q4: { scar: "Tri puta gledao kako prilagodbe izmiču kontroli", sacred: "Granice moraju izdržati" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 sloja", "Podijeli komponente na čisti core, koordinirajući view i list theme; core ne smije uvoziti ID-jeve tema ni rute", "Pogrešno ako se u roku od 14 dana u coreu pojave provjere tema", null),
    N2: node("D2", 0, 1, "CSS varijable", "Svaku razliku među temama izrazi isključivo kroz CSS custom properties, bez ikakvog grananja u komponentama ili layoutima", "Pogrešno ako već 3. tema traži izmjene komponenti", "Razlike u rasporedu ne mogu se izraziti samo bojama"),
    N3: node("D1", 1, 0, "CSS na zahtjev", "U runtimeu učitaj samo jedan stylesheet aktivne teme umjesto da sve teme pakiraš u prvi prikaz", "Pogrešno ako u roku od 14 dana CSS bilo koje teme prijeđe 50KB", null),
    N4: node("D4", 0, 2, "Strogi config", "Svaka tema isporučuje potpun konfiguracijski objekt u TypeScriptu; bilo koje polje koje nedostaje ruši build", "Pogrešno ako nova tema i dalje traži izmjene zajedničkih komponenti", null),
    N5: node("D3", 2, 0, "Fork po brendu", "Svaka tema kopira direktorij komponenti i mijenja ga neovisno, pa brendovi nikad ne utječu jedni na druge", "Pogrešno ako nakon 10. teme ispravak jednog buga dira >10 mjesta", "Jedan ispravak buga znači krpanje N kopija"),
    N6: node("D3", 1, 2, "Canary teme", "Svaku novu temu pusti iza feature flaga na 5% tenanata tjedan dana; na 100% tek kad stopa grešaka zadovolji cilj", "Pogrešno ako stopa grešaka u canaryju prijeđe 1%", null),
    N7: node("D3", 2, 1, "Nova karoserija", "[D2 platforma automobila] Layouti su kao karoserije automobila: mijenjaš cijelu karoseriju, a zajednička šasija (view i core) ostaje na mjestu", "Pogrešno ako zamjena layouta traži izmjene u coreu", "Interakcije se razilaze među layoutima",
      { lateral: { src: "Automobilska industrija: zajednička platforma", dist: 2, drop: "Razvoj svakog modela od nule" } }),
    N8: node("D2", 1, 0, "Fiksni slotovi", "[D3 LEGO kockice] Layouti deklariraju fiksne slotove; teme smiju samo umetati komponente u slotove i ne smiju mijenjati strukturu izvan njih", "Pogrešno ako se DOM izvan slotova promijeni i samo jednom", null,
      { lateral: { src: "Igračke: spojno sučelje LEGO kockica", dist: 3, drop: "Slobodna prilagodba DOM-a" } }),
    N9: node("D4", 2, 0, "Samo razlike", "[D4 obitelj fontova] Teme deklariraju samo svoju razliku od zadane; sva ostala polja nasljeđuju se automatski", "Pogrešno ako nasljeđivanje ide dublje od 3 razine", null,
      { lateral: { src: "Tipografija: rezovi jedne obitelji fonta", dist: 4, drop: "Potpuna kopija za svaku temu" } }),
    N10: node("D2", 2, 0, "Limit ključeva", "Ako svaki zahtjev za prilagodbom doda polje u config, održavanje konfiguracije neizbježno će koštati više od običnog forka", "Prestani dodavati polja čim bilo koje sučelje configa prijeđe 40 polja", "Konfiguracijski pakao",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Apstrakcija košta više od dupliciranja" } }),
    N11: node("D4", 1, 0, "Bez zaobilazaka", "Ako posao može tražiti provjere brenda izravno u zajedničkim komponentama, granica će pasti unutar kvartala", "Ništavno ako se u roku od 14 dana u zajedničke komponente doda bilo kakva provjera brenda", "Granice zamijenjene za rokove",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Pritisak rokova nagrađuje probijanje granica" } }),
    N12: node("D3", 0, 1, "Zabrana prepisa", "Ako svih 70 modula mora migrirati prije nego što išta ode u produkciju, nepovratni troškovi zaustavit će refaktoriranje na pola puta", "Stani ako prvi modul nije isporučen u roku od 14 dana", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refaktoriranje drži rokove kao taoce" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Zajednički tipizirani config i forkovi komponenti po brendu izbor su ili–ili" },
    { type: "excludes", from: "N1", to: "N5", why: "Zajednički troslojni core i kopije komponenti po brendu međusobno se isključuju" },
    { type: "excludes", from: "N4", to: "N11", why: "Tipizirani config već pri kompilaciji blokira zaobilaženja, pa ručni pregled granica postaje suvišna prepreka" },
    { type: "excludes", from: "N2", to: "N7", why: "Ako teme mijenjaju samo CSS varijable, nema zamjene cijelih komponenti layouta" },
    { type: "excludes", from: "N2", to: "N10", why: "Čiste CSS varijable nemaju polja configa koja bi mogla bujati; odaberi jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Lanci nasljeđivanja dopuštaju lokalna preklapanja, što je u sukobu sa zaštitnom ogradom nula zaobilazaka" },
    { type: "requires", from: "N1", to: "N8", why: "Nakon podjele na tri sloja teme se moraju prilagođavati kroz fiksne slotove, inače se sloj view probija" },
    { type: "requires", from: "N4", to: "N10", why: "Tipizirani config treba gornju granicu polja, inače se napuše u konfiguracijski pakao" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Veliko refaktoriranje na početku", v: "Nema brzih forkova", t: "60 dana za izgradnju kostura", l: "Treba pisati testove integriteta", x: "Nema prečaca za pojedini brend" },
      fatal: "N10", thesis: "Troslojne granice i tipizirani config svode svaku temu na jedan list", title: "Config · 3 sloja",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ograničena varijabilnost layouta", v: "Manje dizajnerske slobode", t: "Mali koraci svaki tjedan", l: "Složeni layouti otpadaju", x: "Nema prilagodbe strukture" },
      fatal: "N12", thesis: "Samo CSS varijable i nasljeđivanje, a teme se uvode postupno iza canaryja", title: "Čisti CSS · postupno",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Duplicirani kod", v: "Ispravci bugova na mnogo mjesta", t: "Najbrža isporuka", l: "Trošak održavanja raste linearno", x: "Odustajanje od tipiziranog configa" },
      fatal: "N11", thesis: "Mijenjaj cijele layoute i pusti svaki brend da forka vlastitu karoseriju", title: "Forkovi brendova · zajednička šasija",
    },
  },
  recommend: { key: "alpha", why: "Uz više od 100 tema samo pristup vođen konfiguracijom drži trošak održavanja pod kontrolom" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Svaka tema nasljeđuje istu zadanu temu", kill: "Pokvari zadanu temu i raspast će se layout svake teme", label: "SPOF: zadana tema" },
};
