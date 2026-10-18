// 內建示範星系（IntentAnalysisResponse v1.0，加泰隆尼亞文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Com es divideix el codi", D2: "En què es diferencien els temes", D3: "Fins on arriba la personalització", D4: "Com es construeix la configuració del tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `L'altra banda: portar «${dims[dim]}» en el sentit contrari`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_CA = {
  schema_version: "1.0",
  core: {
    decision: "Cada marca ha de tenir la seva pròpia còpia dels components, o totes les marques han de compartir un mateix nucli i gestionar les diferències amb fitxers de configuració?",
    metric: "En 60 dies: un tema nou surt en 2 dies o menys, i el CSS de cada tema ocupa menys de 50KB",
  },
  quadrants: {
    Q1: { scar: "Components compartits plens de condicions per marca", sacred: "Cap comprovació de marca al nucli" },
    Q2: { scar: "Ha arreglat a mà les plantilles de més de 100 temes una per una", sacred: "Que la comprovació de tipus atrapi els errors" },
    Q3: { scar: "Va copiar el sistema de disseny d'un altre i el va complicar massa", sacred: "Peces que es canvien senceres" },
    Q4: { scar: "Ha vist la personalització descontrolar-se tres vegades", sacred: "Les capes es mantenen separades" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tres capes", "Dividir els components en tres capes: un nucli només amb la lògica, una vista que ho connecta tot i un full de tema per a l'estil; el nucli no pot importar identificadors de tema ni rutes", "Falla si en 14 dies apareix al nucli codi que comprova el tema", null),
    N2: node("D2", 0, 1, "Només vars CSS", "Escriure totes les diferències entre temes com a variables CSS (propietats personalitzades), sense cap comprovació de tema als components ni a les plantilles", "Falla si el 3r tema ja necessita canvis als components", "Les diferències de plantilla no es resolen només amb colors"),
    N3: node("D1", 1, 0, "Un sol tema", "Carregar només el full d'estil del tema actiu, en lloc d'incloure tots els temes en la primera càrrega de la pàgina", "Falla si en 14 dies el CSS d'algun tema supera els 50KB", null),
    N4: node("D4", 0, 2, "Config tipades", "Cada tema aporta un objecte de configuració TypeScript complet; si hi falta un camp, la build falla", "Falla si un tema nou encara obliga a canviar components compartits", null),
    N5: node("D3", 2, 0, "Còpia per marca", "Cada tema copia la carpeta de components i la modifica pel seu compte, perquè les marques no s'afectin mai", "Falla si, després del 10è tema, arreglar un error obliga a canviar més de 10 llocs", "Arreglar un error vol dir retocar cada còpia"),
    N6: node("D3", 1, 2, "Primer a pocs", "Activar cada tema nou només per al 5% dels clients durant una setmana, amb un interruptor; obrir-lo a tothom només si la taxa d'errors es manté dins l'objectiu", "Falla si la taxa d'errors supera l'1% durant aquella setmana", null),
    N7: node("D3", 2, 1, "Canviar closca", "Com els cotxes que comparteixen xassís i només canvien la carrosseria: es canvia una plantilla sencera, mentre la vista i el nucli compartits de sota no es mouen", "Falla si canviar de plantilla obliga a tocar el nucli", "Els controls poden comportar-se diferent d'una plantilla a una altra",
      { lateral: { src: "Cotxes: xassís compartit", dist: 2, drop: "Un motlle nou per a cada model" } }),
    N8: node("D2", 1, 0, "Espais fixos", "Com les peces de LEGO que només encaixen als seus tetons: les plantilles defineixen espais fixos, els temes només poden posar components en aquests espais i res més no pot canviar", "Falla si la pàgina (DOM) fora dels espais fixos es modifica ni que sigui una vegada", null,
      { lateral: { src: "Joguines: peces de LEGO", dist: 3, drop: "Modificar el DOM lliurement" } }),
    N9: node("D4", 2, 0, "Només canvis", "Com la negreta i la lleugera d'una mateixa tipografia: un tema només indica el que canvia respecte al tema per defecte, i la resta es manté automàticament", "Falla si l'herència passa de 3 nivells", null,
      { lateral: { src: "Tipografia: gruixos d'una font", dist: 4, drop: "Una còpia completa per tema" } }),
    N10: node("D2", 2, 0, "Límit de camps", "Si cada petició de personalització afegeix un camp de configuració, mantenir la configuració acabarà costant més que fer una simple còpia", "Deixar d'afegir camps quan una interfície de configuració passi de 40", "Tants paràmetres que ningú no els entén",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "L'abstracció acaba costant més que el codi copiat" } }),
    N11: node("D4", 1, 0, "Cap excepció", "Si la part de negoci pot exigir comprovacions de marca directament als components compartits, les capes no aguantaran ni un trimestre", "Abandonar aquest pla si en 14 dies s'afegeix ni que sigui 1 comprovació de marca als components compartits", "Sacrificar les capes per complir un termini",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Complir el termini es premia; trencar les capes no té cap conseqüència" } }),
    N12: node("D3", 0, 1, "A poc a poc", "Si cal migrar els 70 mòduls abans de publicar res, com més s'hi ha invertit més costa aturar-se, i la reescriptura sol encallar-se a mig camí", "Aturar-se si el primer mòdul no ha sortit en 14 dies", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Reescriure-ho tot de cop esbotza el calendari" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una configuració tipada compartida i una còpia separada per a cada marca: només se'n pot triar una" },
    { type: "excludes", from: "N1", to: "N5", why: "Un nucli compartit de tres capes i una còpia dels components per a cada marca: només se'n pot triar una" },
    { type: "excludes", from: "N4", to: "N11", why: "La configuració tipada ja bloqueja les dreceres durant la build, així que una revisió manual de les capes comprova dues vegades el mateix" },
    { type: "excludes", from: "N2", to: "N7", why: "Si els temes només canvien variables CSS, ningú no substitueix components de plantilla sencers" },
    { type: "excludes", from: "N2", to: "N10", why: "Amb només variables CSS no hi ha camps de configuració que s'acumulin; cal triar" },
    { type: "excludes", from: "N9", to: "N11", why: "L'herència permet que un tema canviï detalls localment, i això xoca amb una línia vermella que prohibeix saltar-se les capes" },
    { type: "requires", from: "N1", to: "N8", why: "Amb tres capes, els temes han de personalitzar a través d'espais fixos, o la capa de vista acaba plena de pedaços" },
    { type: "requires", from: "N4", to: "N10", why: "Les configuracions tipades necessiten un límit de camps, o creixen fins que ningú no les entén" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Feina de reescriptura al principi", v: "Res de còpies ràpides", t: "60 dies per muntar l'estructura", l: "Cal escriure proves completes", x: "Cap drecera especial per a les marques" },
      fatal: "N10", thesis: "Tres capes per als components i un fitxer de configuració tipat per tema, de manera que cada tema és només una configuració", title: "Governat per config · 3 capes",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca varietat de plantilles", v: "Menys llibertat de disseny", t: "Un petit canvi cada setmana", l: "Res de plantilles complexes", x: "Cap canvi a l'estructura de les pàgines" },
      fatal: "N12", thesis: "Només variables CSS i herència; mostrar els temes nous primer a pocs usuaris i després ampliar", title: "Només estils · llançament gradual",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Codi duplicat", v: "Les correccions toquen molts llocs", t: "El més ràpid de publicar", l: "Més temes, més manteniment", x: "Renunciar a la configuració tipada" },
      fatal: "N11", thesis: "Canviar plantilles senceres i deixar que cada marca copiï la seva pròpia closca", title: "Còpies per marca · xassís comú",
    },
  },
  recommend: { key: "alpha", why: "Amb més de 100 temes, només un enfocament governat per la configuració manté a ratlla els costos de manteniment" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Tots els temes hereten del mateix tema per defecte", kill: "Si el tema per defecte es trenca, es trenca la plantilla de tots els temes", label: "Un sol origen" },
};
