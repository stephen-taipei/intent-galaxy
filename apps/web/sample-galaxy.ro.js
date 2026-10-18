// 內建示範星系（IntentAnalysisResponse v1.0，羅馬尼亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Cum e împărțit codul", D2: "Cum diferă temele", D3: "Cât de adânc merge personalizarea", D4: "Cum sunt construite setările temei" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Cealaltă tabără: duce „${dims[dim]}” în direcția opusă`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_RO = {
  schema_version: "1.0",
  core: {
    decision: "Ar trebui fiecare brand să aibă propria copie a componentelor, sau toate brandurile să folosească un nucleu comun și să-și gestioneze diferențele prin fișiere de configurare?",
    metric: "În 60 de zile: o temă nouă se lansează în cel mult 2 zile, iar CSS-ul fiecărei teme are sub 50KB",
  },
  quadrants: {
    Q1: { scar: "Componente comune pline de if-uri pentru fiecare brand", sacred: "Nicio verificare de brand în nucleu" },
    Q2: { scar: "A reparat de mână machetele a peste 100 de teme, una câte una", sacred: "Lasă verificarea tipurilor să prindă greșelile" },
    Q3: { scar: "A copiat sistemul de design al altcuiva și l-a complicat prea mult", sacred: "Piese care se schimbă întregi" },
    Q4: { scar: "A văzut personalizarea scăpând de sub control de trei ori", sacred: "Straturile rămân separate" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Trei straturi", "Împarte componentele în trei straturi: un nucleu doar cu logica, o vizualizare care leagă piesele și o foaie de temă pentru stil; nucleul nu poate importa ID-uri de temă sau rute", "Eșuează dacă în 14 zile apare în nucleu cod care verifică tema", null),
    N2: node("D2", 0, 1, "Doar var. CSS", "Scrie toate diferențele dintre teme ca variabile CSS (proprietăți personalizate), fără nicio verificare de temă în componente sau machete", "Eșuează dacă deja a 3-a temă cere modificări în componente", "Diferențele de machetă nu se rezolvă doar cu culori"),
    N3: node("D1", 1, 0, "O temă o dată", "Încarcă doar foaia de stil a temei curente, în loc să incluzi toate temele la prima încărcare a paginii", "Eșuează dacă în 14 zile CSS-ul vreunei teme depășește 50KB", null),
    N4: node("D4", 0, 2, "Config tipizate", "Fiecare temă vine cu un obiect de configurare TypeScript complet; dacă lipsește un câmp, build-ul eșuează", "Eșuează dacă o temă nouă încă cere modificarea componentelor comune", null),
    N5: node("D3", 2, 0, "Copie pe brand", "Fiecare temă copiază folderul de componente și îl modifică separat, ca brandurile să nu se afecteze niciodată unul pe altul", "Eșuează dacă, după a 10-a temă, repararea unui bug înseamnă modificări în peste 10 locuri", "O reparație înseamnă să cârpești fiecare copie"),
    N6: node("D3", 1, 2, "Întâi la 5%", "Activează fiecare temă nouă doar pentru 5% dintre clienți timp de o săptămână, printr-un comutator; pornește-o pentru toți doar dacă rata de erori rămâne în țintă", "Eșuează dacă rata de erori depășește 1% în acea săptămână", null),
    N7: node("D3", 2, 1, "Schimbă carcasa", "Ca mașinile care au același șasiu și schimbă doar caroseria: înlocuiești o machetă întreagă, iar vizualizarea și nucleul comune de dedesubt rămân pe loc", "Eșuează dacă schimbarea machetei cere modificări în nucleu", "Comenzile se pot comporta diferit de la o machetă la alta",
      { lateral: { src: "Auto: șasiu comun", dist: 2, drop: "O matriță nouă pentru fiecare model" } }),
    N8: node("D2", 1, 0, "Locuri fixe", "Ca piesele LEGO care se prind doar pe butonașele lor: machetele definesc locuri fixe, temele pot pune componente doar în acele locuri și nimic altceva nu se poate schimba", "Eșuează dacă pagina (DOM) din afara locurilor fixe e modificată fie și o singură dată", null,
      { lateral: { src: "Jucării: piese LEGO", dist: 3, drop: "Modificarea liberă a DOM-ului" } }),
    N9: node("D4", 2, 0, "Doar diferențe", "Ca variantele bold și light ale aceluiași font: o temă listează doar ce diferă față de tema implicită, iar restul se preia automat", "Eșuează dacă moștenirea trece de 3 niveluri", null,
      { lateral: { src: "Tipografie: grosimi de font", dist: 4, drop: "O copie completă pentru fiecare temă" } }),
    N10: node("D2", 2, 0, "Max. 40 câmpuri", "Dacă fiecare cerere de personalizare adaugă un câmp de configurare, întreținerea configurării va costa mai devreme sau mai târziu mai mult decât o simplă copie", "Nu mai adăuga câmpuri odată ce o interfață de configurare depășește 40", "Atâtea setări încât nimeni nu le mai înțelege",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstractizarea ajunge să coste mai mult decât codul copiat" } }),
    N11: node("D4", 1, 0, "Fără excepții", "Dacă partea de business poate cere verificări de brand direct în componentele comune, straturile se vor prăbuși în mai puțin de un trimestru", "Renunță la acest plan dacă în 14 zile se adaugă fie și o singură verificare de brand în componentele comune", "Sacrifici straturile ca să prinzi un termen",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Respectarea termenului e lăudată; încălcarea straturilor rămâne nepedepsită" } }),
    N12: node("D3", 0, 1, "Pas cu pas", "Dacă toate cele 70 de module trebuie mutate înainte să lansezi ceva, cu cât ai investit mai mult cu atât e mai greu să te oprești, iar rescrierea tinde să se blocheze la jumătate", "Oprește-te dacă primul modul nu a fost lansat în 14 zile", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Rescrierea totală dintr-odată dă peste cap calendarul" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "O configurare tipizată comună și o copie separată pentru fiecare brand: poți alege doar una" },
    { type: "excludes", from: "N1", to: "N5", why: "Un nucleu comun pe trei straturi și o copie a componentelor pentru fiecare brand: poți alege doar una" },
    { type: "excludes", from: "N4", to: "N11", why: "Configurarea tipizată blochează deja scurtăturile la build, așa că o verificare manuală a straturilor verifică de două ori același lucru" },
    { type: "excludes", from: "N2", to: "N7", why: "Dacă temele schimbă doar variabile CSS, nimeni nu înlocuiește componente de machetă întregi" },
    { type: "excludes", from: "N2", to: "N10", why: "Doar cu variabile CSS nu există câmpuri de configurare care să se adune; trebuie să alegi" },
    { type: "excludes", from: "N9", to: "N11", why: "Moștenirea permite unei teme să schimbe detalii local, ceea ce se bate cap în cap cu o barieră care interzice ocolirea straturilor" },
    { type: "requires", from: "N1", to: "N8", why: "Cu trei straturi, temele trebuie să se personalizeze prin locuri fixe, altfel stratul de vizualizare ajunge plin de cârpeli" },
    { type: "requires", from: "N4", to: "N10", why: "Configurările tipizate au nevoie de o limită de câmpuri, altfel cresc până nu le mai înțelege nimeni" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Muncă de rescriere la început", v: "Fără copii rapide", t: "60 de zile pentru a pune structura", l: "Teste complete obligatorii", x: "Fără scurtături speciale pentru branduri" },
      fatal: "N10", thesis: "Trei straturi pentru componente și un fișier de configurare tipizat pentru fiecare temă, astfel încât fiecare temă e doar o configurare", title: "Condus de config · 3 straturi",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Puțină varietate de machete", v: "Mai puțină libertate de design", t: "O mică schimbare în fiecare săptămână", l: "Fără machete complexe", x: "Fără schimbări în structura paginilor" },
      fatal: "N12", thesis: "Doar variabile CSS și moștenire; arată temele noi întâi câtorva utilizatori, apoi extinde", title: "Doar stiluri · lansare treptată",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Cod duplicat", v: "Reparațiile ating multe locuri", t: "Cel mai rapid de lansat", l: "Mai multe teme, mai multă întreținere", x: "Renunți la configurarea tipizată" },
      fatal: "N11", thesis: "Înlocuiești machete întregi și lași fiecare brand să-și copieze propria carcasă", title: "Copii pe brand · șasiu comun",
    },
  },
  recommend: { key: "alpha", why: "Cu peste 100 de teme, doar o abordare condusă de configurare ține costurile de întreținere sub control" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Toate temele moștenesc aceeași temă implicită", kill: "Dacă tema implicită se strică, se strică macheta tuturor temelor", label: "O singură bază" },
};
