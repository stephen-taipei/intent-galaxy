// 擴充功能內建生活題示範星系（波蘭文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Skąd słodycz", D2: "Ujście dla zachcianek", D3: "Skala zmiany", D4: "Co trzymasz w domu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Przeciwny pogląd — ${dims[dim]}: drugi biegun`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_PL = {
  schema_version: "1.0",
  core: {
    decision: "Zamienić wszystkie słodkości na całe owoce, czy dalej jeść to, co lubisz, tylko mniej?",
    metric: "Przez 30 dni najwyżej 3 słodkie przekąski i napoje łącznie na tydzień (zapisywane w telefonie do kontroli)",
  },
  quadrants: {
    Q1: { scar: "Zjadł całą paczkę suszonych owoców, myśląc, że to zdrowa przekąska", sacred: "Słodycz tylko z całych owoców" },
    Q2: { scar: "Trzy razy rzucał cukier i za każdym razem pękał w drugim tygodniu", sacred: "Liczy się tylko to, czego da się trzymać" },
    Q3: { scar: "Skopiował jadłospis low-carb i miał go dość po trzech dniach", sacred: "Zmień metodę, nie smak" },
    Q4: { scar: "Widział zbyt wielu, którzy rzucili cukier i szybko do niego wrócili", sacred: "Zasady wygrywają z silną wolą" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Całe owoce", "Gdy masz ochotę na coś słodkiego, jedz tylko całe świeże owoce, jak kiwi, ananas, borówki czy pomarańcze; soki, suszone i kandyzowane owoce się nie liczą", "Porażka, jeśli w ciągu 14 dni w więcej niż 3 dni kupisz deser, żeby zaspokoić zachciankę", null),
    N2: node("D2", 0, 1, "Woda gazowana", "Gdy przyjdzie zachcianka, najpierw wypij szklankę niesłodzonej wody gazowanej z cytryną lub marakują; jeśli po 15 minutach nadal chcesz coś słodkiego, zostaw to na po następnym posiłku. Zmieniają się tylko napoje: posiłki zostają takie same i nie kupujesz zamienników przekąsek", "Porażka, jeśli w ciągu 14 dni po 15 minutach czekania wciąż masz ochotę na słodkie częściej niż w połowie przypadków", "Napój nie zaspokoi potrzeby, żeby coś pogryźć"),
    N3: node("D1", 1, 0, "Po posiłku", "Słodko-kwaśne przekąski i owoce jedz tylko do 1 godziny po posiłku; nic na pusty żołądek i nic w ciągu 3 godzin przed snem", "Porażka, jeśli po 14 dniach nadal szukasz przekąsek przed snem w więcej niż 3 wieczory", null),
    N4: node("D4", 0, 2, "Zero słodyczy", "Zakupy raz w tygodniu: owoce sezonowe na skrzynki i tyle jogurtu naturalnego bez cukru, ile starczy na tydzień; to jedyne przekąski w domu, a słodkie przekąski nigdy nie trafiają do domu", "Porażka, jeśli w ciągu 14 dni zdarzy się tydzień, w którym kupisz słodycze na mieście więcej niż 3 razy", null),
    N5: node("D3", 2, 0, "Pół porcji", "Dalej jedz słodko-kwaśne przekąski, które lubisz, tylko mniej: przejdź na małe opakowania i zmniejsz dzienną ilość o połowę, bez żadnych zamienników", "Porażka, jeśli od 2. tygodnia w więcej niż 2 dni w tygodniu zjesz więcej niż połowę dawnej ilości", "Często otwierasz drugie opakowanie zaraz po pierwszym"),
    N6: node("D3", 1, 2, "Testuj napoje", "Każdy nowy smak niesłodzonego napoju kup w najmniejszym opakowaniu i pij 3 dni z rzędu; zgrzewkę kupuj dopiero, gdy ci smakuje, nigdy nie rób zapasów na raz", "Porażka, jeśli smak kupiony na zgrzewkę po teście po 14 dniach wciąż jest w ponad połowie pełny", null),
    N7: node("D3", 2, 1, "Zmień sos", "Jak zmiana etui zamiast telefonu: zostaw główne składniki kurczaka czy ryby w sosie słodko-kwaśnym, ale sos zrób sam z pomidorów, ananasa i octu, z połową zwykłego cukru", "Porażka, jeśli po 2 próbach z nowym sosem w ciągu 14 dni wszyscy w domu mówią, że nie smakuje", "W restauracji ani na dowóz sosu nie zmienisz",
      { lateral: { src: "Technologia: zmiana etui telefonu", dist: 2, drop: "Całkowite skreślenie dania z menu" } }),
    N8: node("D2", 1, 0, "Max 3 porcje", "Jak limit bagażu w samolocie: najwyżej 3 porcje owoców i słodko-kwaśnych przekąsek łącznie dziennie, każda mniej więcej wielkości pięści; nadwyżka czeka do jutra, zamiast polegać na silnej woli w danej chwili", "Porażka, jeśli w więcej niż 2 dni w tygodniu zjesz ponad 3 porcje", null,
      { lateral: { src: "Linie lotnicze: limit wagi bagażu", dist: 3, drop: "Jedzenie bez limitu, kiedy chcesz" } }),
    N9: node("D4", 2, 0, "Zapas wody", "Uzupełniaj jak sklep osiedlowy, zanim towar się skończy: zawsze trzymaj w lodówce zgrzewkę niesłodzonej wody gazowanej i siatkę cytryn, a nową zgrzewkę kupuj przy 3 ostatnich puszkach, żeby zachcianka nigdy nie wygnała cię po colę czy słodką kawę na wynos", "Porażka, jeśli w ciągu 14 dni nadal kupisz więcej niż 3 słodzone napoje na wynos", null,
      { lateral: { src: "Handel: uzupełnianie przed wyprzedaniem", dist: 4, drop: "Kupowanie napoju dopiero, gdy masz ochotę" } }),
    N10: node("D2", 2, 0, "Limit kosztów", "Jeśli zamienniki, jak owoce i niesłodzony jogurt, kosztują ponad dwa razy więcej niż twoje dawne tygodniowe wydatki na przekąski, w ciągu miesiąca się poddasz i wrócisz do starych przekąsek", "Stop, jeśli w ciągu 14 dni zamienniki kosztują ponad dwa razy więcej niż dawny budżet na przekąski", "Ceny owoców mocno skaczą w zależności od sezonu",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Zamienniki są zbyt drogie, by przy nich wytrwać" } }),
    N11: node("D4", 1, 0, "Bez promocji", "Jeśli kupujesz jedzenie i napoje na zgrzewki, żeby złapać darmową dostawę albo rabat ilościowy, to im więcej masz w domu, tym więcej codziennie zjadasz", "Stop, jeśli w ciągu 14 dni więcej niż raz kupisz jedzenie lub napoje na zgrzewki albo pod próg darmowej dostawy", "Słodyczy w prezencie od rodziny i znajomych nie kontrolujesz",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Promocje każą kupować coraz więcej" } }),
    N12: node("D3", 0, 1, "Bez gadżetów", "Jeśli zaczniesz dopiero po kupieniu saturatora, słodzików i wszelkich zamienników, wydane pieniądze będą cię zmuszać do jedzenia rzeczy, których nie lubisz, i rzucisz to w ciągu 2 tygodni", "Stop, jeśli w ciągu 14 dni kupisz więcej niż 1 gadżet lub zamiennik, którego faktycznie nie używasz", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Zmuszasz się, żeby nic się nie zmarnowało" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Nie da się jednocześnie trzymać słodkich przekąsek poza domem i dalej jeść ich jak zwykle" },
    { type: "excludes", from: "N1", to: "N5", why: "Jeśli słodycz ma pochodzić tylko z całych owoców, nie zostawisz sobie ulubionych słodkich przekąsek" },
    { type: "excludes", from: "N4", to: "N11", why: "Owoce w domu opierają się na kupowaniu skrzynki co tydzień; zakaz kupowania hurtem rozwala ten plan zapasów" },
    { type: "excludes", from: "N2", to: "N7", why: "Ta ścieżka zmienia tylko napoje i nie rusza posiłków, co przeczy przerabianiu sosu słodko-kwaśnego" },
    { type: "excludes", from: "N2", to: "N10", why: "Ta ścieżka zmienia tylko napoje i nie kupuje zamienników przekąsek; limit wydatków na zamienniki należy do innej ścieżki, więc wybierz jedną" },
    { type: "excludes", from: "N9", to: "N11", why: "Stały zapas wody gazowanej oznacza kupowanie jej na zgrzewki, co wprost kłóci się z niekupowaniem hurtem" },
    { type: "requires", from: "N1", to: "N8", why: "Owoce też mają cukier; nawet jeśli to twoja jedyna słodycz, potrzebujesz dziennego limitu, bo nadmiar i tak obciąża organizm" },
    { type: "requires", from: "N4", to: "N10", why: "Cotygodniowe skrzynki owoców i jogurtu się sumują, więc potrzebujesz limitu wydatków, inaczej portfel podda się pierwszy" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Jedne stałe zakupy w tygodniu", v: "Rezygnacja z ulubionych przekąsek", t: "Pierwsze dwa tygodnie zachcianek są ciężkie", l: "Najwyżej trzy porcje owoców dziennie", x: "Żadnych spontanicznych wypadów po deser" },
      fatal: "N10", thesis: "Słodycz tylko z całych owoców, w ograniczonych ilościach, a słodkie przekąski poza domem", title: "Na owoce · zero słodyczy w domu",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Stały zapas wody gazowanej w lodówce", v: "15 minut czekania, zanim ulegniesz zachciance", t: "Co tydzień zmieniasz tylko trochę", l: "Cukier w posiłkach zostaje bez zmian", x: "Koniec z jedzeniem starych przekąsek jak dawniej" },
      fatal: "N12", thesis: "Przy zachciance sięgaj po niesłodzoną wodę gazowaną, a nowe smaki testuj w małych ilościach, zanim kupisz więcej", title: "Najpierw napoje · powoli mniej",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Liczenie porcji za każdym razem", v: "Słodycze w domu wciąż kuszą", t: "Na efekty trzeba długo czekać", l: "Ograniczanie opiera się wyłącznie na samokontroli", x: "Rezygnacja z pełnego przejścia na owoce" },
      fatal: "N11", thesis: "Dalej jedz to, co lubisz, ale w małych opakowaniach, z limitem porcji i z przerobionym sosem słodko-kwaśnym", title: "Ulubione zostają · limit i nowy sos",
    },
  },
  recommend: { key: "alpha", why: "Owoce są naturalnie słodko-kwaśne, a dom bez słodkich przekąsek wymaga najmniej silnej woli" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Cała twoja słodko-kwaśna przyjemność opiera się na jednym owocu albo napoju", kill: "Jeśli tego jednego zabraknie w sklepie albo ci się przeje, cały plan się sypie", label: "Jeden zamiennik" },
};
