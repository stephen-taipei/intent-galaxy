// 內建示範星系（IntentAnalysisResponse v1.0，波蘭文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Granice warstw", D2: "Sposób wyrażania różnic", D3: "Zakres personalizacji", D4: "Kompozycja motywów" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Kontrstanowisko — ${dims[dim]}: przeciwna skrajność`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_PL = {
  schema_version: "1.0",
  core: {
    decision: "Czy każda marka ma forkować własne komponenty, czy jeden wspólny core ma być sterowany konfiguracją?",
    metric: "W ciągu 60 dni: nowy motyw wdrożony w ≤2 dni, a CSS każdego motywu <50KB",
  },
  quadrants: {
    Q1: { scar: "Wspólne komponenty upchane ifami pod marki", sacred: "Zero rozgałęzień w core" },
    Q2: { scar: "Ponad 100 motywów łatanych ręcznie jeden po drugim", sacred: "Typy łapią błędy" },
    Q3: { scar: "Skopiowany design system, przesadnie abstrakcyjny", sacred: "Wymienna struktura" },
    Q4: { scar: "Trzy razy widział, jak personalizacja wymyka się spod kontroli", sacred: "Granice muszą wytrzymać" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 warstwy", "Podziel komponenty na czysty core, koordynujący view i liść theme; core nie może importować ID motywów ani tras", "Błąd, jeśli w ciągu 14 dni w core pojawią się warunki zależne od motywu", null),
    N2: node("D2", 0, 1, "Zmienne CSS", "Wyrażaj każdą różnicę między motywami wyłącznie przez CSS custom properties, bez żadnych rozgałęzień w komponentach i layoutach", "Błąd, jeśli już 3. motyw wymaga zmian w komponentach", "Różnic w układzie nie da się wyrazić samymi kolorami"),
    N3: node("D1", 1, 0, "CSS na żądanie", "W runtime ładuj tylko jeden arkusz stylów aktywnego motywu zamiast pakować wszystkie motywy do pierwszego renderu", "Błąd, jeśli w ciągu 14 dni CSS któregokolwiek motywu przekroczy 50KB", null),
    N4: node("D4", 0, 2, "Typowany config", "Każdy motyw dostarcza kompletny obiekt konfiguracji w TypeScript; brak dowolnego pola wywala build", "Błąd, jeśli nowy motyw wciąż wymaga zmian we wspólnych komponentach", null),
    N5: node("D3", 2, 0, "Fork na markę", "Każdy motyw kopiuje katalog komponentów i rozwija go niezależnie, więc marki nigdy na siebie nie wpływają", "Błąd, jeśli po 10. motywie naprawa jednego buga dotyka >10 miejsc", "Jedna poprawka buga to łatanie N kopii"),
    N6: node("D3", 1, 2, "Motywy canary", "Każdy nowy motyw wypuszczaj za feature flagą na 5% tenantów przez tydzień; na 100% dopiero, gdy wskaźnik błędów mieści się w celu", "Błąd, jeśli wskaźnik błędów w canary przekroczy 1%", null),
    N7: node("D3", 2, 1, "Zmiana nadwozia", "[D2 płyta podłogowa] Layouty są jak nadwozia samochodów: wymieniasz całą karoserię, a wspólne podwozie (view i core) zostaje na miejscu", "Błąd, jeśli wymiana layoutu wymaga zmian w core", "Interakcje rozjeżdżają się między layoutami",
      { lateral: { src: "Motoryzacja: wspólna płyta podłogowa", dist: 2, drop: "Projektowanie każdego modelu od zera" } }),
    N8: node("D2", 1, 0, "Stałe sloty", "[D3 klocki LEGO] Layouty deklarują stałe sloty; motywy mogą tylko wpinać komponenty w sloty i nie mogą zmieniać struktury poza nimi", "Błąd, jeśli DOM poza slotami zostanie zmieniony choć raz", null,
      { lateral: { src: "Zabawki: złącza klocków LEGO", dist: 3, drop: "Dowolna personalizacja DOM" } }),
    N9: node("D4", 2, 0, "Tylko różnice", "[D4 rodzina fontów] Motywy deklarują tylko różnice względem domyślnego; wszystkie pozostałe pola dziedziczą automatycznie", "Błąd, jeśli dziedziczenie sięga głębiej niż 3 poziomy", null,
      { lateral: { src: "Typografia: rodziny odmian kroju", dist: 4, drop: "Pełna kopia dla każdego motywu" } }),
    N10: node("D2", 2, 0, "Limit kluczy", "Jeśli każda prośba o personalizację dodaje pole do configu, utrzymanie konfiguracji nieuchronnie będzie droższe niż zwykły fork", "Przestań dodawać pola, gdy którykolwiek interfejs configu przekroczy 40 pól", "Piekło konfiguracji",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakcja kosztuje więcej niż duplikacja" } }),
    N11: node("D4", 1, 0, "Bez obejść", "Jeśli biznes może żądać warunków pod markę bezpośrednio we wspólnych komponentach, granica padnie w ciągu kwartału", "Nieważne, jeśli w ciągu 14 dni do wspólnych komponentów trafi jakikolwiek warunek pod markę", "Granice wymieniane na terminy",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Presja terminów nagradza łamanie granic" } }),
    N12: node("D3", 0, 1, "Bez przepisania", "Jeśli wszystkie 70 modułów musi zostać zmigrowanych, zanim cokolwiek trafi na produkcję, koszty utopione zatrzymają refaktor w połowie", "Stop, jeśli pierwszy moduł nie trafi na produkcję w ciągu 14 dni", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Refaktor typu big bang bierze terminy jako zakładników" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Wspólny typowany config i forki komponentów per marka to wybór albo–albo" },
    { type: "excludes", from: "N1", to: "N5", why: "Wspólny trójwarstwowy core i kopie komponentów per marka wykluczają się nawzajem" },
    { type: "excludes", from: "N4", to: "N11", why: "Typowany config blokuje obejścia już przy kompilacji, więc ręczny przegląd granic staje się zbędną bramką" },
    { type: "excludes", from: "N2", to: "N7", why: "Jeśli motywy zmieniają tylko zmienne CSS, nie ma wymiany całych komponentów layoutu" },
    { type: "excludes", from: "N2", to: "N10", why: "Czyste zmienne CSS nie mają pól configu, które mogłyby puchnąć; wybierz jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Łańcuchy dziedziczenia pozwalają na lokalne nadpisania, co kłóci się z barierką zero obejść" },
    { type: "requires", from: "N1", to: "N8", why: "Po podziale na trzy warstwy motywy muszą personalizować przez stałe sloty, inaczej warstwa view zostanie przebita" },
    { type: "requires", from: "N4", to: "N10", why: "Typowany config potrzebuje limitu pól, inaczej rozrośnie się w piekło konfiguracji" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Duży refaktor na start", v: "Żadnych szybkich forków", t: "60 dni na zbudowanie szkieletu", l: "Trzeba napisać testy integralności", x: "Żadnych skrótów pod konkretną markę" },
      fatal: "N10", thesis: "Trójwarstwowe granice plus typowany config sprowadzają każdy motyw do jednego liścia", title: "Config · 3 warstwy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ograniczona zmienność layoutu", v: "Mniej swobody projektowej", t: "Małe kroki co tydzień", l: "Złożone layouty odpadają", x: "Żadnej personalizacji struktury" },
      fatal: "N12", thesis: "Tylko zmienne CSS i dziedziczenie, a motywy wypuszczane stopniowo za canary", title: "Czysty CSS · stopniowo",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Zduplikowany kod", v: "Poprawki bugów w wielu miejscach", t: "Najszybsze wdrożenie", l: "Koszt utrzymania rośnie liniowo", x: "Rezygnacja z typowanego configu" },
      fatal: "N11", thesis: "Wymieniaj całe layouty i pozwól każdej marce forkować własną karoserię", title: "Forki marek · wspólne podwozie",
    },
  },
  recommend: { key: "alpha", why: "Przy ponad 100 motywach tylko podejście sterowane konfiguracją trzyma koszty utrzymania w ryzach" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Każdy motyw dziedziczy z tego samego motywu domyślnego", kill: "Zepsuj motyw domyślny, a rozsypie się layout każdego motywu", label: "SPOF: motyw domyślny" },
};
