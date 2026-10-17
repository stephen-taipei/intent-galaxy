// 內建示範星系（IntentAnalysisResponse v1.0，義大利文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Confini tra livelli", D2: "Come si esprimono le varianti", D3: "Portata della personalizzazione", D4: "Composizione dei temi" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Posizione opposta: portare ${dims[dim]} all'estremo contrario`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_IT = {
  schema_version: "1.0",
  core: {
    decision: "Ogni brand deve fare il fork dei propri componenti, o serve un unico core condiviso guidato dalla configurazione?",
    metric: "Entro 60 giorni: un nuovo tema va in produzione in ≤2 giorni e il CSS di ogni tema è <50KB",
  },
  quadrants: {
    Q1: { scar: "Componenti condivisi pieni di if per brand", sacred: "Zero diramazioni nel core" },
    Q2: { scar: "Oltre 100 temi rattoppati uno per uno", sacred: "I tipi intercettano gli errori" },
    Q3: { scar: "Ha copiato un design system, astrazione eccessiva", sacred: "Struttura intercambiabile" },
    Q4: { scar: "Ha visto la personalizzazione sfuggire di mano tre volte", sacred: "I confini reggono" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tre livelli", "Dividere i componenti in un core puro, una view di coordinamento e una foglia theme; il core non può importare ID di tema né route", "Sbagliato se entro 14 giorni compaiono controlli sul tema nel core", null),
    N2: node("D2", 0, 1, "Solo var CSS", "Esprimere ogni differenza tra temi solo con custom property CSS, senza alcuna diramazione in componenti o layout", "Sbagliato se già il 3° tema richiede modifiche ai componenti", "Le differenze di layout non si esprimono con i soli colori"),
    N3: node("D1", 1, 0, "Lazy-load CSS", "A runtime, caricare solo il foglio di stile del tema attivo invece di includere tutti i temi nel primo rendering", "Sbagliato se entro 14 giorni il CSS di un singolo tema supera i 50KB", null),
    N4: node("D4", 0, 2, "Config in TS", "Ogni tema fornisce un oggetto di config TypeScript completo; qualsiasi campo mancante fa fallire la build", "Sbagliato se un nuovo tema richiede ancora modifiche ai componenti condivisi", null),
    N5: node("D3", 2, 0, "Fork per brand", "Ogni tema copia la cartella dei componenti e la modifica per conto suo, così i brand non si influenzano mai", "Sbagliato se, dopo il 10° tema, correggere un bug tocca più di 10 punti", "Un fix significa patchare N copie"),
    N6: node("D3", 1, 2, "Temi canary", "Rilasciare ogni nuovo tema dietro un feature flag al 5% dei tenant per una settimana; passare al 100% solo se il tasso di errori è nel target", "Sbagliato se il tasso di errori del canary supera l'1%", null),
    N7: node("D3", 2, 1, "Cambia scocca", "[D2 pianale auto] I layout sono come carrozzerie: si cambia tutta la scocca mentre il telaio condiviso (view e core) resta fermo", "Sbagliato se cambiare layout richiede modifiche al core", "Le interazioni divergono tra un layout e l'altro",
      { lateral: { src: "Automotive: pianale condiviso", dist: 2, drop: "Riattrezzare ogni modello da zero" } }),
    N8: node("D2", 1, 0, "Slot fissi", "[D3 mattoncini LEGO] I layout dichiarano slot fissi; i temi possono solo inserire componenti negli slot, senza toccare la struttura al di fuori", "Sbagliato se il DOM fuori dagli slot viene modificato anche una sola volta", null,
      { lateral: { src: "Giocattoli: l'incastro dei LEGO", dist: 3, drop: "Personalizzazione libera del DOM" } }),
    N9: node("D4", 2, 0, "Eredita diff", "[D4 famiglia di font] I temi dichiarano solo la differenza rispetto al default; tutti gli altri campi vengono ereditati automaticamente", "Sbagliato se l'ereditarietà supera i 3 livelli", null,
      { lateral: { src: "Tipografia: famiglie di pesi", dist: 4, drop: "Copia completa per ogni tema" } }),
    N10: node("D2", 2, 0, "Tetto ai campi", "Se ogni richiesta di personalizzazione aggiunge un campo di config, mantenere la config finirà per costare più che fare un fork", "Smettere di aggiungere campi appena un'interfaccia di config supera i 40 campi", "L'inferno delle config",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'astrazione costa più della duplicazione" } }),
    N11: node("D4", 1, 0, "Zero bypass", "Se il business può pretendere controlli sul brand direttamente nei componenti condivisi, il confine cadrà entro un trimestre", "Decade se entro 14 giorni viene aggiunto un controllo sul brand ai componenti condivisi", "Sacrificare i confini alle scadenze",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "La pressione delle scadenze premia chi rompe i confini" } }),
    N12: node("D3", 0, 1, "No big bang", "Se tutti i 70 moduli devono migrare prima di rilasciare qualcosa, il costo sommerso bloccherà il refactoring a metà strada", "Fermarsi se il primo modulo non è in produzione entro 14 giorni", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Un refactoring big bang tiene in ostaggio le scadenze" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Config tipizzata condivisa e fork dei componenti per brand sono un aut-aut" },
    { type: "excludes", from: "N1", to: "N5", why: "Un core condiviso a tre livelli e copie dei componenti per brand si escludono a vicenda" },
    { type: "excludes", from: "N4", to: "N11", why: "La config tipizzata blocca già i bypass in compilazione, quindi una revisione manuale dei confini diventa un paletto ridondante" },
    { type: "excludes", from: "N2", to: "N7", why: "Se i temi cambiano solo variabili CSS, non si sostituiscono interi componenti di layout" },
    { type: "excludes", from: "N2", to: "N10", why: "Le sole variabili CSS non hanno campi di config da gonfiare; bisogna scegliere" },
    { type: "excludes", from: "N9", to: "N11", why: "Le catene di ereditarietà permettono override locali, in conflitto con un paletto zero bypass" },
    { type: "requires", from: "N1", to: "N8", why: "Una volta divisi in tre livelli, i temi devono personalizzare tramite slot fissi, altrimenti il livello view viene bucato" },
    { type: "requires", from: "N4", to: "N10", why: "Le config tipizzate hanno bisogno di un tetto ai campi, o degenerano nell'inferno delle config" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Sforzo di refactoring iniziale", v: "Niente fork veloci", t: "60 giorni per costruire lo scheletro", l: "Test di integrità obbligatori", x: "Niente scorciatoie per singolo brand" },
      fatal: "N10", thesis: "Confini a tre livelli e config tipizzata riducono ogni tema a una singola foglia", title: "Guidato da config · 3 livelli",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca varietà di layout", v: "Meno libertà di design", t: "Piccoli passi ogni settimana", l: "Niente layout complessi", x: "Niente personalizzazione strutturale" },
      fatal: "N12", thesis: "Solo variabili CSS ed ereditarietà, con rilascio graduale dei temi tramite canary", title: "Solo stile · graduale",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Codice duplicato", v: "I fix toccano molti punti", t: "Il più veloce da rilasciare", l: "Costi di manutenzione lineari", x: "Rinunciare alla config tipizzata" },
      fatal: "N11", thesis: "Sostituire interi layout e lasciare che ogni brand faccia il fork della propria scocca", title: "Fork per brand · telaio comune",
    },
  },
  recommend: { key: "alpha", why: "Con oltre 100 temi, solo un approccio guidato da config tiene sotto controllo i costi di manutenzione" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tutti i temi ereditano dallo stesso tema di default", kill: "Se si rompe il default, si rompe il layout di tutti i temi", label: "SPOF default" },
};
