// 內建示範星系（IntentAnalysisResponse v1.0，波蘭文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Podział kodu na warstwy", D2: "Czym różnią się motywy", D3: "Jak głęboko sięga personalizacja", D4: "Jak zbudowane są ustawienia motywu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Druga strona: „${dims[dim]}” w przeciwną stronę`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_PL = {
  schema_version: "1.0",
  core: {
    decision: "Czy każda marka ma mieć własną kopię komponentów, czy wszystkie marki mają dzielić jeden rdzeń, a różnice ustawiać w plikach konfiguracyjnych?",
    metric: "W ciągu 60 dni: nowy motyw gotowy w 2 dni lub szybciej, a CSS każdego motywu poniżej 50KB",
  },
  quadrants: {
    Q1: { scar: "Wspólne komponenty naszpikowane warunkami pod marki", sacred: "Żadnych warunków pod marki w rdzeniu" },
    Q2: { scar: "Ręczne poprawianie układów dla ponad 100 motywów, jeden po drugim", sacred: "Niech sprawdzanie typów łapie błędy" },
    Q3: { scar: "Skopiował cudzy design system i przesadził z abstrakcją", sacred: "Części, które da się wymienić w całości" },
    Q4: { scar: "Trzy razy widział, jak personalizacja wymyka się spod kontroli", sacred: "Granice warstw muszą wytrzymać" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Podział na 3", "Podziel komponenty na trzy warstwy: rdzeń z samą logiką, widok, który wszystko łączy, i cienką warstwę motywu od wyglądu; rdzeń nie może znać nazw motywów ani tras", "Nie działa, jeśli w ciągu 14 dni w rdzeniu pojawi się kod sprawdzający motyw", null),
    N2: node("D2", 0, 1, "Tylko zmienne", "Zapisuj każdą różnicę między motywami jako zmienne CSS (custom properties), bez żadnego sprawdzania motywu w komponentach i układach", "Nie działa, jeśli już 3. motyw wymaga zmian w komponentach", "Różnic w układzie nie da się załatwić samymi kolorami"),
    N3: node("D1", 1, 0, "Jeden motyw", "Wczytuj tylko arkusz stylów bieżącego motywu, zamiast pakować wszystkie motywy do pierwszego ładowania strony", "Nie działa, jeśli w ciągu 14 dni CSS któregoś motywu przekroczy 50KB", null),
    N4: node("D4", 0, 2, "Typowany config", "Każdy motyw ma kompletny obiekt konfiguracji w TypeScript; jeśli brakuje choć jednego pola, build się nie uda", "Nie działa, jeśli nowy motyw nadal wymaga zmian we wspólnych komponentach", null),
    N5: node("D3", 2, 0, "Kopia dla marki", "Każdy motyw kopiuje folder komponentów i rozwija go osobno, więc marki nigdy sobie nie przeszkadzają", "Nie działa, jeśli po 10. motywie naprawa jednego błędu wymaga zmian w ponad 10 miejscach", "Jedna poprawka to łatanie każdej kopii"),
    N6: node("D3", 1, 2, "Na próbę 5%", "Każdy nowy motyw włączaj przez tydzień tylko dla 5% klientów; dla wszystkich dopiero wtedy, gdy liczba błędów mieści się w normie", "Nie działa, jeśli w tym tygodniu błędów będzie ponad 1%", null),
    N7: node("D3", 2, 1, "Nowe nadwozie", "Jak w samochodach, które mają wspólne podwozie, a różne nadwozia: wymieniasz cały układ, a wspólny widok i rdzeń pod spodem zostają", "Nie działa, jeśli wymiana układu wymaga zmian w rdzeniu", "Przyciski i gesty mogą działać różnie w różnych układach",
      { lateral: { src: "Samochody: wspólne podwozie", dist: 2, drop: "Nowa forma dla każdego modelu" } }),
    N8: node("D2", 1, 0, "Stałe miejsca", "Jak klocki LEGO, które pasują tylko na wypustki: układ ma stałe miejsca, motyw może wstawiać komponenty tylko w nie, a poza nimi nic nie wolno zmieniać", "Nie działa, jeśli choć raz zmieni się DOM poza tymi miejscami", null,
      { lateral: { src: "Zabawki: klocki LEGO", dist: 3, drop: "Dowolne zmiany w DOM" } }),
    N9: node("D4", 2, 0, "Same różnice", "Jak grubsza i cieńsza odmiana tego samego kroju pisma: motyw wypisuje tylko to, czym różni się od domyślnego, a reszta przechodzi automatycznie", "Nie działa, jeśli dziedziczenie sięga głębiej niż 3 poziomy", null,
      { lateral: { src: "Typografia: odmiany kroju", dist: 4, drop: "Pełna kopia dla każdego motywu" } }),
    N10: node("D2", 2, 0, "Limit pól", "Jeśli każda prośba o zmianę dodaje pole do konfiguracji, utrzymanie jej prędzej czy później będzie droższe niż zwykła kopia", "Przestań dodawać pola, gdy któryś interfejs konfiguracji przekroczy 40", "Tyle ustawień, że nikt ich nie rozumie",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstrakcja kosztuje więcej niż skopiowany kod" } }),
    N11: node("D4", 1, 0, "Bez wyjątków", "Jeśli biznes może żądać warunków pod markę prosto we wspólnych komponentach, podział na warstwy rozpadnie się w ciągu kwartału", "Porzuć ten plan, jeśli w ciągu 14 dni do wspólnych komponentów trafi choć 1 warunek pod markę", "Rezygnacja z warstw, żeby zdążyć na termin",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Za dotrzymanie terminu chwalą, za łamanie warstw nikt nie karze" } }),
    N12: node("D3", 0, 1, "Bez rewolucji", "Jeśli wszystkie 70 modułów trzeba przenieść, zanim cokolwiek trafi do użytkowników, im więcej już włożono, tym trudniej przestać, i przepisywanie zwykle staje w połowie", "Stop, jeśli pierwszy moduł nie trafi do użytkowników w ciągu 14 dni", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Przepisanie wszystkiego naraz rozwala harmonogram" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Jedna wspólna typowana konfiguracja i osobna kopia dla każdej marki: można wybrać tylko jedno" },
    { type: "excludes", from: "N1", to: "N5", why: "Wspólny trójwarstwowy rdzeń i kopia komponentów dla każdej marki: można wybrać tylko jedno" },
    { type: "excludes", from: "N4", to: "N11", why: "Typowana konfiguracja blokuje skróty już przy budowaniu, więc ręczne pilnowanie warstw sprawdzałoby to samo dwa razy" },
    { type: "excludes", from: "N2", to: "N7", why: "Jeśli motywy zmieniają tylko zmienne CSS, nikt nie wymienia całych komponentów układu" },
    { type: "excludes", from: "N2", to: "N10", why: "Przy samych zmiennych CSS nie ma pól konfiguracji, które mogłyby się mnożyć; wybierz jedno" },
    { type: "excludes", from: "N9", to: "N11", why: "Dziedziczenie pozwala motywowi coś lokalnie nadpisać, a to kłóci się z bezpiecznikiem „nigdy nie omijaj warstw”" },
    { type: "requires", from: "N1", to: "N8", why: "Gdy są trzy warstwy, motywy muszą zmieniać wygląd przez stałe miejsca, inaczej warstwa widoku zostanie rozbita" },
    { type: "requires", from: "N4", to: "N10", why: "Typowana konfiguracja potrzebuje limitu pól, inaczej rozrośnie się tak, że nikt jej nie zrozumie" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Dużo przepisywania na start", v: "Żadnych szybkich kopii", t: "60 dni na postawienie struktury", l: "Trzeba napisać porządne testy", x: "Żadnych skrótów pod marki" },
      fatal: "N10", thesis: "Trzy warstwy komponentów i typowany plik konfiguracji dla każdego motywu, więc każdy motyw to tylko jedna konfiguracja", title: "Konfiguracja · 3 warstwy",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Mniejszy wybór układów", v: "Mniej swobody projektowej", t: "Małe zmiany co tydzień", l: "Złożone układy odpadają", x: "Bez zmian w strukturze strony" },
      fatal: "N12", thesis: "Tylko zmienne CSS i dziedziczenie; nowe motywy najpierw dla garstki użytkowników, potem dla wszystkich", title: "Same style · stopniowo",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Zdublowany kod", v: "Poprawki w wielu miejscach", t: "Najszybsze wdrożenie", l: "Więcej motywów, więcej utrzymania", x: "Rezygnacja z typowanej konfiguracji" },
      fatal: "N11", thesis: "Wymieniaj całe układy i pozwól każdej marce mieć własną kopię nadwozia", title: "Kopie marek · wspólne podwozie",
    },
  },
  recommend: { key: "alpha", why: "Przy ponad 100 motywach tylko podejście oparte na konfiguracji trzyma koszty utrzymania w ryzach" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Każdy motyw dziedziczy z tego samego motywu domyślnego", kill: "Zepsuj motyw domyślny, a rozsypie się układ każdego motywu", label: "Wszystko na 1" },
};
