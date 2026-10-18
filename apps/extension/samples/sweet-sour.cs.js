// 擴充功能內建生活題示範星系（捷克文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Odkud sladkost", D2: "Kam s chutí na sladké", D3: "Jak velká změna", D4: "Co máš doma" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Opačný názor dovádí „${dims[dim]}“ do druhého extrému`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_CS = {
  schema_version: "1.0",
  core: {
    decision: "Nahradit všechno sladké celým ovocem, nebo dál jíst, co máš rád, jen méně?",
    metric: "Během 30 dnů nejvýš 3 sladké svačiny a nápoje dohromady za týden (zapisované v telefonu pro kontrolu)",
  },
  quadrants: {
    Q1: { scar: "Snědl celý sáček sušeného ovoce v domnění, že je to zdravá svačina", sacred: "Sladkost jen z celého ovoce" },
    Q2: { scar: "Třikrát se vzdal cukru a pokaždé povolil ve druhém týdnu", sacred: "Platí jen to, co se dá vydržet" },
    Q3: { scar: "Okopíroval jídelníček s minimem sacharidů a po třech dnech ho měl plné zuby", sacred: "Změň metodu, ne chuť" },
    Q4: { scar: "Viděl příliš mnoho lidí vzdát se cukru a hned zase sklouznout zpátky", sacred: "Nastav si pravidla, nespoléhej na vůli" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Celé ovoce", "Kdykoli máš chuť na sladké, jez jen celé čerstvé ovoce, třeba kiwi, ananas, borůvky nebo pomeranče; džusy, sušené a kandované ovoce se nepočítají", "Selže, pokud si do 14 dnů víc než 3 dny koupíš dezert, abys zahnal chuť", null),
    N2: node("D2", 0, 1, "Perlivá voda", "Když přijde chuť, vypij nejdřív sklenici neslazené perlivé vody s citronem nebo marakujou; pokud máš po 15 minutách pořád chuť na sladké, nech si to na po dalším jídle. Mění se jen nápoje: jídla zůstávají stejná a náhradní svačiny nekupuješ", "Selže, pokud do 14 dnů máš po 15minutovém čekání pořád chuť na sladké ve víc než polovině případů", "Nápoj nezažene chuť něco kousat"),
    N3: node("D1", 1, 0, "Jen po jídle", "Sladkokyselé svačiny a ovoce jez jen do 1 hodiny po jídle; nic nalačno a nic během 3 hodin před spaním", "Selže, pokud po 14 dnech pořád víc než 3 večery hledáš svačinu před spaním", null),
    N4: node("D4", 0, 2, "Nula sladkostí", "Nakupuj jednou týdně: sezónní ovoce po bednách a tolik bílého jogurtu bez cukru, kolik na týden stačí; to jsou jediné svačiny doma a sladké pochutiny domů nikdy nenosíš", "Selže, pokud do 14 dnů nastane týden, kdy si venku koupíš sladkosti víc než 3×", null),
    N5: node("D3", 2, 0, "Poloviční dávky", "Dál jez sladkokyselé pochutiny, které máš rád, jen méně: přejdi na malá balení a denní množství sniž na polovinu, bez jakýchkoli náhrad", "Selže, pokud od 2. týdne víc než 2 dny v týdnu sníš víc než polovinu dřívějšího množství", "Často otevřeš druhé balení hned po prvním"),
    N6: node("D3", 1, 2, "Testuj nápoje", "Každou novou příchuť neslazeného nápoje kup v nejmenším balení a pij ji 3 dny po sobě; celé balení kupuj, jen když ti chutná, nikdy nedělej zásoby najednou", "Selže, pokud je příchuť koupená po testu ve velkém balení po 14 dnech pořád víc než z poloviny plná", null),
    N7: node("D3", 2, 1, "Vyměň omáčku", "Jako když vyměníš obal na mobil místo mobilu: nech hlavní suroviny kuřete nebo ryby na sladkokyselo, ale omáčku si udělej sám z rajčat, ananasu a octa, s polovinou obvyklého cukru", "Selže, pokud po 2 pokusech s novou omáčkou během 14 dnů všichni doma řeknou, že nechutná", "V restauraci ani u jídla s sebou omáčku nezměníš",
      { lateral: { src: "Technika: výměna obalu na mobil", dist: 2, drop: "Úplně vyškrtnout jídlo z jídelníčku" } }),
    N8: node("D2", 1, 0, "Nejvýš 3 porce", "Jako limit zavazadel v letadle: nejvýš 3 porce ovoce a sladkokyselých svačin dohromady denně, každá zhruba velikosti pěsti; co je navíc, počká na zítřek, místo abys spoléhal na momentální vůli", "Selže, pokud víc než 2 dny v týdnu sníš přes 3 porce", null,
      { lateral: { src: "Letecké společnosti: váhový limit zavazadel", dist: 3, drop: "Jíst kdykoli bez omezení" } }),
    N9: node("D4", 2, 0, "Zásoba vody", "Doplňuj jako večerka, než zboží dojde: v lednici měj vždy balení neslazené perlivé vody a síťku citronů a nové balení kup, když zbývají 3 plechovky, aby tě chuť nikdy nevyhnala pro limonádu nebo slazenou kávu s sebou", "Selže, pokud si do 14 dnů pořád koupíš víc než 3 slazené nápoje s sebou", null,
      { lateral: { src: "Maloobchod: doplnit dřív, než se vyprodá", dist: 4, drop: "Kupovat pití, až když máš chuť" } }),
    N10: node("D2", 2, 0, "Strop nákladů", "Pokud náhradní svačiny jako ovoce a neslazený jogurt stojí víc než dvojnásobek toho, co jsi dřív týdně utratil za mlsání, do měsíce to vzdáš a vrátíš se ke starým svačinám", "Stop, pokud do 14 dnů náhrady stojí víc než dvojnásobek dřívějšího rozpočtu na svačiny", "Ceny ovoce se během sezóny hodně mění",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Náhrady jsou na dlouhodobé udržení moc drahé" } }),
    N11: node("D4", 1, 0, "Žádné akce", "Když kupuješ jídlo a pití po kartonech kvůli dopravě zdarma nebo množstevní slevě, čím víc toho máš doma, tím víc toho každý den sníš", "Stop, pokud si do 14 dnů víc než jednou koupíš jídlo nebo pití po kartonech nebo kvůli dopravě zdarma", "Sladkosti darované rodinou a přáteli neovlivníš",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Slevy tě nutí kupovat čím dál víc" } }),
    N12: node("D3", 0, 1, "Bez vybavení", "Pokud začneš až po nákupu výrobníku sody, sladidel a všech možných náhrad, utracené peníze tě budou nutit jíst věci, které ti nechutnají, a do 2 týdnů to vzdáš", "Stop, pokud si do 14 dnů koupíš víc než 1 vychytávku nebo náhradu, kterou pak nepoužíváš", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Nutíš se do toho, aby to nepřišlo nazmar" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Nemít sladké pochutiny doma a zároveň je jíst jako obvykle nejde" },
    { type: "excludes", from: "N1", to: "N5", why: "Když má sladkost pocházet jen z celého ovoce, oblíbené sladké pochutiny si nenecháš" },
    { type: "excludes", from: "N4", to: "N11", why: "Ovoce doma stojí na nákupu bedny každý týden; zákaz nákupů ve velkém tenhle plán zásob rozbije" },
    { type: "excludes", from: "N2", to: "N7", why: "Tahle cesta mění jen nápoje a jídla nechává být, což odporuje předělávání sladkokyselé omáčky" },
    { type: "excludes", from: "N2", to: "N10", why: "Tahle cesta mění jen nápoje a nekupuje náhradní svačiny, takže strop výdajů za náhrady tu nemá smysl; vyber si jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Stálá zásoba perlivé vody znamená kupovat ji po kartonech, což se přímo bije se zákazem nákupů ve velkém" },
    { type: "requires", from: "N1", to: "N8", why: "I ovoce obsahuje cukr; i když je to tvá jediná sladkost, potřebuješ denní limit, jinak přejídání stejně zatíží tělo" },
    { type: "requires", from: "N4", to: "N10", why: "Týdenní bedny ovoce a jogurtu se nasčítají, takže potřebuješ strop výdajů, jinak to jako první vzdá peněženka" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Jeden pevný nákup týdně", v: "Vzdát se oblíbených pochutin", t: "První dva týdny chutí jsou těžké", l: "Nejvýš tři porce ovoce denně", x: "Žádné spontánní výpravy pro dezert" },
      fatal: "N10", thesis: "Sladké jen z celého ovoce, v omezeném množství, a sladké pochutiny mimo domov", title: "Na ovoce · doma nic sladkého",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Stálá zásoba perlivé vody v lednici", v: "15 minut čekání, než chuti podlehneš", t: "Každý týden měníš jen trochu", l: "Cukr v jídlech zůstává stejný", x: "Konec s jedením starých pochutin jako dřív" },
      fatal: "N12", thesis: "Při chuti na sladké sáhni po neslazené perlivé vodě a nové příchutě zkoušej v malém, než koupíš víc", title: "Nejdřív nápoje · pomalu méně",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Pokaždé počítat porce", v: "Sladkosti doma pořád lákají", t: "Výsledky přijdou až po dlouhé době", l: "Omezování stojí jen na sebekázni", x: "Vzdát se úplného přechodu na ovoce" },
      fatal: "N11", thesis: "Dál jez, co máš rád, ale v malých baleních, s limitem porcí a s předělanou sladkokyselou omáčkou", title: "Oblíbené zůstávají · limit a nová omáčka",
    },
  },
  recommend: { key: "alpha", why: "Ovoce je přirozeně sladkokyselé a domov bez sladkých pochutin vyžaduje nejméně vůle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Celá tvoje chuť na sladkokyselé visí na jednom ovoci nebo nápoji", kill: "Když se ta jedna věc vyprodá nebo se ti přejí, celý plán se rozpadne", label: "Jediná náhrada" },
};
