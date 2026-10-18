// 擴充功能生活題示範星系（克羅埃西亞文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Smještaj", D2: "Kako birati", D3: "Opseg preinaka", D4: "Kapacitet i posuđe" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druga strana tjera „${dims[dim]}” u suprotnu krajnost`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_HR = {
  schema_version: "1.0",
  core: {
    decision: "Preurediti kuhinju zbog perilice posuđa ili odabrati onu koja stane u kuhinju koju već imate?",
    metric: "U prvih 30 dana: perilica radi barem 5 puta tjedno, a ručno pranje posuđa traje najviše 5 minuta dnevno",
  },
  quadrants: {
    Q1: { scar: "Kupio perilicu, a i dalje pere ručno", sacred: "Prvo prebroji posuđe" },
    Q2: { scar: "Usred montaže shvatio da je crijevo prekratko", sacred: "Izmjeri prije kupnje" },
    Q3: { scar: "Kupio prema internetskoj listi najboljih i nije stala", sacred: "Posuđuj ideje iz drugih područja" },
    Q4: { scar: "Vidio tri perilice koje su završile kao cjedilo za posuđe", sacred: "Promisli kako bi moglo propasti" },
  },
  nodes: {
    N1: node("D1", 0, 2, "U element", "Izvadi element od 45 ili 60 cm pokraj sudopera i ugradi perilicu, tako da ne zauzima radnu plohu i ne blokira prolaz", "Ne odgovara ako je širina, visina ili dubina elementa manja od navedenih ugradbenih mjera perilice", null),
    N2: node("D2", 0, 1, "Nakon obroka", "Odaberi model s brzim programom kraćim od 1 sata i pokreni ga nakon svakog obroka, da prljavo posuđe nikad ne prenoći u sudoperu", "Ne odgovara ako je posuđe nakon brzog programa masno više od 2 puta u 14 dana", "Brzi programi obično preskaču sušenje, pa se posuđe suši samo"),
    N3: node("D1", 1, 0, "Kraj sudopera", "Postavi perilicu do 1 metra od sudopera i spoji odvodno crijevo ravno na sifon sudopera, bez bušenja zidova i nove instalacije", "Ne odgovara ako priloženo odvodno crijevo ne doseže do sudopera i treba produžetak", null),
    N4: node("D4", 0, 2, "Za obitelj", "Uz 3 ili više ukućana uzmi model za 12+ kompleta posuđa, da lonci i tanjuri stanu u jedno pranje umjesto dva", "Ne odgovara ako u više od 2 dana od 14 posuđe s loncima ne stane u jedno pranje", null),
    N5: node("D3", 2, 0, "Mini na pult", "Kupi malu stolnu perilicu za najviše 8 kompleta: bez vađenja elemenata, bez preinaka instalacija, a pri selidbi je nosiš sa sobom", "Ne odgovara ako u više od 3 dana od 14 trebaju 2 pranja da sve bude čisto", "Zauzima dobar komad radne plohe"),
    N6: node("D3", 1, 2, "Prvo probaj", "Kupi model koji može stajati samostalno ili biti ugradbeni, drži ga pokraj sudopera punih 30 dana i tek onda odluči o vađenju elementa, umjesto da ga čupaš prvi dan", "Ne odgovara ako tijekom 30 dana probe perilica blokira prolaz ili ladicu", null),
    N7: node("D3", 2, 1, "Svoj spremnik", "Kao kamper s vlastitim spremnikom vode: odaberi stolni model koji puniš ručno, bez spajanja na slavinu i bez preinaka instalacija", "Ne odgovara ako je u bilo kojem tjednu 2 ili više puta preskočiš i opereš ručno jer ti se nije dalo puniti vodu", "Punjenje vode je napornije nego što se čini",
      { lateral: { src: "Kampiranje: ugrađeni spremnik vode", dist: 2, drop: "Trajni priključak na slavinu" } }),
    N8: node("D2", 1, 0, "Prvo izmjeri", "Kao pilotova kontrolna lista prije leta: prije narudžbe izmjeri širinu, dubinu i visinu, zatim provjeri utičnicu i odvod; ako nedostaje bilo koja od 5 stavki, ne naručuj", "Ne odgovara ako se nešto ne poklapa ili se nakon dostave ne može ugraditi", null,
      { lateral: { src: "Zrakoplovstvo: kontrolna lista prije leta", dist: 3, drop: "Naručivanje odokativno" } }),
    N9: node("D4", 2, 0, "Posuđe za stroj", "Kao restoran koji koristi samo posuđe otporno na perilicu: zamijeni svaki lonac i tanjur s oznakom da nije za perilicu, tako da ništa ne ostane za ručno pranje", "Ne odgovara ako 14 dana nakon zamjene i dalje ručno pereš više od 3 komada dnevno", null,
      { lateral: { src: "Ugostiteljstvo: profesionalno posuđe", dist: 4, drop: "Šarenilo starog posuđa kod kuće" } }),
    N10: node("D2", 2, 0, "Ne poluprazna", "Ako je pokreneš manje od pola punu, troši gotovo jednako vode i struje kao puna, pa pranje svakog komada stoji više nego dvostruko", "Prije narudžbe 7 dana bilježi posuđe; ako u prosjeku izađe manje od 6 kompleta dnevno, prijeđi na mini", "Dok se skupi puno punjenje, posuđe počne smrdjeti",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Velika perilica pokrenuta poluprazna ne isplati se" } }),
    N11: node("D4", 1, 0, "Bez lonaca", "Ako iz komocije trpaš wokove i velike lonce, mini ne može primiti posuđe u jedno pranje i opet završiš na ručnom pranju", "Odustani od ovog plana ako u 14 dana trpanje lonaca više od 2 puta natjera na drugo pranje", "Neće se svi ukućani držati pravila",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Pretrpavanje perilice iz komocije" } }),
    N12: node("D3", 0, 1, "Bez preuređenja", "Ako se ugradnja perilice pretvori u preuređenje cijele kuhinje, jednom kad radovi krenu i novac ode, moraš ići do kraja", "Ne počinji ako je ponuda prije vađenja elementa veća od 2x cijene perilice", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Kad radovi krenu, nema povratka" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Perilica za 12+ kompleta ne stane na pult, pa je ili ona ili stolna mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Kad je perilica ugrađena u element, nećeš kupiti još i mini za pult; ili jedno ili drugo" },
    { type: "excludes", from: "N4", to: "N11", why: "Smisao veće perilice za obitelj je pranje i lonaca, što je u suprotnosti s držanjem lonaca vani" },
    { type: "excludes", from: "N2", to: "N7", why: "Pranje nakon svakog obroka znači ručno punjenje vode tri puta dnevno, a to je teško izdržati" },
    { type: "excludes", from: "N2", to: "N10", why: "Pranje nakon svakog obroka često znači manje od pola punjenja, što proturječi pravilu ne poluprazna" },
    { type: "excludes", from: "N9", to: "N11", why: "Lonce i tanjure otporne na perilicu kupuješ upravo da ih staviš unutra, što proturječi pravilu bez lonaca" },
    { type: "requires", from: "N1", to: "N8", why: "Greška od 1 cm i perilica neće ući u element, pa prije narudžbe sve treba izmjeriti" },
    { type: "requires", from: "N4", to: "N10", why: "Velika perilica pokrenuta poluprazna i dalje troši vodu i struju kao puna, pa se drži pravila ne poluprazna" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Vađenje elementa i rad na ugradnji", v: "Jedan element manje za spremanje", t: "Čekanje majstora za mjerenje i ugradnju", l: "Pokretanje tek od pola punjenja", x: "Odustajanje od mini perilice za pult" },
      fatal: "N10", thesis: "Izmjeri element, ugradi veliku perilicu i pokreći je tek kad je barem pola puna", title: "Velika ugradbena, jednom zauvijek",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Novi lonci i posuđe plus voda i struja nakon svakog obroka", v: "Zauzima prolaz tijekom probe", t: "Element se vadi tek nakon 30 dana", l: "Posuđe se nakon brzog programa suši samo", x: "Odustajanje od mini perilice za pult" },
      fatal: "N12", thesis: "Brzo pranje nakon svakog obroka; drži perilicu kraj sudopera dok se ne pokaže, a onda je ugradi", title: "Brzo svaki dan, proba prije ugradnje",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Ručno punjenje vode za svako pranje", v: "Zauzima dobar komad radne plohe", t: "Lonci se svaki dan peru ručno", l: "Najviše 8 kompleta posuđa", x: "Odustajanje od ugradnje i velikog kapaciteta" },
      fatal: "N11", thesis: "Stolna mini koju sam puniš; lonci ostaju za ručno pranje", title: "Mini na pult, bez instalacija",
    },
  },
  recommend: { key: "alpha", why: "U kućanstvu s 3 ili više osoba jedna velika perilica opere posuđe cijelog dana u jednom pranju" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Posuđe cijele obitelji ovisi o tom jednom stroju; ako se pokvari, jedina rezerva je ručno pranje", kill: "Odustani od ovog plana ako popravak traje dulje od 7 dana i obitelj se vrati ručnom pranju", label: "Jedan stroj" },
};
