// 內建示範星系（IntentAnalysisResponse v1.0，加泰隆尼亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Límits entre capes", D2: "Com s'expressen les variants", D3: "Abast de la personalització", D4: "Composició dels temes" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Posició contrària: portar ${dims[dim]} a l'extrem oposat`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_CA = {
  schema_version: "1.0",
  core: {
    decision: "Cada marca hauria de fer un fork dels seus components, o cal un únic core compartit governat per configuració?",
    metric: "En 60 dies: un tema nou en producció en ≤2 dies, i el CSS de cada tema <50KB",
  },
  quadrants: {
    Q1: { scar: "Components compartits plens d'ifs per marca", sacred: "Zero branques al core" },
    Q2: { scar: "Més de 100 temes apedaçats un per un", sacred: "Els tipus atrapen els errors" },
    Q3: { scar: "Va copiar un design system i el va sobreabstraure", sacred: "Estructura intercanviable" },
    Q4: { scar: "Ha vist la personalització desbocar-se tres vegades", sacred: "Els límits aguanten" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tres capes", "Dividir els components en un core pur, una view de coordinació i una fulla theme; el core no pot importar IDs de tema ni rutes", "Erroni si en 14 dies apareixen comprovacions de tema al core", null),
    N2: node("D2", 0, 1, "Només vars CSS", "Expressar totes les diferències entre temes només amb custom properties de CSS, sense cap branca als components ni als layouts", "Erroni si el 3r tema ja requereix canvis als components", "Les diferències de layout no s'expressen només amb colors"),
    N3: node("D1", 1, 0, "Lazy-load CSS", "En temps d'execució, carregar només el full d'estil del tema actiu en lloc d'incloure tots els temes a la primera càrrega", "Erroni si en 14 dies el CSS d'un sol tema supera els 50KB", null),
    N4: node("D4", 0, 2, "Config tipades", "Cada tema aporta un objecte de config TypeScript complet; qualsevol camp que falti fa fallar el build", "Erroni si un tema nou encara requereix canvis als components compartits", null),
    N5: node("D3", 2, 0, "Fork per marca", "Cada tema copia el directori de components i el modifica pel seu compte, així les marques no s'afecten mai entre elles", "Erroni si, després del 10è tema, arreglar un bug toca més de 10 llocs", "Un arranjament vol dir apedaçar N còpies"),
    N6: node("D3", 1, 2, "Temes canary", "Publicar cada tema nou darrere d'un feature flag per al 5% dels tenants durant una setmana; passar al 100% només si la taxa d'errors és dins l'objectiu", "Erroni si la taxa d'errors del canary supera l'1%", null),
    N7: node("D3", 2, 1, "Canviar closca", "[D2 plataforma de cotxe] Els layouts són com carrosseries: es canvia tota la closca mentre el xassís compartit (view i core) no es mou", "Erroni si canviar de layout requereix tocar el core", "Les interaccions divergeixen entre layouts",
      { lateral: { src: "Automoció: xassís de plataforma", dist: 2, drop: "Reequipar cada model des de zero" } }),
    N8: node("D2", 1, 0, "Slots fixos", "[D3 peces de LEGO] Els layouts declaren slots fixos; els temes només poden encaixar components als slots i no poden alterar l'estructura de fora", "Erroni si el DOM de fora dels slots es modifica encara que sigui un cop", null,
      { lateral: { src: "Joguines: l'encaix de les peces LEGO", dist: 3, drop: "Personalització lliure del DOM" } }),
    N9: node("D4", 2, 0, "Heretar el diff", "[D4 família tipogràfica] Els temes només declaren la seva diferència respecte del default; la resta de camps s'hereten automàticament", "Erroni si l'herència supera els 3 nivells", null,
      { lateral: { src: "Tipografia: famílies de pesos", dist: 4, drop: "Còpia completa per tema" } }),
    N10: node("D2", 2, 0, "Límit de claus", "Si cada petició de personalització afegeix un camp de config, mantenir la config acabarà costant més que fer un fork", "Deixar d'afegir camps quan una interfície de config superi els 40 camps", "L'infern de la config",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'abstracció costa més que la duplicació" } }),
    N11: node("D4", 1, 0, "Zero bypass", "Si negoci pot exigir comprovacions de marca directament als components compartits, el límit caurà en menys d'un trimestre", "Invàlid si en 14 dies s'afegeix una comprovació de marca als components compartits", "Canviar límits per terminis",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "La pressió dels terminis premia saltar-se els límits" } }),
    N12: node("D3", 0, 1, "Sense big bang", "Si cal migrar els 70 mòduls abans de publicar res, el cost enfonsat aturarà el refactor a mig camí", "Aturar-se si el primer mòdul no és en producció en 14 dies", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Un refactor big bang segresta els terminis" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una config tipada compartida i forks de components per marca són excloents: o una cosa o l'altra" },
    { type: "excludes", from: "N1", to: "N5", why: "Un core compartit de tres capes i còpies de components per marca s'exclouen mútuament" },
    { type: "excludes", from: "N4", to: "N11", why: "La config tipada ja bloqueja els bypass en compilació, així que una revisió manual dels límits esdevé una línia vermella redundant" },
    { type: "excludes", from: "N2", to: "N7", why: "Si els temes només canvien variables CSS, no se substitueixen components de layout sencers" },
    { type: "excludes", from: "N2", to: "N10", why: "Les variables CSS pures no tenen camps de config per inflar; cal triar" },
    { type: "excludes", from: "N9", to: "N11", why: "Les cadenes d'herència permeten sobreescriptures locals, cosa que xoca amb una línia vermella de zero bypass" },
    { type: "requires", from: "N1", to: "N8", why: "Un cop dividit en tres capes, els temes han de personalitzar mitjançant slots fixos; si no, la capa view queda foradada" },
    { type: "requires", from: "N4", to: "N10", why: "Les config tipades necessiten un límit de camps; si no, s'inflen fins a l'infern de la config" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Esforç de refactor inicial", v: "Sense forks ràpids", t: "60 dies per muntar l'esquelet", l: "Cal escriure tests d'integritat", x: "Sense dreceres específiques de marca" },
      fatal: "N10", thesis: "Límits de tres capes i config tipada redueixen cada tema a una sola fulla", title: "Governat per config · 3 capes",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca variació de layout", v: "Menys llibertat de disseny", t: "Passos petits cada setmana", l: "Res de layouts complexos", x: "Sense personalització estructural" },
      fatal: "N12", thesis: "Només variables CSS i herència, desplegant els temes de mica en mica amb canaries", title: "Només estils · gradual",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Codi duplicat", v: "Els arranjaments toquen molts llocs", t: "El més ràpid de publicar", l: "Cost de manteniment lineal", x: "Renunciar a la config tipada" },
      fatal: "N11", thesis: "Canviar layouts sencers i deixar que cada marca faci un fork de la seva pròpia closca", title: "Forks per marca · xassís comú",
    },
  },
  recommend: { key: "alpha", why: "Amb més de 100 temes, només un disseny governat per config manté a ratlla el cost de manteniment" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tots els temes hereten del mateix tema per defecte", kill: "Si el default es trenca, es trenca el layout de tots els temes", label: "SPOF del default" },
};
