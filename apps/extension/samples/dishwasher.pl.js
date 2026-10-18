// 擴充功能生活題示範星系（波蘭文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Miejsce", D2: "Jak wybierać", D3: "Zakres przeróbek", D4: "Pojemność i naczynia" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druga strona doprowadza „${dims[dim]}” do przeciwnej skrajności`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_PL = {
  schema_version: "1.0",
  core: {
    decision: "Przerobić kuchnię pod zmywarkę czy wybrać taką, która zmieści się w kuchni, którą już masz?",
    metric: "Przez pierwsze 30 dni: zmywarka chodzi co najmniej 5 razy w tygodniu, a ręczne zmywanie zajmuje najwyżej 5 minut dziennie",
  },
  quadrants: {
    Q1: { scar: "Kupił zmywarkę, a i tak zmywa ręcznie", sacred: "Najpierw policz naczynia" },
    Q2: { scar: "W trakcie montażu wyszło, że wąż jest za krótki", sacred: "Zmierz, zanim kupisz" },
    Q3: { scar: "Kupił z internetowego rankingu i nie weszła", sacred: "Pożyczaj pomysły z innych dziedzin" },
    Q4: { scar: "Widział trzy zmywarki, które skończyły jako suszarki na naczynia", sacred: "Przemyśl, jak może się nie udać" },
  },
  nodes: {
    N1: node("D1", 0, 2, "W zabudowie", "Wymontuj szafkę 45 lub 60 cm obok zlewu i wbuduj tam zmywarkę, żeby nie zajmowała blatu ani nie blokowała przejścia", "Odpada, jeśli szerokość, wysokość lub głębokość szafki jest mniejsza niż podane wymiary do zabudowy", null),
    N2: node("D2", 0, 1, "Po posiłku", "Wybierz model z programem szybkim poniżej 1 godziny i włączaj go po każdym posiłku, żeby brudne naczynia nigdy nie stały w zlewie przez noc", "Odpada, jeśli w ciągu 14 dni naczynia po programie szybkim są tłuste więcej niż 2 razy", "Programy szybkie zwykle pomijają suszenie, więc naczynia schną same"),
    N3: node("D1", 1, 0, "Obok zlewu", "Postaw zmywarkę do 1 metra od zlewu i podłącz wąż odpływowy prosto do syfonu, bez kucia ścian i nowej hydrauliki", "Odpada, jeśli dołączony wąż odpływowy nie sięga do zlewu i potrzebne jest przedłużenie", null),
    N4: node("D4", 0, 2, "Duża na rodzinę", "Przy 3 lub więcej domownikach bierz model na 12+ kompletów, żeby garnki i talerze weszły w jednym cyklu zamiast w dwóch", "Odpada, jeśli w więcej niż 2 dni z 14 naczynia z garnkami nie mieszczą się w jednym cyklu", null),
    N5: node("D3", 2, 0, "Mini na blat", "Kup mini zmywarkę nablatową na najwyżej 8 kompletów: bez wymontowywania szafek, bez przeróbek hydrauliki, a przy przeprowadzce zabierasz ją ze sobą", "Odpada, jeśli w więcej niż 3 dni z 14 trzeba dwóch cykli, żeby wszystko umyć", "Zajmuje spory kawałek blatu roboczego"),
    N6: node("D3", 1, 2, "Najpierw test", "Kup model, który może stać wolno albo w zabudowie, trzymaj go przy zlewie pełne 30 dni i dopiero wtedy zdecyduj o wymontowaniu szafki, zamiast wyrywać ją pierwszego dnia", "Odpada, jeśli w ciągu 30 dni testu zmywarka blokuje przejście albo szufladę", null),
    N7: node("D3", 2, 1, "Własny zbiornik", "Jak kamper z własnym zbiornikiem na wodę: wybierz model nablatowy napełniany ręcznie, bez podłączania do kranu i bez przeróbek hydrauliki", "Odpada, jeśli w którymkolwiek tygodniu 2 razy lub więcej odpuścisz i zmyjesz ręcznie, bo nie chciało ci się nalewać wody", "Nalewanie wody jest bardziej uciążliwe, niż się wydaje",
      { lateral: { src: "Kemping: wbudowany zbiornik na wodę", dist: 2, drop: "Stałe podłączenie do kranu" } }),
    N8: node("D2", 1, 0, "Najpierw zmierz", "Jak lista kontrolna pilota przed startem: przed zamówieniem zmierz szerokość, głębokość i wysokość, potem sprawdź gniazdko i odpływ; jeśli brakuje którejś z 5 pozycji, nie zamawiaj", "Odpada, jeśli coś się nie zgadza albo po dostawie nie da się jej zamontować", null,
      { lateral: { src: "Lotnictwo: lista kontrolna", dist: 3, drop: "Zamawianie na oko" } }),
    N9: node("D4", 2, 0, "Zmywarkoodporne", "Jak restauracja, która używa tylko naczyń odpornych na zmywarkę: wymień każdy garnek i talerz z oznaczeniem „nie myć w zmywarce”, żeby nic nie zostawało do ręcznego zmywania", "Odpada, jeśli w ciągu 14 dni po wymianie nadal myjesz ręcznie więcej niż 3 rzeczy dziennie", null,
      { lateral: { src: "Gastronomia: zastawa profesjonalna", dist: 4, drop: "Zbieranina starych naczyń w domu" } }),
    N10: node("D2", 2, 0, "Bez połówek", "Zmywarka włączona w mniej niż połowie pełna zużywa prawie tyle wody i prądu co pełna, więc umycie każdego naczynia kosztuje ponad dwa razy więcej", "Przed zamówieniem notuj naczynia przez 7 dni; jeśli średnio wychodzi mniej niż 6 kompletów dziennie, przerzuć się na mini", "Naczynia zaczynają śmierdzieć, zanim uzbiera się pełny wsad",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Duża zmywarka chodząca w połowie pusta się nie opłaca" } }),
    N11: node("D4", 1, 0, "Bez garnków", "Jeśli dla wygody upychasz woki i duże garnki, mini nie zmieści naczyń w jednym cyklu i znów kończysz przy zlewie", "Porzuć ten plan, jeśli w ciągu 14 dni upychanie garnków więcej niż 2 razy wymusi drugi cykl", "Nie wszyscy domownicy będą trzymać się zasady",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Przeładowywanie zmywarki dla wygody" } }),
    N12: node("D3", 0, 1, "Bez remontu", "Jeśli montaż zmywarki rozkręci się w remont całej kuchni, to gdy prace ruszą i pieniądze pójdą, nie ma już odwrotu", "Nie zaczynaj, jeśli wycena przed wymontowaniem szafki przekracza 2x cenę zmywarki", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Gdy prace ruszą, nie ma odwrotu" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Zmywarka na 12+ kompletów nie zmieści się na blacie, więc albo ona, albo mini nablatowa" },
    { type: "excludes", from: "N1", to: "N5", why: "Skoro zmywarka siedzi w zabudowie, nie kupisz jeszcze mini na blat; albo jedno, albo drugie" },
    { type: "excludes", from: "N4", to: "N11", why: "Cały sens większej zmywarki dla rodziny to mycie także garnków, co przeczy zasadzie trzymania ich z daleka" },
    { type: "excludes", from: "N2", to: "N7", why: "Zmywanie po każdym posiłku oznacza ręczne nalewanie wody trzy razy dziennie, a tego trudno się trzymać" },
    { type: "excludes", from: "N2", to: "N10", why: "Zmywanie po każdym posiłku to często mniej niż pół wsadu, co przeczy zasadzie bez połówek" },
    { type: "excludes", from: "N9", to: "N11", why: "Garnki i talerze zmywarkoodporne kupuje się po to, żeby je tam wkładać, co przeczy zasadzie bez garnków" },
    { type: "requires", from: "N1", to: "N8", why: "Pomyłka o 1 cm i zmywarka nie wjedzie w szafkę, więc przed zamówieniem trzeba wszystko zmierzyć" },
    { type: "requires", from: "N4", to: "N10", why: "Duża zmywarka w połowie pusta i tak zużywa wodę i prąd jak na pełny wsad, więc trzymaj się zasady bez połówek" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Demontaż szafki i robocizna montażu", v: "O jedną szafkę mniej na schowek", t: "Czekanie na fachowca do pomiaru i montażu", l: "Czekanie z włączeniem na pół wsadu", x: "Rezygnacja z mini na blat" },
      fatal: "N10", thesis: "Zmierz szafkę, wbuduj dużą zmywarkę i włączaj ją dopiero, gdy jest co najmniej w połowie pełna", title: "Duża w zabudowie, raz a dobrze",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Nowe garnki i naczynia plus woda i prąd po każdym posiłku", v: "Zajmuje przejście w czasie testu", t: "Szafka wylatuje dopiero po 30 dniach", l: "Naczynia po szybkim programie schną same", x: "Rezygnacja z mini na blat" },
      fatal: "N12", thesis: "Szybki program po każdym posiłku; trzymaj zmywarkę przy zlewie, aż się sprawdzi, potem ją wbuduj", title: "Szybko co dzień, test przed zabudową",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Ręczne nalewanie wody przy każdym cyklu", v: "Zajmuje spory kawałek blatu roboczego", t: "Garnki codziennie myte ręcznie", l: "Najwyżej 8 kompletów", x: "Rezygnacja z zabudowy i dużej pojemności" },
      fatal: "N11", thesis: "Mini nablatowa napełniana samodzielnie; garnki zostają do ręcznego zmywania", title: "Mini na blat, bez hydrauliki",
    },
  },
  recommend: { key: "alpha", why: "W domu na 3 lub więcej osób jedna duża zmywarka ogarnia naczynia z całego dnia w jednym cyklu" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Naczynia całej rodziny zależą od tej jednej maszyny; gdy się zepsuje, jedynym zapasem jest ręczne zmywanie", kill: "Porzuć ten plan, jeśli naprawa trwa dłużej niż 7 dni i rodzina wraca do ręcznego zmywania", label: "Jedna maszyna" },
};
