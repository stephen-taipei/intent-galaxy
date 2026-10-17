// 擴充功能內建生活題示範星系（克羅埃西亞文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Odakle slatko", D2: "Kamo s potrebom za slatkim", D3: "Kolika promjena", D4: "Što držiš kod kuće" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Suprotno gledište — ${dims[dim]}: drugi pol`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_HR = {
  schema_version: "1.0",
  core: {
    decision: "Zamijeniti sve slatko cijelim voćem ili nastaviti jesti ono što voliš, samo manje?",
    metric: "Tijekom 30 dana najviše 3 slatka grickanja i pića ukupno tjedno (bilježeno na mobitelu radi provjere)",
  },
  quadrants: {
    Q1: { scar: "Pojeo cijelu vrećicu suhog voća misleći da je to zdrav međuobrok", sacred: "Slatko samo iz cijelog voća" },
    Q2: { scar: "Tri puta se odricao šećera i svaki put popustio u drugom tjednu", sacred: "Vrijedi samo ono čega se možeš držati" },
    Q3: { scar: "Prepisao low-carb jelovnik i nakon tri dana mu je bilo dosta", sacred: "Promijeni metodu, ne okus" },
    Q4: { scar: "Vidio previše ljudi kako se odriču šećera i brzo mu vraćaju", sacred: "Pravila pobjeđuju snagu volje" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Cijelo voće", "Kad god poželiš nešto slatko, jedi samo cijelo svježe voće, poput kivija, ananasa, borovnica ili naranči; sokovi, suho i kandirano voće ne računaju se", "Ne uspijeva ako u 14 dana više od 3 dana kupiš desert da utažiš želju", null),
    N2: node("D2", 0, 1, "Gazirana voda", "Kad te uhvati želja, prvo popij čašu nezaslađene gazirane vode s limunom ili marakujom; ako nakon 15 minuta i dalje želiš slatko, ostavi to za poslije sljedećeg obroka. Mijenjaju se samo pića: obroci ostaju isti i ne kupuješ zamjenske grickalice", "Ne uspijeva ako u 14 dana nakon 15 minuta čekanja i dalje želiš slatko u više od pola slučajeva", "Piće ne utažuje potrebu da nešto žvačeš"),
    N3: node("D1", 1, 0, "Samo uz obrok", "Slatko-kisele grickalice i voće jedi samo unutar 1 sata nakon obroka; ništa na prazan želudac i ništa u 3 sata prije spavanja", "Ne uspijeva ako nakon 14 dana i dalje više od 3 večeri tražiš grickalice prije spavanja", null),
    N4: node("D4", 0, 2, "Nula slatkiša", "Kupuj jednom tjedno: sezonsko voće u gajbicama i onoliko običnog jogurta bez šećera koliko treba za tjedan; to su jedine grickalice u kući, a slatkiši nikad ne ulaze u kuću", "Ne uspijeva ako u 14 dana bude tjedan u kojem vani kupiš slatkiše više od 3 puta", null),
    N5: node("D3", 2, 0, "Pola porcije", "Nastavi jesti slatko-kisele grickalice koje voliš, samo manje: prijeđi na mala pakiranja i prepolovi dnevnu količinu, bez ikakvih zamjena", "Ne uspijeva ako od 2. tjedna više od 2 dana u tjednu pojedeš više od pola nekadašnje količine", "Često otvoriš drugo pakiranje odmah nakon prvog"),
    N6: node("D3", 1, 2, "Testiraj pića", "Svaki novi okus nezaslađenog pića kupi u najmanjem pakiranju i pij ga 3 dana zaredom; cijeli paket kupi tek ako ti se sviđa, nikad ne stvaraj zalihe odjednom", "Ne uspijeva ako je okus kupljen u paketu nakon testa 14 dana kasnije i dalje više od pola pun", null),
    N7: node("D3", 2, 1, "Promijeni umak", "Kao da mijenjaš masku za mobitel, a ne mobitel: zadrži glavne sastojke slatko-kiselog pileta ili ribe, ali umak napravi sam od rajčice, ananasa i octa, s pola uobičajenog šećera", "Ne uspijeva ako nakon 2 pokušaja s novim umakom u 14 dana svi ukućani kažu da nije dobro", "U restoranu ni kod dostave ne možeš promijeniti umak",
      { lateral: { src: "Tehnologija: nova maska za mobitel", dist: 2, drop: "Potpuno izbaciti jelo s jelovnika" } }),
    N8: node("D2", 1, 0, "Max 3 porcije", "Kao ograničenje prtljage u avionu: najviše 3 porcije voća i slatko-kiselih grickalica ukupno dnevno, svaka otprilike veličine šake; višak čeka sutra, umjesto oslanjanja na trenutnu snagu volje", "Ne uspijeva ako više od 2 dana u tjednu pojedeš više od 3 porcije", null,
      { lateral: { src: "Zrakoplovne tvrtke: ograničenje težine prtljage", dist: 3, drop: "Jesti kad god želiš bez ograničenja" } }),
    N9: node("D4", 2, 0, "Zaliha vode", "Nadopunjuj kao kvartovski dućan prije nego što roba nestane: u hladnjaku uvijek drži paket nezaslađene gazirane vode i mrežicu limuna, a novi paket kupi kad ostanu 3 limenke, da te želja nikad ne pošalje po sok ili zaslađenu kavu za van", "Ne uspijeva ako u 14 dana i dalje kupiš više od 3 zaslađena pića za van", null,
      { lateral: { src: "Trgovina: nadopuna prije rasprodaje", dist: 4, drop: "Kupovati piće tek kad ga poželiš" } }),
    N10: node("D2", 2, 0, "Limit troškova", "Ako zamjenske grickalice poput voća i nezaslađenog jogurta koštaju više nego dvostruko od onoga što si prije tjedno trošio na grickalice, odustat ćeš unutar mjesec dana i vratiti se starim grickalicama", "Stani ako u 14 dana zamjene koštaju više nego dvostruko od starog budžeta za grickalice", "Cijene voća jako variraju ovisno o sezoni",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Zamjene su preskupe da bi se održale" } }),
    N11: node("D4", 1, 0, "Bez akcija", "Ako hranu i pića kupuješ u paketima zbog besplatne dostave ili količinskog popusta, što više imaš kod kuće, to više svaki dan pojedeš", "Stani ako u 14 dana više od jednom kupiš hranu ili piće u paketima ili zbog praga za besplatnu dostavu", "Slatkiše koje ti poklone obitelj i prijatelji ne možeš kontrolirati",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Popusti te tjeraju da kupuješ sve više" } }),
    N12: node("D3", 0, 1, "Bez opreme", "Ako kreneš tek nakon što kupiš aparat za gaziranu vodu, sladila i sve vrste zamjena, potrošeni novac tjerat će te da jedeš ono što ne voliš, i odustat ćeš unutar 2 tjedna", "Stani ako u 14 dana kupiš više od 1 spravice ili zamjene koju zapravo ne koristiš", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Tjeraš se da ne bi propalo" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Ne možeš istodobno držati slatkiše izvan kuće i nastaviti ih jesti kao inače" },
    { type: "excludes", from: "N1", to: "N5", why: "Ako slatko dolazi samo iz cijelog voća, ne možeš zadržati omiljene slatkiše" },
    { type: "excludes", from: "N4", to: "N11", why: "Voće u kući ovisi o kupnji gajbice svaki tjedan; zabrana kupnje na veliko ruši taj plan zaliha" },
    { type: "excludes", from: "N2", to: "N7", why: "Ovaj put mijenja samo pića i ne dira obroke, što proturječi preradi slatko-kiselog umaka" },
    { type: "excludes", from: "N2", to: "N10", why: "Ovaj put mijenja samo pića i ne kupuje zamjenske grickalice; limit troškova za zamjene pripada drugom putu, pa odaberi jedan" },
    { type: "excludes", from: "N9", to: "N11", why: "Stalna zaliha gazirane vode znači kupnju u paketima, što se izravno sukobljava s nekupovanjem na veliko" },
    { type: "requires", from: "N1", to: "N8", why: "I voće ima šećera; čak i ako ti je jedino slatko, trebaš dnevni limit, inače previše ipak opterećuje tijelo" },
    { type: "requires", from: "N4", to: "N10", why: "Tjedne gajbice voća i jogurta se zbrajaju, pa trebaš limit troškova, inače novčanik prvi odustane" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Jedna stalna kupnja tjedno", v: "Odricanje od omiljenih grickalica", t: "Prva dva tjedna želja su teška", l: "Najviše tri porcije voća dnevno", x: "Nema spontanih odlazaka po desert" },
      fatal: "N10", thesis: "Slatko samo iz cijelog voća, u ograničenim količinama, a slatkiši izvan kuće", title: "Na voće · kuća bez slatkiša",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Stalna zaliha gazirane vode u hladnjaku", v: "15 minuta čekanja prije nego što popustiš želji", t: "Svaki tjedan mijenjaš samo malo", l: "Šećer u obrocima ostaje isti", x: "Kraj jedenju starih grickalica kao prije" },
      fatal: "N12", thesis: "Kad te uhvati želja, posegni za nezaslađenom gaziranom vodom, a nove okuse probaj u malim količinama prije nego što kupiš više", title: "Prvo pića · polako manje",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Brojanje porcija svaki put", v: "Slatkiši u kući i dalje mame", t: "Rezultati dolaze tek nakon dugo vremena", l: "Smanjivanje počiva samo na samokontroli", x: "Odustajanje od potpunog prelaska na voće" },
      fatal: "N11", thesis: "Nastavi jesti ono što voliš, ali u malim pakiranjima, s limitom porcija i prerađenim slatko-kiselim umakom", title: "Omiljeno ostaje · limit i novi umak",
    },
  },
  recommend: { key: "alpha", why: "Voće je prirodno slatko-kiselo, a kuća bez slatkiša traži najmanje snage volje" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Sva tvoja slatko-kisela zadovoljstva ovise o jednom voću ili piću", kill: "Ako ta jedna stvar nestane s polica ili ti dosadi, cijeli plan se raspada", label: "Samo jedna zamjena" },
};
