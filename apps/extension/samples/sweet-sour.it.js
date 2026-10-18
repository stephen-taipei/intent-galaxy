// 擴充功能內建生活題示範星系（義大利文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Da dove arriva il dolce", D2: "Come gestire la voglia", D3: "Quanto cambiare", D4: "Cosa c'è in casa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La visione opposta porta ${dims[dim]} all'altro estremo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_IT = {
  schema_version: "1.0",
  core: {
    decision: "Conviene sostituire ogni dolce con frutta intera, o continuare a mangiare quello che ti piace, solo in quantità minore?",
    metric: "Per 30 giorni, non più di 3 snack e bevande zuccherati a settimana in totale (annotati sul telefono per controllare)",
  },
  quadrants: {
    Q1: { scar: "Ha mangiato un intero sacchetto di frutta secca credendolo uno snack sano", sacred: "Il dolce arriva solo dalla frutta intera" },
    Q2: { scar: "Ha smesso con lo zucchero tre volte e ha ceduto ogni volta alla seconda settimana", sacred: "Conta solo se riesci davvero a mantenerlo" },
    Q3: { scar: "Ha copiato una dieta povera di carboidrati e si è stufato in tre giorni", sacred: "Cambia il metodo, non il sapore" },
    Q4: { scar: "Ha visto troppa gente smettere con lo zucchero e ricaderci subito", sacred: "Darsi regole invece di contare sulla forza di volontà" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Frutta intera", "Quando hai voglia di dolce, mangia solo frutta fresca intera, come kiwi, ananas, frutti di bosco o arance; succhi, frutta secca e canditi non contano", "Fallisce se, entro 14 giorni, compri un dolce per toglierti la voglia più di 3 giorni", null),
    N2: node("D2", 0, 1, "Acqua frizzante", "Quando arriva la voglia, bevi prima un bicchiere di acqua frizzante non zuccherata con limone o frutto della passione; se dopo 15 minuti hai ancora voglia, tieni il dolce per dopo il prossimo pasto. Cambiano solo le bevande: i pasti restano uguali e non compri snack sostitutivi", "Fallisce se, entro 14 giorni, dopo l'attesa di 15 minuti hai ancora voglia di dolce più della metà delle volte", "Una bevanda non soddisfa la voglia di masticare qualcosa"),
    N3: node("D1", 1, 0, "Solo dopo pasti", "Mangia snack agrodolci e frutta solo entro 1 ora dopo un pasto; niente a stomaco vuoto e niente nelle 3 ore prima di dormire", "Fallisce se, dopo 14 giorni così, vai ancora a cercare snack prima di dormire più di 3 sere", null),
    N4: node("D4", 0, 2, "Niente dolci", "Fai la spesa una volta a settimana: frutta di stagione a cassette e yogurt bianco senza zucchero per tutta la settimana; sono gli unici snack in casa, e gli snack zuccherati non entrano mai", "Fallisce se, entro 14 giorni, c'è ancora una settimana in cui compri dolci fuori più di 3 volte", null),
    N5: node("D3", 2, 0, "Metà dose", "Continua a mangiare gli snack agrodolci che ami, solo di meno: passa alle monoporzioni e dimezza la quantità giornaliera, senza sostituti", "Fallisce se, dalla 2ª settimana, mangi più della metà della quantità di prima per più di 2 giorni a settimana", "Spesso apri una seconda confezione subito dopo la prima"),
    N6: node("D3", 1, 2, "Prova bevande", "Per ogni nuovo gusto di bevanda non zuccherata, compra la confezione più piccola e bevila 3 giorni di fila; compra la cassa intera solo se ti piace, mai fare scorta tutto in una volta", "Fallisce se un gusto comprato a cassa dopo la prova è ancora più che a metà 14 giorni dopo", null),
    N7: node("D3", 2, 1, "Cambia salsa", "Come cambiare la cover invece del telefono: tieni gli ingredienti principali del maiale o del pesce in agrodolce, ma fai la salsa da te con pomodoro, ananas e aceto, con metà dello zucchero solito", "Fallisce se, dopo aver fatto la nuova salsa 2 volte in 14 giorni, tutti in casa dicono che non è buona", "Al ristorante o col delivery la salsa non la puoi cambiare",
      { lateral: { src: "Tech: cambiare la cover", dist: 2, drop: "Togliere del tutto il piatto dal menù" } }),
    N8: node("D2", 1, 0, "Max 3 porzioni", "Come il limite del bagaglio in aereo: al massimo 3 porzioni al giorno tra frutta e snack agrodolci, ciascuna grande quanto il tuo pugno; il resto aspetta domani, invece di affidarti alla forza di volontà del momento", "Fallisce se superi le 3 porzioni per più di 2 giorni in una settimana", null,
      { lateral: { src: "Compagnie aeree: limite di peso bagaglio", dist: 3, drop: "Mangiare quando vuoi senza limiti" } }),
    N9: node("D4", 2, 0, "Scorta di bolle", "Rifornisciti come un minimarket prima che finisca la merce: tieni sempre in frigo una cassa di acqua frizzante non zuccherata e una retina di limoni, e ricompra la cassa quando restano 3 bottiglie, così una voglia non ti fa mai uscire a comprare una bibita o un tè freddo", "Fallisce se, entro 14 giorni, compri ancora più di 3 bevande zuccherate da asporto", null,
      { lateral: { src: "Retail: riassortire prima dell'esaurimento", dist: 4, drop: "Comprare da bere solo quando ne hai voglia" } }),
    N10: node("D2", 2, 0, "Tetto di spesa", "Se gli snack sostitutivi come frutta e yogurt senza zucchero costano più del doppio di quanto spendevi prima in snack ogni settimana, mollerai entro un mese e tornerai agli snack", "Fermati se, entro 14 giorni, i sostituti costano più del doppio del tuo vecchio budget per gli snack", "Il prezzo della frutta varia molto con le stagioni",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "I sostituti costano troppo per durare" } }),
    N11: node("D4", 1, 0, "No maxi offerte", "Se compri cibo e bevande a casse per avere la spedizione gratuita o uno sconto quantità, più roba hai in casa, più ne mangi ogni giorno", "Fermati se, entro 14 giorni, compri cibo o bevande a casse o per raggiungere la soglia della spedizione gratuita più di una volta", "Non puoi controllare i dolci regalati da amici e parenti",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Gli sconti ti fanno comprare sempre di più" } }),
    N12: node("D3", 0, 1, "Niente gadget", "Se aspetti di aver comprato un gasatore, dolcificanti e ogni tipo di sostituto prima di iniziare, i soldi spesi ti spingeranno a mandare giù cose che non ti piacciono, e mollerai entro 2 settimane", "Fermati se, entro 14 giorni, compri più di 1 gadget o sostituto che poi non usi davvero", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Te lo fai andare giù per non sprecarlo" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Tenere gli snack zuccherati fuori casa e continuare a mangiare i soliti snack zuccherati non possono andare insieme" },
    { type: "excludes", from: "N1", to: "N5", why: "Se il dolce arriva solo dalla frutta intera, non puoi tenerti gli snack zuccherati che ami" },
    { type: "excludes", from: "N4", to: "N11", why: "La frutta in casa dipende dal comprarne una cassetta ogni settimana; vieta gli acquisti a casse e quel piano di scorte crolla" },
    { type: "excludes", from: "N2", to: "N7", why: "Questa strada cambia solo le bevande e lascia stare i pasti, il che contraddice il rifare la salsa agrodolce" },
    { type: "excludes", from: "N2", to: "N10", why: "Questa strada cambia solo le bevande e non compra snack sostitutivi, quindi un tetto di spesa sui sostituti non c'entra; scegline una" },
    { type: "excludes", from: "N9", to: "N11", why: "Tenere scorta di acqua frizzante significa comprarla a casse, il che si scontra in pieno con il non comprare all'ingrosso" },
    { type: "requires", from: "N1", to: "N8", why: "Anche la frutta ha zucchero; anche se è il tuo unico dolce, serve un limite giornaliero, o mangiarne troppa pesa comunque" },
    { type: "requires", from: "N4", to: "N10", why: "Comprare frutta e yogurt a cassette ogni settimana costa, quindi serve un tetto di spesa o il portafoglio cede per primo" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Una spesa fissa a settimana", v: "Rinunciare agli snack che ami", t: "Le prime due settimane di voglie sono dure", l: "Al massimo tre porzioni di frutta al giorno", x: "Niente dolci comprati d'impulso" },
      fatal: "N10", thesis: "Prendi il dolce solo dalla frutta intera, in quantità limitata, e tieni gli snack zuccherati fuori casa", title: "Passa alla frutta · niente dolci in casa",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tenere scorta di acqua frizzante in frigo", v: "Aspettare 15 minuti prima di cedere a una voglia", t: "Cambiare solo un po' ogni settimana", l: "Lo zucchero nei pasti resta uguale", x: "Niente più vecchi snack come al solito" },
      fatal: "N12", thesis: "Prendi acqua frizzante non zuccherata quando arriva la voglia, e prova i nuovi gusti in piccole quantità prima di comprarne altri", title: "Prima le bevande · ridurre piano piano",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Contare le porzioni ogni volta", v: "I dolci in casa tentano ancora", t: "Ci vuole tanto per vedere risultati", l: "Ridurre dipende tutto dall'autocontrollo", x: "Rinunciare a passare del tutto alla frutta" },
      fatal: "N11", thesis: "Continua a mangiare quello che ami, ma in monoporzioni, con porzioni limitate e una salsa agrodolce rifatta", title: "Tieni i preferiti · limita e cambia salsa",
    },
  },
  recommend: { key: "alpha", why: "La frutta è naturalmente dolce e acidula, e tenere gli snack zuccherati fuori casa richiede meno forza di volontà" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tutte le tue voglie di agrodolce dipendono da un solo frutto o da una sola bevanda", kill: "Se quell'unica cosa finisce o ti stufa, tutto il piano crolla", label: "Un solo sostituto" },
};
