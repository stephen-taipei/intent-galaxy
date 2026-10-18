// 內建示範星系（IntentAnalysisResponse v1.0，克羅埃西亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Kako je kod podijeljen u slojeve", D2: "Po čemu se teme razlikuju", D3: "Koliko duboko ide prilagodba", D4: "Kako su složene postavke teme" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druga strana: „${dims[dim]}” upravo obrnuto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_HR = {
  schema_version: "1.0",
  core: {
    decision: "Treba li svaki brend imati vlastitu kopiju komponenti ili svi brendovi trebaju dijeliti jednu jezgru, a razlike mijenjati u konfiguracijskim datotekama?",
    metric: "U roku od 60 dana: nova tema gotova za 2 dana ili brže, a CSS svake teme ispod 50KB",
  },
  quadrants: {
    Q1: { scar: "Zajedničke komponente natrpane uvjetima za pojedine brendove", sacred: "Nikakvih uvjeta za brend u jezgri" },
    Q2: { scar: "Ručno popravljanje izgleda za više od 100 tema, jednu po jednu", sacred: "Neka provjera tipova hvata greške" },
    Q3: { scar: "Kopirao tuđi design system i pretjerao s apstrakcijom", sacred: "Dijelovi koji se mogu zamijeniti u cijelosti" },
    Q4: { scar: "Tri puta gledao kako prilagodbe izmiču kontroli", sacred: "Granice slojeva moraju izdržati" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tri sloja", "Podijeli komponente u tri sloja: jezgru samo s logikom, prikaz koji sve povezuje i tanki sloj teme za izgled; jezgra ne smije znati nazive tema ni rute", "Ne uspijeva ako se u roku od 14 dana u jezgri pojavi kod koji provjerava temu", null),
    N2: node("D2", 0, 1, "Samo varijable", "Svaku razliku među temama zapiši kao CSS varijable (custom properties), bez ikakve provjere teme u komponentama i rasporedima", "Ne uspijeva ako već 3. tema traži izmjene komponenti", "Razlike u rasporedu ne rješavaju se samim bojama"),
    N3: node("D1", 1, 0, "Jedna tema", "Učitavaj samo stilove trenutačne teme umjesto da sve teme pakiraš u prvo učitavanje stranice", "Ne uspijeva ako u roku od 14 dana CSS bilo koje teme prijeđe 50KB", null),
    N4: node("D4", 0, 2, "Stroge postavke", "Svaka tema ima potpun konfiguracijski objekt u TypeScriptu; ako nedostaje ijedno polje, build ne prolazi", "Ne uspijeva ako nova tema i dalje znači mijenjanje zajedničkih komponenti", null),
    N5: node("D3", 2, 0, "Kopija za brend", "Svaka tema kopira mapu komponenti i sama je mijenja, pa brendovi nikad ne utječu jedni na druge", "Ne uspijeva ako nakon 10. teme ispravak jedne greške znači izmjene na više od 10 mjesta", "Jedan ispravak znači krpanje svake kopije"),
    N6: node("D3", 1, 2, "Prvo za 5 %", "Svaku novu temu uključi na tjedan dana samo za 5 % klijenata; za sve tek kad broj grešaka ostane u granicama", "Ne uspijeva ako stopa grešaka u tom tjednu prijeđe 1 %", null),
    N7: node("D3", 2, 1, "Nova karoserija", "Kao automobili sa zajedničkom šasijom i različitom karoserijom: zamijeniš cijeli raspored, a zajednički prikaz i jezgra ispod ostaju", "Ne uspijeva ako zamjena rasporeda znači mijenjanje jezgre", "Kontrole se u različitim rasporedima mogu ponašati drukčije",
      { lateral: { src: "Automobili: zajednička šasija", dist: 2, drop: "Novi kalup za svaki model" } }),
    N8: node("D2", 1, 0, "Fiksna mjesta", "Kao LEGO kockice koje se spajaju samo na ispupčenja: raspored ima fiksna mjesta, tema u njih smije samo umetati komponente, a izvan njih se ništa ne mijenja", "Ne uspijeva ako se DOM izvan tih mjesta promijeni makar jednom", null,
      { lateral: { src: "Igračke: LEGO kockice", dist: 3, drop: "Slobodne izmjene DOM-a" } }),
    N9: node("D4", 2, 0, "Samo razlike", "Kao debeli i tanki rez istog pisma: tema navodi samo ono po čemu se razlikuje od zadane, a sve ostalo preuzima se automatski", "Ne uspijeva ako nasljeđivanje ide dublje od 3 razine", null,
      { lateral: { src: "Tipografija: rezovi pisma", dist: 4, drop: "Potpuna kopija za svaku temu" } }),
    N10: node("D2", 2, 0, "Gornja granica", "Ako svaki zahtjev za prilagodbu doda polje u konfiguraciju, njezino će održavanje prije ili kasnije koštati više od obične kopije", "Prestani dodavati polja kad bilo koje sučelje konfiguracije ima više od 40", "Toliko postavki da ih nitko ne razumije",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Apstrakcija na kraju košta više od kopiranog koda" } }),
    N11: node("D4", 1, 0, "Bez iznimaka", "Ako poslovna strana može tražiti uvjete za brend izravno u zajedničkim komponentama, podjela na slojeve raspast će se u roku od tri mjeseca", "Odustani od ovog plana ako u roku od 14 dana u zajedničke komponente uđe makar 1 uvjet za brend", "Žrtvovanje slojeva da bi se stigao rok",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Za ispunjen rok pohvale, za razbijene slojeve nitko ne kažnjava" } }),
    N12: node("D3", 0, 1, "Ne sve odjednom", "Ako svih 70 modula treba prebaciti prije nego što išta stigne do korisnika, što je više uloženo, to je teže stati, a prepisivanje obično zapne na pola puta", "Stani ako prvi modul ne stigne do korisnika u roku od 14 dana", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Prepisivanje svega odjednom ruši raspored rokova" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Jedna zajednička tipizirana konfiguracija i zasebna kopija za svaki brend: može se odabrati samo jedno" },
    { type: "excludes", from: "N1", to: "N5", why: "Zajednička troslojna jezgra i kopija komponenti za svaki brend: može se odabrati samo jedno" },
    { type: "excludes", from: "N4", to: "N11", why: "Tipizirana konfiguracija blokira prečace već pri izgradnji, pa bi ručno čuvanje slojeva provjeravalo isto dvaput" },
    { type: "excludes", from: "N2", to: "N7", why: "Ako teme mijenjaju samo CSS varijable, nitko ne mijenja cijele komponente rasporeda" },
    { type: "excludes", from: "N2", to: "N10", why: "Sa samim CSS varijablama nema polja konfiguracije koja bi se gomilala; odaberi jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Nasljeđivanje dopušta temi da nešto lokalno prepiše, a to se kosi s osiguračem „nikad ne zaobilazi slojeve”" },
    { type: "requires", from: "N1", to: "N8", why: "Kad postoje tri sloja, teme moraju mijenjati izgled kroz fiksna mjesta, inače se sloj prikaza razbije" },
    { type: "requires", from: "N4", to: "N10", why: "Tipizirana konfiguracija treba gornju granicu broja polja, inače naraste toliko da je nitko ne razumije" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Puno prepisivanja na početku", v: "Nema brzih kopija", t: "60 dana za postavljanje strukture", l: "Treba napisati temeljite testove", x: "Nema prečaca za brendove" },
      fatal: "N10", thesis: "Tri sloja komponenti i tipizirana konfiguracijska datoteka za svaku temu, pa je svaka tema samo jedna konfiguracija", title: "Konfiguracija · 3 sloja",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Manji izbor rasporeda", v: "Manje slobode u dizajnu", t: "Svaki tjedan mala promjena", l: "Složeni rasporedi ne dolaze u obzir", x: "Nema promjena strukture stranice" },
      fatal: "N12", thesis: "Samo CSS varijable i nasljeđivanje; nove teme prvo za nekolicinu korisnika, zatim za sve", title: "Samo stilovi · postupno",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Udvostručen kod", v: "Ispravci na mnogo mjesta", t: "Najbrže uvođenje", l: "Više tema, više održavanja", x: "Odustajanje od tipizirane konfiguracije" },
      fatal: "N11", thesis: "Mijenjaj cijele rasporede i pusti svaki brend da ima vlastitu kopiju karoserije", title: "Kopije brendova · zajednička šasija",
    },
  },
  recommend: { key: "alpha", why: "S više od 100 tema samo pristup temeljen na konfiguraciji drži troškove održavanja pod kontrolom" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Svaka tema nasljeđuje od iste zadane teme", kill: "Pokvari zadanu temu i raspast će se raspored svih tema", label: "Sve na jednoj" },
};
