// 擴充功能生活題示範星系（墨西哥西班牙語版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Ubicación", D2: "Cómo elegir", D3: "Cuánta remodelación", D4: "Capacidad y vajilla" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La postura contraria lleva "${dims[dim]}" al extremo opuesto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_ES_MX = {
  schema_version: "1.0",
  core: {
    decision: "¿Remodelas la cocina para meter una lavavajillas, o eliges una que quepa en la cocina que ya tienes?",
    metric: "En los primeros 30 días, ponerla al menos 5 veces por semana y no pasar más de 5 minutos al día lavando trastes a mano",
  },
  quadrants: {
    Q1: { scar: "Compré una lavavajillas y sigo lavando trastes a mano", sacred: "Primero cuenta tus platos" },
    Q2: { scar: "A mitad de instalación vi que la manguera no llegaba", sacred: "Mide antes de comprar" },
    Q3: { scar: "La compré por un ranking de internet y no cabía", sacred: "Toma ideas de otros campos" },
    Q4: { scar: "He visto tres lavavajillas terminar de escurridor de trastes", sacred: "Planifica primero el fallo" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Empotrada", "Quitar el gabinete de 45 o 60 cm junto a la tarja y empotrar ahí la lavavajillas, para que no ocupe barra ni estorbe el paso", "No encaja si el hueco del gabinete es más pequeño en ancho, alto o fondo que las medidas para empotrar del aparato", null),
    N2: node("D2", 0, 1, "Tras comer", "Elegir una con programa rápido de menos de 1 hora y ponerla después de cada comida, para que nunca se queden platos sucios en la tarja toda la noche", "No encaja si en 14 días los platos salen grasientos del programa rápido más de 2 veces", "Los programas rápidos no suelen secar, así que vas a tener que dejar secar la vajilla al aire"),
    N3: node("D1", 1, 0, "Tarja cercana", "Colocar el aparato a menos de 1 metro de la tarja y conectar el desagüe directo a la coladera de la tarja, sin perforar paredes ni cambiar la plomería", "No encaja si la manguera de desagüe que trae no llega a la tarja y necesitas una extensión", null),
    N4: node("D4", 0, 2, "Para la familia", "Si en casa son 3 o más, optar por una de 12 servicios o más, para que ollas y platos entren en una sola tanda en vez de dos", "No encaja si en 14 días hay más de 2 días en que platos y ollas no caben en una sola tanda", null),
    N5: node("D3", 2, 0, "Mini de barra", "Comprar una mini de barra de 8 servicios o menos: sin quitar gabinetes, sin cambiar la plomería y te la llevas si te mudas", "No encaja si en 14 días hay más de 3 días en que hacen falta 2 lavados para dejarlo todo limpio", "Se come buena parte de la barra donde preparas comida"),
    N6: node("D3", 1, 2, "Probar primero", "Comprar una que funcione independiente o empotrada, tenerla junto a la tarja 30 días completos y luego decidir si quitas el gabinete, en vez de desmontarlo el primer día", "No encaja si durante los 30 días de prueba el aparato estorba el paso o bloquea un cajón", null),
    N7: node("D3", 2, 1, "Con tanque", "Como una casa rodante con su propio tanque de agua, elegir una de barra que se llena a mano: sin conectarla a la llave ni cambiar la plomería", "No encaja si alguna semana te la saltas y lavas a mano 2 o más veces por flojera de llenarla", "Llenarla da más flojera de lo que parece",
      { lateral: { src: "Campismo: tanque de agua integrado", dist: 2, drop: "Conexión fija a la llave del agua" } }),
    N8: node("D2", 1, 0, "Medir antes", "Como la lista de comprobación de un piloto antes de despegar, medir ancho, fondo y alto antes de pedirlo, y luego comprobar dónde están el contacto y el desagüe; si falta alguno de los 5, no se pide", "No encaja si algo no cuadra o no se puede instalar cuando llega", null,
      { lateral: { src: "Aviación: checklist prevuelo", dist: 3, drop: "Pedir al tanteo" } }),
    N9: node("D4", 2, 0, "Vajilla apta", "Como un restaurante que solo usa vajilla apta para lavavajillas, sustituir toda olla y plato marcado como no apto, para que no quede nada que lavar a mano", "No encaja si en los 14 días tras el cambio sigues lavando a mano más de 3 piezas al día", null,
      { lateral: { src: "Restaurantes: vajilla profesional", dist: 4, drop: "Trastes viejos revueltos en casa" } }),
    N10: node("D2", 2, 0, "Sin media carga", "Si la pones a menos de media carga, gasta casi la misma agua y electricidad que llena, así que cada plato sale más del doble de caro", "Anota tus platos 7 días antes de pedirlo; si sale una media de menos de 6 servicios al día, cámbiate a una mini", "Los platos empiezan a oler mientras esperas a llenarla",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Poner una máquina grande medio vacía no compensa" } }),
    N11: node("D4", 1, 0, "Ollas fuera", "Si metes woks y ollas grandes por comodidad, en una mini no cabe la vajilla en una tanda y acabas lavando trastes a mano otra vez", "Se descarta si en 14 días las ollas obligan a una segunda tanda más de 2 veces", "No todos en casa van a cumplir la norma",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Sobrecargar la máquina por comodidad" } }),
    N12: node("D3", 0, 1, "Sin remodelar", "Si instalar una lavavajillas termina en remodelar toda la cocina, una vez empezada la obra y pagado el dinero, no te queda otra que terminarla", "No empieces si el presupuesto que te dan antes de quitar el gabinete supera 2 veces el precio del aparato", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Empezada la obra, ya no hay vuelta atrás" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Una de 12 servicios o más no cabe en la barra, así que o es esa o es una mini de barra" },
    { type: "excludes", from: "N1", to: "N5", why: "Si ya tienes una empotrada en el gabinete, no vas a comprar además una mini de barra; es una u otra" },
    { type: "excludes", from: "N4", to: "N11", why: "Elegir tamaño familiar es precisamente para lavar también las ollas, lo que choca con dejarlas fuera" },
    { type: "excludes", from: "N2", to: "N7", why: "Ponerla después de cada comida implica llenar el tanque a mano tres veces al día, algo difícil de mantener" },
    { type: "excludes", from: "N2", to: "N10", why: "Ponerla después de cada comida suele ser a menos de media carga, lo que choca con la regla de no hacer medias cargas" },
    { type: "excludes", from: "N9", to: "N11", why: "Cambiar a ollas y platos aptos es precisamente para meterlos, lo que choca con dejar las ollas fuera" },
    { type: "requires", from: "N1", to: "N8", why: "Con 1 cm de error ya no entra en el hueco, así que hay que medirlo todo antes de pedirlo" },
    { type: "requires", from: "N4", to: "N10", why: "Una máquina grande medio vacía gasta el agua y la electricidad de una carga completa, así que nada de medias cargas" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Desmontaje del gabinete y mano de obra de instalación", v: "Un gabinete menos para guardar cosas", t: "Esperar a que el instalador mida y monte", l: "Esperar a media carga para ponerla", x: "Renunciar a la mini de barra" },
      fatal: "N10", thesis: "Medir el hueco, empotrar una máquina grande y ponerla solo a partir de media carga", title: "Empotrada grande, de una vez",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ollas y platos nuevos, más agua y electricidad en cada comida", v: "Estorba al pasar durante la prueba", t: "El gabinete se quita solo tras 30 días", l: "Secar la vajilla al aire tras el programa rápido", x: "Renunciar a la mini de barra" },
      fatal: "N12", thesis: "Lavado rápido tras cada comida; junto a la tarja hasta que funcione y luego empotrarla", title: "Rápido a diario, probar antes de empotrar",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Llenar el agua a mano en cada lavado", v: "Ocupa buena parte de la barra", t: "Lavar las ollas a mano a diario", l: "8 servicios o menos", x: "Renunciar a empotrarla y a la gran capacidad" },
      fatal: "N11", thesis: "Una mini de barra que llenas tú; las ollas, a mano", title: "Mini de barra, sin plomería",
    },
  },
  recommend: { key: "alpha", why: "En un hogar de 3 o más personas, una máquina grande se encarga de los platos de todo el día en una sola tanda" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Los platos de toda la familia dependen de este único aparato; si se descompone, la única alternativa es lavar a mano", kill: "Se descarta si una reparación tarda más de 7 días y la familia vuelve a lavar a mano", label: "Aparato único" },
};
