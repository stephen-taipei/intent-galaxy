// 內建示範星系（IntentAnalysisResponse v1.0，義大利文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Come è diviso il codice", D2: "Come differiscono i temi", D3: "Quanto è profonda la personalizzazione", D4: "Come sono fatte le impostazioni del tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'altro fronte: portare “${dims[dim]}” nella direzione opposta`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_IT = {
  schema_version: "1.0",
  core: {
    decision: "Ogni marchio deve avere la propria copia dei componenti, o tutti i marchi devono condividere un unico nucleo e gestire le differenze con file di configurazione?",
    metric: "Entro 60 giorni: un nuovo tema esce in 2 giorni o meno, e il CSS di ogni tema pesa meno di 50KB",
  },
  quadrants: {
    Q1: { scar: "Componenti condivisi pieni di if per marchio", sacred: "Nessun controllo di marchio nel nucleo" },
    Q2: { scar: "Ha sistemato a mano i layout di oltre 100 temi uno per uno", sacred: "Lasciare che i controlli dei tipi trovino gli errori" },
    Q3: { scar: "Ha copiato il design system di altri e ha astratto troppo", sacred: "Pezzi da sostituire in blocco" },
    Q4: { scar: "Ha visto la personalizzazione sfuggire di mano tre volte", sacred: "I livelli restano separati" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tre livelli", "Dividere i componenti in tre livelli: un nucleo con la sola logica, una vista che collega i pezzi e un foglio del tema per lo stile; il nucleo non può importare ID di tema né percorsi", "Fallisce se entro 14 giorni nel nucleo compare codice che controlla il tema", null),
    N2: node("D2", 0, 1, "Solo var CSS", "Scrivere ogni differenza tra i temi come variabili CSS (proprietà personalizzate), senza alcun controllo del tema nei componenti o nei layout", "Fallisce se già il 3° tema richiede modifiche ai componenti", "Le differenze di layout non si risolvono solo con i colori"),
    N3: node("D1", 1, 0, "Carica un tema", "Caricare solo il foglio di stile del tema attivo, invece di includere tutti i temi già al primo caricamento della pagina", "Fallisce se entro 14 giorni il CSS di un tema supera i 50KB", null),
    N4: node("D4", 0, 2, "Config in TS", "Ogni tema fornisce un oggetto di configurazione TypeScript completo; se manca un campo, la build fallisce", "Fallisce se un nuovo tema richiede ancora modifiche ai componenti condivisi", null),
    N5: node("D3", 2, 0, "Copia a parte", "Ogni tema copia la cartella dei componenti e la modifica per conto suo, così i marchi non si influenzano mai", "Fallisce se, dopo il 10° tema, correggere un bug significa modificare più di 10 punti", "Correggere un bug vuol dire sistemare ogni copia"),
    N6: node("D3", 1, 2, "Prima a pochi", "Attivare ogni nuovo tema solo per il 5% dei clienti per una settimana, tramite un interruttore; aprirlo a tutti solo se il tasso di errori resta nei limiti", "Fallisce se in quella settimana il tasso di errori supera l'1%", null),
    N7: node("D3", 2, 1, "Cambia scocca", "Come le auto che condividono il telaio e cambiano solo la carrozzeria: si sostituisce un intero layout, mentre la vista e il nucleo condivisi sotto restano fermi", "Fallisce se cambiare layout richiede di toccare il nucleo", "I comandi possono comportarsi in modo diverso da un layout all'altro",
      { lateral: { src: "Auto: telaio condiviso", dist: 2, drop: "Uno stampo nuovo per ogni modello" } }),
    N8: node("D2", 1, 0, "Spazi fissi", "Come i mattoncini LEGO che si incastrano solo sui loro perni: i layout definiscono spazi fissi, i temi possono mettere componenti solo in quegli spazi e nient'altro può cambiare", "Fallisce se la pagina (DOM) fuori dagli spazi fissi viene modificata anche una sola volta", null,
      { lateral: { src: "Giocattoli: mattoncini LEGO", dist: 3, drop: "Modificare il DOM liberamente" } }),
    N9: node("D4", 2, 0, "Solo differenze", "Come il grassetto e il chiaro della stessa famiglia di caratteri: un tema elenca solo ciò che cambia rispetto al tema predefinito e tutto il resto viene ripreso automaticamente", "Fallisce se l'ereditarietà supera i 3 livelli", null,
      { lateral: { src: "Tipografia: pesi di un carattere", dist: 4, drop: "Una copia completa per tema" } }),
    N10: node("D2", 2, 0, "Tetto ai campi", "Se ogni richiesta di personalizzazione aggiunge un campo di configurazione, mantenere la configurazione prima o poi costerà più che fare una semplice copia", "Smettere di aggiungere campi appena un'interfaccia di configurazione supera i 40", "Così tante impostazioni che nessuno le capisce più",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'astrazione finisce per costare più del codice copiato" } }),
    N11: node("D4", 1, 0, "Zero eccezioni", "Se il lato business può pretendere controlli di marchio direttamente nei componenti condivisi, i livelli crolleranno entro un trimestre", "Abbandonare il piano se entro 14 giorni anche un solo controllo di marchio viene aggiunto ai componenti condivisi", "Sacrificare i livelli per rispettare una scadenza",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Rispettare la scadenza viene premiato; rompere i livelli resta impunito" } }),
    N12: node("D3", 0, 1, "A piccoli passi", "Se tutti i 70 moduli devono essere migrati prima di pubblicare qualcosa, più si è investito più è difficile fermarsi, e la riscrittura tende a bloccarsi a metà", "Fermarsi se il primo modulo non è uscito entro 14 giorni", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Riscrivere tutto in una volta manda all'aria i tempi" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una configurazione tipizzata condivisa e una copia separata per ogni marchio: si può sceglierne solo una" },
    { type: "excludes", from: "N1", to: "N5", why: "Un nucleo condiviso a tre livelli e una copia dei componenti per ogni marchio: si può sceglierne solo una" },
    { type: "excludes", from: "N4", to: "N11", why: "La configurazione tipizzata blocca già le scorciatoie durante la build, quindi un controllo manuale dei livelli verifica due volte la stessa cosa" },
    { type: "excludes", from: "N2", to: "N7", why: "Se i temi cambiano solo variabili CSS, nessuno sostituisce interi componenti di layout" },
    { type: "excludes", from: "N2", to: "N10", why: "Con le sole variabili CSS non ci sono campi di configurazione che si accumulano; bisogna scegliere" },
    { type: "excludes", from: "N9", to: "N11", why: "L'ereditarietà permette a un tema di cambiare dettagli in locale, il che si scontra con un paletto che vieta di aggirare i livelli" },
    { type: "requires", from: "N1", to: "N8", why: "Con tre livelli, i temi devono personalizzare tramite spazi fissi, altrimenti il livello vista si riempie di toppe" },
    { type: "requires", from: "N4", to: "N10", why: "Le configurazioni tipizzate hanno bisogno di un limite di campi, altrimenti crescono finché nessuno le capisce più" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Lavoro di riscrittura iniziale", v: "Niente copie veloci", t: "60 giorni per impostare la struttura", l: "Test completi obbligatori", x: "Nessuna scorciatoia per i singoli marchi" },
      fatal: "N10", thesis: "Tre livelli per i componenti e un file di configurazione tipizzato per tema, così ogni tema è solo una configurazione", title: "Guidato da config · 3 livelli",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca varietà di layout", v: "Meno libertà di design", t: "Un piccolo cambiamento ogni settimana", l: "Niente layout complessi", x: "Nessuna modifica alla struttura delle pagine" },
      fatal: "N12", thesis: "Solo variabili CSS ed ereditarietà; mostrare i nuovi temi prima a pochi utenti, poi allargare", title: "Solo stili · rilascio graduale",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Codice duplicato", v: "Le correzioni toccano molti punti", t: "Il più veloce da pubblicare", l: "Più temi, più manutenzione", x: "Rinunciare alla configurazione tipizzata" },
      fatal: "N11", thesis: "Sostituire interi layout e lasciare che ogni marchio copi il proprio guscio", title: "Copie per marchio · telaio comune",
    },
  },
  recommend: { key: "alpha", why: "Con oltre 100 temi, solo un approccio guidato dalla configurazione tiene sotto controllo i costi di manutenzione" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tutti i temi ereditano dallo stesso tema predefinito", kill: "Se il tema predefinito si rompe, si rompe il layout di tutti i temi", label: "Un solo default" },
};
