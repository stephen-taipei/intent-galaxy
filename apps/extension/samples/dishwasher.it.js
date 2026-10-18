// 擴充功能生活題示範星系（義大利文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Posizionamento", D2: "Come scegliere", D3: "Quanti lavori fare", D4: "Capienza e stoviglie" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'altra parte porta ${dims[dim]} all'estremo opposto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_IT = {
  schema_version: "1.0",
  core: {
    decision: "Conviene adattare la cucina a una lavastoviglie, o sceglierne una che entri nella cucina che hai già?",
    metric: "Nei primi 30 giorni, usarla almeno 5 volte a settimana e non passare più di 5 minuti al giorno a lavare i piatti a mano",
  },
  quadrants: {
    Q1: { scar: "Ha comprato la lavastoviglie e lava ancora a mano", sacred: "Prima conta le tue stoviglie" },
    Q2: { scar: "Ha scoperto durante l'installazione che il tubo era troppo corto", sacred: "Misura prima di comprare" },
    Q3: { scar: "Ha comprato la prima di una classifica online e non ci stava", sacred: "Prendere idee da altri settori" },
    Q4: { scar: "Ha visto tre lavastoviglie finire a fare da scolapiatti", sacred: "Pensa a come potrebbe andare storto" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Incasso lavello", "Togliere il mobile da 45 o 60 cm accanto al lavello e incassarci la macchina, così non occupa il piano di lavoro e non intralcia il passaggio", "Non va bene se larghezza, altezza o profondità del vano sono inferiori alle misure da incasso della macchina", null),
    N2: node("D2", 0, 1, "Dopo ogni pasto", "Scegliere un modello con un programma rapido sotto l'ora e farlo partire dopo ogni pasto, così i piatti sporchi non restano mai nel lavello durante la notte", "Non va bene se in 14 giorni i piatti restano unti dopo il rapido più di 2 volte", "I programmi rapidi spesso saltano l'asciugatura: i piatti si asciugano all'aria"),
    N3: node("D1", 1, 0, "Vicino lavello", "Mettere la macchina entro 1 metro dal lavello e portare il tubo di scarico direttamente nello scarico del lavello, senza forare muri né rifare l'impianto idraulico", "Non va bene se il tubo di scarico in dotazione non arriva al lavello e serve una prolunga", null),
    N4: node("D4", 0, 2, "Per la famiglia", "Con 3 o più persone in casa, puntare su 12 coperti o più, così pentole e piatti entrano in un solo lavaggio invece di due", "Non va bene se, più di 2 giorni su 14, piatti e pentole non stanno in un solo lavaggio", null),
    N5: node("D3", 2, 0, "Mini da piano", "Comprare una mini lavastoviglie da appoggio da 8 coperti o meno: niente mobili da smontare, niente modifiche all'impianto, e trasloca con te", "Non va bene se, più di 3 giorni su 14, servono 2 lavaggi per pulire tutto", "Si mangia una bella fetta del piano di lavoro"),
    N6: node("D3", 1, 2, "Prova e incassa", "Comprare un modello che funzioni sia libero sia da incasso, tenerlo vicino al lavello per 30 giorni pieni e poi decidere se togliere il mobile, invece di smontarlo il primo giorno", "Non va bene se, durante i 30 giorni di prova, la macchina blocca il passaggio o un cassetto", null),
    N7: node("D3", 2, 1, "Con serbatoio", "Come un camper con il suo serbatoio d'acqua, scegliere un modello da appoggio da riempire a mano: niente allaccio al rubinetto, niente modifiche all'impianto", "Non va bene se, in una settimana qualsiasi, la salti 2 o più volte e lavi a mano perché non hai voglia di riempirla", "Riempirla è più scocciante di quanto pensi",
      { lateral: { src: "Campeggio: serbatoio d'acqua integrato", dist: 2, drop: "Allaccio fisso al rubinetto" } }),
    N8: node("D2", 1, 0, "Misura prima", "Come la checklist pre-volo di un pilota: misurare larghezza, profondità e altezza prima di ordinare, poi controllare presa e scarico; se manca anche uno dei 5 punti, non si ordina", "Non va bene se qualcosa non corrisponde o non si riesce a installarla all'arrivo", null,
      { lateral: { src: "Aviazione: checklist pre-volo", dist: 3, drop: "Ordinare a sentimento" } }),
    N9: node("D4", 2, 0, "Tutto lavabile", "Come un ristorante che usa solo stoviglie a prova di lavastoviglie, sostituire tutte le pentole e i piatti segnati come non lavabili in lavastoviglie, senza lasciare niente da lavare a mano", "Non va bene se, nei 14 giorni dopo il cambio, lavi ancora a mano più di 3 pezzi al giorno", null,
      { lateral: { src: "Ristorazione: stoviglie professionali", dist: 4, drop: "Servizio spaiato di piatti vecchi" } }),
    N10: node("D2", 2, 0, "Mai a metà", "Se la fai partire meno che mezza piena consuma quasi quanta acqua e corrente di un carico pieno, quindi ogni piatto costa più del doppio", "Annota i piatti per 7 giorni prima di ordinare; se la media è sotto i 6 coperti al giorno, passa a una mini", "I piatti iniziano a puzzare mentre aspetti il carico pieno",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Far girare una macchina grande mezza vuota non conviene" } }),
    N11: node("D4", 1, 0, "Niente pentole", "Se per comodità ci infili wok e pentoloni, una mini non riesce a lavare tutto in un solo ciclo e finisci per lavare di nuovo a mano", "Da scartare se in 14 giorni le pentole costringono a un secondo lavaggio più di 2 volte", "Non tutti in casa rispetteranno la regola",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Sovraccaricare la macchina per comodità" } }),
    N12: node("D3", 0, 1, "Niente lavori", "Se montare una lavastoviglie si trasforma nel rifare tutta la cucina, una volta partiti i lavori e pagati i soldi sei costretto ad andare fino in fondo", "Non iniziare se il preventivo ottenuto prima di togliere il mobile supera 2 volte il prezzo della macchina", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Una volta iniziati i lavori, non si torna indietro" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una macchina da 12 coperti o più non sta sul piano di lavoro: o quella o la mini da appoggio" },
    { type: "excludes", from: "N1", to: "N5", why: "Una volta incassata una macchina nel mobile, non compri anche una mini da appoggio; o l'una o l'altra" },
    { type: "excludes", from: "N4", to: "N11", why: "Prenderla a misura di famiglia serve proprio a lavare anche le pentole, il che contraddice il tenerle fuori" },
    { type: "excludes", from: "N2", to: "N7", why: "Farla partire dopo ogni pasto significa riempire il serbatoio a mano tre volte al giorno, difficile da reggere" },
    { type: "excludes", from: "N2", to: "N10", why: "Farla partire dopo ogni pasto spesso vuol dire meno di mezzo carico, il che contraddice la regola mai a metà" },
    { type: "excludes", from: "N9", to: "N11", why: "Passare a pentole e piatti lavabili in lavastoviglie serve proprio a metterli dentro, il che contraddice il tenere fuori le pentole" },
    { type: "requires", from: "N1", to: "N8", why: "Basta 1 cm di troppo e non entra nel vano, quindi bisogna misurare tutto prima di ordinare" },
    { type: "requires", from: "N4", to: "N10", why: "Una macchina grande mezza vuota consuma comunque acqua e corrente di un carico pieno, quindi resta la regola mai a metà" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Smontaggio del mobile e manodopera", v: "Un mobile contenitore in meno", t: "Aspettare che un installatore misuri e monti", l: "Aspettare mezzo carico prima di avviarla", x: "Rinunciare alla mini da appoggio" },
      fatal: "N10", thesis: "Misura il vano, incassa una macchina grande e avviala solo quando è almeno mezza piena", title: "Grande da incasso, una volta per tutte",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Pentole e piatti nuovi, più acqua e corrente a ogni pasto", v: "Ingombra il passaggio durante la prova", t: "Il mobile si toglie solo dopo 30 giorni", l: "Asciugatura all'aria dopo i rapidi", x: "Rinunciare alla mini da appoggio" },
      fatal: "N12", thesis: "Lavaggio rapido dopo ogni pasto; tienila vicino al lavello finché funziona, poi incassala", title: "Rapido ogni giorno, prova prima dell'incasso",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Riempire l'acqua a mano a ogni lavaggio", v: "Occupa una bella fetta del piano di lavoro", t: "Pentole a mano tutti i giorni", l: "8 coperti o meno", x: "Rinunciare a incasso e grande capienza" },
      fatal: "N11", thesis: "Una mini da appoggio che riempi tu; le pentole restano da lavare a mano", title: "Mini da appoggio, senza impianto",
    },
  },
  recommend: { key: "alpha", why: "Per una famiglia di 3 o più persone, una macchina grande smaltisce i piatti di un'intera giornata in un solo lavaggio" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "I piatti di tutta la famiglia dipendono da quest'unica macchina; se si guasta, l'unico piano B è lavare a mano", kill: "Da scartare se una riparazione richiede più di 7 giorni e la famiglia torna a lavare a mano", label: "Macchina unica" },
};
