// 內建示範星系（IntentAnalysisResponse v1.0，羅馬尼亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Granițele dintre straturi", D2: "Cum se exprimă variațiile", D3: "Amploarea personalizării", D4: "Compoziția temelor" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Poziția opusă: împinge ${dims[dim]} la extrema cealaltă`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_RO = {
  schema_version: "1.0",
  core: {
    decision: "Fiecare brand ar trebui să-și facă fork la propriile componente, sau un singur core comun, condus prin configurare?",
    metric: "În 60 de zile: o temă nouă lansată în ≤2 zile, iar CSS-ul fiecărei teme <50KB",
  },
  quadrants: {
    Q1: { scar: "Componente comune îndesate cu if-uri pe brand", sacred: "Zero ramificări în core" },
    Q2: { scar: "Peste 100 de teme peticite una câte una", sacred: "Tipurile prind greșelile" },
    Q3: { scar: "A copiat un design system și l-a supra-abstractizat", sacred: "Structură interschimbabilă" },
    Q4: { scar: "A văzut personalizarea scăpând de sub control de trei ori", sacred: "Granițele rezistă" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Trei straturi", "Împarte componentele într-un core pur, un view de coordonare și o frunză theme; core-ul nu are voie să importe ID-uri de temă sau rute", "Greșit dacă în 14 zile apar verificări de temă în core", null),
    N2: node("D2", 0, 1, "Doar var. CSS", "Exprimă toate diferențele dintre teme doar prin custom properties CSS, fără nicio ramificare în componente sau layout-uri", "Greșit dacă deja a 3-a temă cere modificări în componente", "Diferențele de layout nu se pot exprima doar prin culori"),
    N3: node("D1", 1, 0, "CSS lazy-load", "La runtime, încarcă doar foaia de stil a temei active, în loc să pui toate temele în prima randare", "Greșit dacă în 14 zile CSS-ul unei singure teme depășește 50KB", null),
    N4: node("D4", 0, 2, "Config tipizate", "Fiecare temă vine cu un obiect de config TypeScript complet; orice câmp lipsă pică build-ul", "Greșit dacă o temă nouă încă cere modificări în componentele comune", null),
    N5: node("D3", 2, 0, "Fork pe brand", "Fiecare temă copiază directorul de componente și îl modifică separat, ca brandurile să nu se afecteze niciodată între ele", "Greșit dacă, după a 10-a temă, repararea unui bug atinge peste 10 locuri", "Un fix înseamnă N copii de peticit"),
    N6: node("D3", 1, 2, "Teme canary", "Lansează fiecare temă nouă în spatele unui feature flag pentru 5% din tenanți timp de o săptămână; treci la 100% doar dacă rata de erori e în țintă", "Greșit dacă rata de erori a canary-ului depășește 1%", null),
    N7: node("D3", 2, 1, "Schimbă carcasa", "[D2 platformă auto] Layout-urile sunt ca niște caroserii: schimbi toată carcasa, iar șasiul comun (view și core) rămâne pe loc", "Greșit dacă schimbarea layout-ului cere modificări în core", "Interacțiunile diferă de la un layout la altul",
      { lateral: { src: "Auto: șasiu pe platformă", dist: 2, drop: "Reutilarea fiecărui model de la zero" } }),
    N8: node("D2", 1, 0, "Sloturi fixe", "[D3 piese LEGO] Layout-urile declară sloturi fixe; temele pot doar să pună componente în sloturi și nu au voie să schimbe structura din afara lor", "Greșit dacă DOM-ul din afara sloturilor e modificat măcar o dată", null,
      { lateral: { src: "Jucării: îmbinarea pieselor LEGO", dist: 3, drop: "Personalizare liberă a DOM-ului" } }),
    N9: node("D4", 2, 0, "Moștenește diff", "[D4 familie de fonturi] Temele declară doar diferența față de default; toate celelalte câmpuri se moștenesc automat", "Greșit dacă moștenirea trece de 3 niveluri", null,
      { lateral: { src: "Tipografie: familii de grosimi", dist: 4, drop: "Copie completă pentru fiecare temă" } }),
    N10: node("D2", 2, 0, "Plafon de chei", "Dacă fiecare cerere de personalizare adaugă un câmp de config, întreținerea config-ului va ajunge inevitabil să coste mai mult decât un simplu fork", "Nu mai adăuga câmpuri odată ce o interfață de config trece de 40 de câmpuri", "Iadul config-urilor",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstracția costă mai mult decât duplicarea" } }),
    N11: node("D4", 1, 0, "Zero bypass", "Dacă business-ul poate cere verificări de brand direct în componentele comune, granița va cădea în mai puțin de un trimestru", "Anulat dacă în 14 zile se adaugă o verificare de brand în componentele comune", "Granițe sacrificate pentru deadline-uri",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Presiunea deadline-urilor răsplătește încălcarea granițelor" } }),
    N12: node("D3", 0, 1, "Fără big bang", "Dacă toate cele 70 de module trebuie migrate înainte să lansezi ceva, costul irecuperabil va bloca refactorizarea la jumătatea drumului", "Oprește-te dacă primul modul nu e lansat în 14 zile", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Refactorizarea big bang ține termenele ostatice" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Config tipizat comun și fork-uri de componente pe brand: ori una, ori alta" },
    { type: "excludes", from: "N1", to: "N5", why: "Un core comun pe trei straturi și copii de componente pe brand se exclud reciproc" },
    { type: "excludes", from: "N4", to: "N11", why: "Config-ul tipizat blochează deja ocolirile la compilare, deci o revizie manuală a granițelor devine o barieră de siguranță redundantă" },
    { type: "excludes", from: "N2", to: "N7", why: "Dacă temele schimbă doar variabile CSS, nu se înlocuiesc componente de layout întregi" },
    { type: "excludes", from: "N2", to: "N10", why: "Variabilele CSS pure n-au câmpuri de config care să se umfle; trebuie ales" },
    { type: "excludes", from: "N9", to: "N11", why: "Lanțurile de moștenire permit suprascrieri locale, ceea ce se bate cap în cap cu o barieră de siguranță zero bypass" },
    { type: "requires", from: "N1", to: "N8", why: "Odată împărțite în trei straturi, temele trebuie să se personalizeze prin sloturi fixe, altfel stratul view e străpuns" },
    { type: "requires", from: "N4", to: "N10", why: "Config-urile tipizate au nevoie de un plafon de câmpuri, altfel se umflă până în iadul config-urilor" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Efort inițial de refactorizare", v: "Fără fork-uri rapide", t: "60 de zile pentru schelet", l: "Teste de integritate obligatorii", x: "Fără scurtături specifice unui brand" },
      fatal: "N10", thesis: "Granițele pe trei straturi plus config-ul tipizat reduc fiecare temă la o singură frunză", title: "Condus de config · 3 straturi",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Variație limitată de layout", v: "Mai puțină libertate de design", t: "Pași mici în fiecare săptămână", l: "Layout-urile complexe sunt excluse", x: "Fără personalizare structurală" },
      fatal: "N12", thesis: "Doar variabile CSS și moștenire, cu lansarea treptată a temelor prin canary", title: "Doar stiluri · treptat",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Cod duplicat", v: "Fix-urile ating multe locuri", t: "Cel mai rapid de lansat", l: "Costul de întreținere crește liniar", x: "Renunți la config-ul tipizat" },
      fatal: "N11", thesis: "Schimbă layout-uri întregi și lasă fiecare brand să-și facă fork la propria carcasă", title: "Fork-uri pe brand · șasiu comun",
    },
  },
  recommend: { key: "alpha", why: "Cu peste 100 de teme, doar abordarea condusă de config ține costul de întreținere sub control" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Toate temele moștenesc din aceeași temă default", kill: "Dacă default-ul se strică, se strică layout-ul tuturor temelor", label: "SPOF în default" },
};
