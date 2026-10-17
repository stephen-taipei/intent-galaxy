// 內建示範星系（IntentAnalysisResponse v1.0，墨西哥西班牙語版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Límites entre capas", D2: "Cómo se expresa la variación", D3: "Alcance de la personalización", D4: "Composición del tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Postura contraria: llevar "${dims[dim]}" al extremo opuesto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ES_MX = {
  schema_version: "1.0",
  core: {
    decision: "¿Cada marca debe hacer fork de sus propios componentes, o un único core compartido debe funcionar a base de configuración?",
    metric: "En 60 días: un tema nuevo sale en ≤2 días y el CSS de cada tema pesa <50KB",
  },
  quadrants: {
    Q1: { scar: "Componentes compartidos plagados de ifs por marca", sacred: "Cero ramificaciones en el core" },
    Q2: { scar: "Más de 100 temas parcheados a mano uno a uno", sacred: "Que los tipos detecten los errores" },
    Q3: { scar: "Copiamos un design system y acabamos sobreabstrayendo", sacred: "Estructura intercambiable" },
    Q4: { scar: "He visto la personalización salirse de control tres veces", sacred: "Los límites se respetan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Separar 3 capas", "Dividir los componentes en un core puro, una view que coordina y una hoja de theme; el core no puede importar IDs de tema ni rutas", "Falla si en 14 días aparecen comprobaciones de tema dentro del core", null),
    N2: node("D2", 0, 1, "Solo vars CSS", "Expresar todas las diferencias entre temas solo con custom properties de CSS, sin ninguna ramificación en componentes ni layouts", "Falla si el 3.er tema ya obliga a tocar componentes", "Las diferencias de layout no se resuelven solo con colores"),
    N3: node("D1", 1, 0, "CSS diferido", "En tiempo de ejecución, cargar solo la hoja de estilos del tema activo en vez de meter todos los temas en el primer render", "Falla si en 14 días el CSS de algún tema supera los 50KB", null),
    N4: node("D4", 0, 2, "Config. tipada", "Cada tema entrega un objeto de configuración TypeScript completo; si falta cualquier campo, el build falla", "Falla si un tema nuevo sigue obligando a cambiar componentes compartidos", null),
    N5: node("D3", 2, 0, "Fork por marca", "Cada tema copia el directorio de componentes y lo modifica por su cuenta, así ninguna marca afecta a otra", "Falla si, a partir del 10.º tema, arreglar un bug toca más de 10 lugares", "Arreglar un bug implica parchear N copias"),
    N6: node("D3", 1, 2, "Temas canary", "Lanzar cada tema nuevo tras un feature flag al 5 % de los tenants durante una semana; pasar al 100 % solo si la tasa de errores cumple el objetivo", "Falla si la tasa de errores del canary supera el 1 %", null),
    N7: node("D3", 2, 1, "Cambiar carcasa", "[D2 plataforma de auto] Los layouts son como carrocerías de auto: se cambia la carcasa entera mientras el chasis común (view y core) no se toca", "Falla si cambiar un layout exige tocar el core", "Las interacciones divergen entre layouts",
      { lateral: { src: "Industria automotriz: chasis compartido", dist: 2, drop: "Rediseñar cada modelo de auto desde cero" } }),
    N8: node("D2", 1, 0, "Slots fijos", "[D3 piezas de LEGO] Los layouts declaran slots fijos; los temas solo pueden encajar componentes en ellos y no pueden alterar la estructura fuera de los slots", "Falla si se modifica el DOM fuera de los slots aunque sea una vez", null,
      { lateral: { src: "Juguetes: encaje de piezas LEGO", dist: 3, drop: "Personalización libre del DOM" } }),
    N9: node("D4", 2, 0, "Heredar cambios", "[D4 familia tipográfica] Los temas declaran solo su diff respecto al tema por defecto; el resto de campos se hereda automáticamente", "Falla si la herencia pasa de 3 niveles", null,
      { lateral: { src: "Tipografía: familias de pesos", dist: 4, drop: "Copia completa por tema" } }),
    N10: node("D2", 2, 0, "Limitar claves", "Si cada solicitud de personalización agrega un campo de configuración, mantener la configuración acabará costando más que hacer fork sin más", "Dejar de agregar campos en cuanto una interfaz de configuración pase de 40 campos", "Infierno de configuración",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "La abstracción sale más cara que duplicar" } }),
    N11: node("D4", 1, 0, "Bloquear atajos", "Si el área de negocio puede exigir comprobaciones de marca directamente en los componentes compartidos, el límite caerá en menos de un trimestre", "Queda anulado si en 14 días se agrega alguna comprobación de marca a los componentes compartidos", "Cambiar límites por plazos",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "La presión de los plazos premia saltarse los límites" } }),
    N12: node("D3", 0, 1, "Sin big bang", "Si hay que migrar los 70 módulos antes de lanzar nada, el costo hundido dejará el refactor a medias", "Parar si el primer módulo no ha salido en 14 días", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Un refactor big bang secuestra los plazos" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Configuración tipada compartida o fork de componentes por marca: hay que elegir una" },
    { type: "excludes", from: "N1", to: "N5", why: "Un core compartido de tres capas y copias de componentes por marca son incompatibles" },
    { type: "excludes", from: "N4", to: "N11", why: "La configuración tipada ya bloquea los atajos al compilar, así que revisar los límites a mano sería un control redundante" },
    { type: "excludes", from: "N2", to: "N7", why: "Si los temas solo cambian variables CSS, no hay cambio de componentes de layout enteros" },
    { type: "excludes", from: "N2", to: "N10", why: "Con variables CSS puras no hay campos de configuración que se inflen; elige una" },
    { type: "excludes", from: "N9", to: "N11", why: "Las cadenas de herencia permiten sobrescrituras locales, lo que choca con una salvaguarda de cero atajos" },
    { type: "requires", from: "N1", to: "N8", why: "Una vez separadas las tres capas, los temas deben personalizar mediante slots fijos o la capa view acaba perforada" },
    { type: "requires", from: "N4", to: "N10", why: "La configuración tipada necesita un tope de campos o se convierte en un infierno de configuración" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Esfuerzo inicial de refactorización", v: "Sin forks rápidos", t: "60 días para montar el esqueleto", l: "Hay que escribir tests de integridad", x: "Sin atajos por marca" },
      fatal: "N10", thesis: "Límites de tres capas y configuración tipada reducen cada tema a una sola hoja", title: "Por configuración · 3 capas",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca variación de layout", v: "Menos libertad de diseño", t: "Pasos pequeños cada semana", l: "Los layouts complejos quedan descartados", x: "Sin personalización estructural" },
      fatal: "N12", thesis: "Solo variables CSS y herencia, lanzando los temas poco a poco tras canaries", title: "Solo estilos · gradual",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Código duplicado", v: "Arreglar un bug toca muchos lugares", t: "Lo más rápido de lanzar", l: "El costo de mantenimiento crece de forma lineal", x: "Renunciar a la configuración tipada" },
      fatal: "N11", thesis: "Cambiar layouts enteros y que cada marca haga fork de su propia carcasa", title: "Forks por marca · chasis común",
    },
  },
  recommend: { key: "alpha", why: "Con más de 100 temas, solo un diseño basado en configuración mantiene a raya el costo de mantenimiento" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos los temas heredan del mismo tema por defecto", kill: "Si se rompe el tema por defecto, se rompe el layout de todos los temas", label: "SPOF tema base" },
};
