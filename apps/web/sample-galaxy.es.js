// 內建示範星系（IntentAnalysisResponse v1.0，西班牙語版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Cómo se reparte el código en capas", D2: "En qué se diferencian los temas", D3: "Hasta dónde llega la personalización", D4: "Cómo se definen los ajustes del tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La otra cara: llevar «${dims[dim]}» en sentido contrario`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ES = {
  schema_version: "1.0",
  core: {
    decision: "¿Cada marca debe tener su propia copia (fork) de los componentes, o todas deben compartir un mismo núcleo y cambiar las diferencias con archivos de configuración?",
    metric: "En 60 días: un tema nuevo sale en 2 días o menos, y el CSS de cada tema pesa menos de 50KB",
  },
  quadrants: {
    Q1: { scar: "Componentes compartidos llenos de ifs por marca", sacred: "Nada de comprobar la marca en el núcleo" },
    Q2: { scar: "Arreglé a mano los layouts de más de 100 temas", sacred: "Que la comprobación de tipos pille los errores" },
    Q3: { scar: "Copiamos el design system de otros y lo complicamos de más", sacred: "Piezas que se cambian enteras" },
    Q4: { scar: "He visto la personalización descontrolarse tres veces", sacred: "Las capas no se saltan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Separar 3 capas", "Dividir los componentes en tres capas: un núcleo solo con la lógica, una view que lo conecta todo y una capa de tema para los estilos; el núcleo no puede importar IDs de tema ni rutas", "Falla si en 14 días aparece en el núcleo código que comprueba el tema", null),
    N2: node("D2", 0, 1, "Solo vars CSS", "Expresar todas las diferencias entre temas con variables CSS (custom properties), sin ninguna comprobación de tema en componentes ni layouts", "Falla si el 3.er tema ya obliga a cambiar componentes", "Las diferencias de layout no se resuelven solo con colores"),
    N3: node("D1", 1, 0, "Cargar un tema", "Al ejecutar, cargar solo la hoja de estilos del tema actual en vez de meter todos los temas en la primera carga de la página", "Falla si en 14 días el CSS de algún tema pasa de 50KB", null),
    N4: node("D4", 0, 2, "Config. tipada", "Cada tema entrega un objeto de configuración TypeScript completo; si falta cualquier campo, el build falla", "Falla si un tema nuevo sigue obligando a cambiar componentes compartidos", null),
    N5: node("D3", 2, 0, "Copia por marca", "Cada tema copia la carpeta de componentes y la modifica por su cuenta, así ninguna marca afecta a otra", "Falla si, a partir del 10.º tema, arreglar un bug obliga a cambiar más de 10 sitios", "Arreglar un bug implica parchear todas las copias"),
    N6: node("D3", 1, 2, "Pocos usuarios", "Activar cada tema nuevo solo para el 5 % de los clientes durante una semana (con un interruptor de funciones); abrirlo a todos solo si la tasa de errores se mantiene dentro del objetivo", "Falla si la tasa de errores pasa del 1 % durante esa semana", null),
    N7: node("D3", 2, 1, "Cambiar carcasa", "Como los coches que comparten chasis y solo cambian la carrocería: se cambia un layout entero mientras la view y el núcleo compartidos de debajo no se tocan", "Falla si cambiar un layout obliga a tocar el núcleo", "Los controles pueden comportarse distinto de un layout a otro",
      { lateral: { src: "Coches: chasis compartido", dist: 2, drop: "Un molde nuevo para cada modelo" } }),
    N8: node("D2", 1, 0, "Huecos fijos", "Como las piezas de LEGO, que solo encajan en sus tetones: los layouts definen huecos fijos (slots), los temas solo pueden poner componentes en esos huecos y no se puede cambiar nada fuera de ellos", "Falla si se cambia el DOM fuera de los huecos aunque sea una vez", null,
      { lateral: { src: "Juguetes: piezas de LEGO", dist: 3, drop: "Tocar el DOM libremente" } }),
    N9: node("D4", 2, 0, "Heredar la base", "Como la negrita y la fina de una misma tipografía: un tema solo indica en qué se diferencia del tema por defecto, y el resto de campos se hereda automáticamente", "Falla si la herencia pasa de 3 niveles", null,
      { lateral: { src: "Tipografía: pesos de una fuente", dist: 4, drop: "Una copia completa por tema" } }),
    N10: node("D2", 2, 0, "Limitar campos", "Si cada petición de personalización añade un campo de configuración, mantener la configuración acabará costando más que copiar el código sin más", "Dejar de añadir campos en cuanto una sola interfaz de configuración pase de 40", "Tantos ajustes que nadie los entiende",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "La abstracción acaba costando más que el código copiado" } }),
    N11: node("D4", 1, 0, "Sin apaños", "Si negocio puede exigir comprobaciones de marca directamente en los componentes compartidos, la separación en capas se vendrá abajo en menos de un trimestre", "Descartar este plan si en 14 días se añade aunque sea 1 comprobación de marca a los componentes compartidos", "Saltarse las capas para llegar a una fecha",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Llegar a la fecha se premia; saltarse las capas sale gratis" } }),
    N12: node("D3", 0, 1, "Sin rehacerlo", "Si hay que pasar los 70 módulos antes de lanzar nada, cuanto más hayas invertido, más cuesta parar, y la reescritura suele quedarse a medias", "Parar si el primer módulo no ha salido en 14 días", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Reescribirlo todo de golpe destroza el calendario" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una configuración tipada compartida o una copia distinta para cada marca: solo puedes elegir una" },
    { type: "excludes", from: "N1", to: "N5", why: "Un núcleo compartido de tres capas o una copia de los componentes para cada marca: solo puedes elegir una" },
    { type: "excludes", from: "N4", to: "N11", why: "La configuración tipada ya bloquea los atajos al hacer el build, así que revisar las capas a mano es comprobar lo mismo dos veces" },
    { type: "excludes", from: "N2", to: "N7", why: "Si los temas solo cambian variables CSS, nadie cambia componentes de layout enteros" },
    { type: "excludes", from: "N2", to: "N10", why: "Con solo variables CSS no hay campos de configuración que se acumulen; elige una" },
    { type: "excludes", from: "N9", to: "N11", why: "La herencia deja que un tema cambie cosas sueltas por su cuenta, y eso choca con la señal de alerta de no saltarse nunca las capas" },
    { type: "requires", from: "N1", to: "N8", why: "Con tres capas, los temas tienen que personalizar mediante huecos fijos, o la capa view acaba llena de parches" },
    { type: "requires", from: "N4", to: "N10", why: "La configuración tipada necesita un tope de campos, o crece hasta que nadie la entiende" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Trabajo inicial de reescritura", v: "Nada de copias rápidas", t: "60 días para montar la estructura", l: "Hay que escribir pruebas a fondo", x: "Nada de atajos especiales para marcas" },
      fatal: "N10", thesis: "Tres capas para los componentes y un archivo de configuración tipado por tema, así cada tema es solo una configuración", title: "Por configuración · 3 capas",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Poca variedad de layouts", v: "Menos libertad de diseño", t: "Un pequeño cambio cada semana", l: "Los layouts complejos quedan descartados", x: "Sin cambios en la estructura de la página" },
      fatal: "N12", thesis: "Solo variables CSS y herencia; enseñar los temas nuevos primero a pocos usuarios y luego ampliar", title: "Solo estilos · poco a poco",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Código duplicado", v: "Arreglar un bug toca muchos sitios", t: "Lo más rápido de lanzar", l: "Más temas, más mantenimiento", x: "Renunciar a la configuración tipada" },
      fatal: "N11", thesis: "Cambiar layouts enteros y que cada marca tenga su propia copia de la carcasa", title: "Copias por marca · chasis común",
    },
  },
  recommend: { key: "alpha", why: "Con más de 100 temas, solo un enfoque basado en configuración mantiene a raya el coste de mantenimiento" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos los temas heredan del mismo tema por defecto", kill: "Si se rompe el tema por defecto, se rompe el layout de todos los temas", label: "Todo en un tema" },
};
