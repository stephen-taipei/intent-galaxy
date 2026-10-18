// 擴充功能生活題示範星系（西班牙語版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Ubicación", D2: "Cómo elegir", D3: "Cuánta obra", D4: "Capacidad y vajilla" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La postura contraria lleva «${dims[dim]}» al extremo opuesto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_ES = {
  schema_version: "1.0",
  core: {
    decision: "¿Reformas la cocina para meter un lavavajillas, o eliges uno que quepa en la cocina que ya tienes?",
    metric: "En los primeros 30 días, ponerlo al menos 5 veces por semana y no pasar más de 5 minutos al día fregando a mano",
  },
  quadrants: {
    Q1: { scar: "Compré un lavavajillas y sigo fregando a mano", sacred: "Primero cuenta tus platos" },
    Q2: { scar: "A mitad de instalación vi que la manguera no llegaba", sacred: "Mide antes de comprar" },
    Q3: { scar: "Lo compré por un ranking de internet y no cabía", sacred: "Coge ideas de otros campos" },
    Q4: { scar: "He visto tres lavavajillas acabar de escurreplatos", sacred: "Piensa bien en cómo podría fallar" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Integrable", "Quitar el módulo de 45 o 60 cm junto al fregadero e integrar ahí el lavavajillas, para que no ocupe encimera ni estorbe al pasar", "No encaja si el hueco del mueble es más pequeño en ancho, alto o fondo que las medidas de integración del aparato", null),
    N2: node("D2", 0, 1, "Tras comer", "Elegir un modelo con programa rápido de menos de 1 hora y ponerlo después de cada comida, para que nunca se queden platos sucios en el fregadero por la noche", "No encaja si en 14 días los platos salen grasientos del programa rápido más de 2 veces", "Los programas rápidos no suelen secar, así que te tocará dejar secar la vajilla al aire"),
    N3: node("D1", 1, 0, "Cerca del grifo", "Colocar el aparato a menos de 1 metro del fregadero y llevar el desagüe directo al sifón, sin agujerear paredes ni tocar fontanería", "No encaja si la manguera de desagüe que trae no llega al fregadero y hace falta un alargador", null),
    N4: node("D4", 0, 2, "Para la familia", "Si en casa sois 3 o más, ir a por uno de 12 servicios o más, para que ollas y platos entren en una sola tanda en vez de dos", "No encaja si en 14 días hay más de 2 días en que platos y ollas no caben en una sola tanda", null),
    N5: node("D3", 2, 0, "Mini sobremesa", "Comprar un mini de sobremesa de 8 servicios o menos: sin quitar módulos, sin tocar fontanería y te lo llevas si te mudas", "No encaja si en 14 días hay más de 3 días en que hacen falta 2 lavados para dejarlo todo limpio", "Se come un buen trozo de encimera de trabajo"),
    N6: node("D3", 1, 2, "Probar primero", "Comprar un modelo que funcione de libre instalación o integrado, tenerlo junto al fregadero 30 días enteros y luego decidir si quitas el módulo, en vez de desmontarlo el primer día", "No encaja si durante los 30 días de prueba el aparato estorba al pasar o bloquea un cajón", null),
    N7: node("D3", 2, 1, "Con depósito", "Como una autocaravana con su propio depósito de agua, elegir un modelo de sobremesa que se llena a mano: sin conectar al grifo ni tocar fontanería", "No encaja si alguna semana te lo saltas y friegas a mano 2 o más veces por pereza de llenarlo", "Llenarlo da más pereza de lo que parece",
      { lateral: { src: "Camping: depósito de agua integrado", dist: 2, drop: "Toma de agua fija al grifo" } }),
    N8: node("D2", 1, 0, "Medir antes", "Como la lista de comprobación de un piloto antes de despegar, medir ancho, fondo y alto antes de pedirlo, y luego comprobar dónde están el enchufe y el desagüe; si falta alguno de los 5, no se pide", "No encaja si algo no cuadra o no se puede instalar cuando llega", null,
      { lateral: { src: "Aviación: revisión antes de despegar", dist: 3, drop: "Pedir a ojo" } }),
    N9: node("D4", 2, 0, "Vajilla apta", "Como un restaurante que solo usa vajilla apta para lavavajillas, sustituir toda olla y plato marcado como no apto, para que no quede nada que fregar a mano", "No encaja si en los 14 días tras el cambio sigues fregando a mano más de 3 piezas al día", null,
      { lateral: { src: "Hostelería: vajilla profesional", dist: 4, drop: "Vajilla vieja mezclada de casa" } }),
    N10: node("D2", 2, 0, "Sin media carga", "Si lo pones a menos de media carga, gasta casi la misma agua y luz que lleno, así que lavar cada plato sale más del doble de caro", "Apunta tus platos 7 días antes de pedirlo; si sale una media de menos de 6 servicios al día, pásate a un mini", "Los platos empiezan a oler mientras esperas a llenarlo",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Poner una máquina grande medio vacía no compensa" } }),
    N11: node("D4", 1, 0, "Ollas fuera", "Si metes woks y ollas grandes por comodidad, en un mini no cabe la vajilla en una tanda y acabas fregando a mano otra vez", "Descarta este plan si en 14 días, por meter ollas, tienes que poner una segunda tanda más de 2 veces", "No todos en casa van a cumplir la norma",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Sobrecargar la máquina por comodidad" } }),
    N12: node("D3", 0, 1, "Sin reforma", "Si instalar un lavavajillas acaba en reformar toda la cocina, una vez empezada la obra y pagado el dinero, no te queda otra que terminarla", "No empieces si el presupuesto que te dan antes de quitar el módulo supera 2 veces el precio del aparato", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Empezada la obra, ya no hay vuelta atrás" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Uno de 12 servicios o más no cabe en la encimera, así que o es ese o es un mini de sobremesa" },
    { type: "excludes", from: "N1", to: "N5", why: "Si ya tienes uno integrado en el mueble, no vas a comprar además un mini de sobremesa; es uno u otro" },
    { type: "excludes", from: "N4", to: "N11", why: "Elegir tamaño familiar es precisamente para lavar también las ollas, lo que choca con dejarlas fuera" },
    { type: "excludes", from: "N2", to: "N7", why: "Ponerlo después de cada comida supone llenar el depósito a mano tres veces al día, algo difícil de mantener" },
    { type: "excludes", from: "N2", to: "N10", why: "Ponerlo tras cada comida suele ser a menos de media carga, lo que choca con la regla de no hacer medias cargas" },
    { type: "excludes", from: "N9", to: "N11", why: "Cambiarse a ollas y platos aptos es precisamente para meterlos, lo que choca con dejar las ollas fuera" },
    { type: "requires", from: "N1", to: "N8", why: "Con 1 cm de error ya no entra en el hueco, así que hay que medirlo todo antes de pedirlo" },
    { type: "requires", from: "N4", to: "N10", why: "Una máquina grande medio vacía gasta el agua y la luz de una carga completa, así que nada de medias cargas" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Desmontaje del módulo y mano de obra de instalación", v: "Un armario menos para guardar cosas", t: "Esperar a que el instalador mida y monte", l: "Esperar a media carga para ponerlo", x: "Renunciar al mini de sobremesa" },
      fatal: "N10", thesis: "Medir el hueco, integrar una máquina grande y ponerla solo cuando esté al menos medio llena", title: "Integrado grande, de una vez",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ollas y platos nuevos, más agua y luz en cada comida", v: "Estorba al pasar durante la prueba", t: "El módulo se quita solo tras 30 días", l: "Secar la vajilla al aire tras el programa rápido", x: "Renunciar al mini de sobremesa" },
      fatal: "N12", thesis: "Lavado rápido tras cada comida; junto al fregadero hasta que funcione y luego integrarlo", title: "Rápido a diario, probar antes de integrar",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Llenar el agua a mano en cada lavado", v: "Ocupa un buen trozo de encimera", t: "Fregar las ollas a mano a diario", l: "8 servicios o menos", x: "Renunciar a integrarlo y a la gran capacidad" },
      fatal: "N11", thesis: "Un mini de sobremesa que llenas tú; las ollas, a mano", title: "Mini de sobremesa, sin fontanería",
    },
  },
  recommend: { key: "alpha", why: "En un hogar de 3 o más personas, una máquina grande se encarga de los platos de todo el día en una sola tanda" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Los platos de toda la familia dependen de este único aparato; si se estropea, la única alternativa es fregar a mano", kill: "Descarta este plan si una reparación tarda más de 7 días y la familia vuelve a fregar a mano", label: "Aparato único" },
};
