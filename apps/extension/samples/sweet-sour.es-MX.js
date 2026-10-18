// 擴充功能內建生活題示範星系（墨西哥西班牙語版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "De dónde sale el dulce", D2: "Válvula para el antojo", D3: "Cuánto cambias", D4: "Qué hay en casa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `La postura contraria lleva "${dims[dim]}" al otro extremo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_ES_MX = {
  schema_version: "1.0",
  core: {
    decision: "¿Cambias todos los caprichos dulces por fruta entera, o sigues comiendo lo que te gusta pero en menos cantidad?",
    metric: "Durante 30 días, no más de 3 snacks y bebidas azucarados por semana en total (anotados en el celular para comprobarlo)",
  },
  quadrants: {
    Q1: { scar: "Me comí una bolsa entera de fruta deshidratada creyendo que era sano", sacred: "El dulce solo sale de la fruta entera" },
    Q2: { scar: "Dejé el azúcar tres veces y recaí siempre en la segunda semana", sacred: "Solo cuenta si de verdad puedes mantenerlo" },
    Q3: { scar: "Copié un menú bajo en carbohidratos y a los tres días estaba harto", sacred: "Cambia el método, no el sabor" },
    Q4: { scar: "He visto a demasiada gente dejar el azúcar y volver a caer", sacred: "Ponte reglas en lugar de depender de la fuerza de voluntad" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fruta entera", "Cada vez que se te antoje algo dulce, comer solo fruta fresca entera, como kiwi, piña, frutos rojos o naranjas; el jugo, la fruta deshidratada y la fruta confitada no cuentan", "Falla si en 14 días compras algún postre para quitarte el antojo más de 3 días", null),
    N2: node("D2", 0, 1, "Agua mineral", "Cuando llegue el antojo, beber primero un vaso de agua mineral sin azúcar con limón o maracuyá; si a los 15 minutos sigues queriendo algo dulce, déjalo para después de la próxima comida. Solo cambian las bebidas: las comidas siguen igual y no compras snacks sustitutos", "Falla si en 14 días, tras los 15 minutos de espera, sigues queriendo algo dulce más de la mitad de las veces", "Una bebida no quita las ganas de masticar algo"),
    N3: node("D1", 1, 0, "Solo de postre", "Comer snacks agridulces y fruta solo durante la hora siguiente a una comida; nada con el estómago vacío ni en las 3 horas antes de dormir", "Falla si tras 14 días así sigues buscando snacks antes de dormir más de 3 noches", null),
    N4: node("D4", 0, 2, "Casa sin dulces", "Hacer el súper una vez por semana: fruta de temporada por cajas y yogur natural sin azúcar para toda la semana; son los únicos snacks de casa y los snacks azucarados no entran nunca", "Falla si en 14 días sigue habiendo una semana en la que compras dulces en la calle más de 3 veces", null),
    N5: node("D3", 2, 0, "Media porción", "Seguir comiendo los snacks agridulces que te gustan, pero menos: pasarte a envases individuales y reducir a la mitad la cantidad diaria, sin sustitutos", "Falla si a partir de la 2.ª semana comes más de la mitad de lo de antes más de 2 días por semana", "A menudo abres un segundo paquete justo después del primero"),
    N6: node("D3", 1, 2, "Probar bebidas", "Para cada sabor nuevo de bebida sin azúcar, comprar el envase más pequeño y tomarlo 3 días seguidos; solo compras la caja entera si te gusta, nunca haces acopio de golpe", "Falla si un sabor que compraste por cajas tras probarlo sigue con más de la mitad 14 días después", null),
    N7: node("D3", 2, 1, "Otra salsa", "Como cambiar la funda del celular en vez del celular: mantener los ingredientes principales del puerco o el pescado agridulce, pero hacer tú la salsa con tomate, piña y vinagre, con la mitad del azúcar de siempre", "Falla si, tras hacer la nueva salsa 2 veces en 14 días, en casa todos dicen que no está buena", "En restaurantes y comida a domicilio no puedes cambiar la salsa",
      { lateral: { src: "Tecnología: cambiar la funda del celular", dist: 2, drop: "Quitar el plato del menú por completo" } }),
    N8: node("D2", 1, 0, "Máx 3 porciones", "Como el límite de equipaje de una aerolínea: como mucho 3 porciones al día entre fruta y snacks agridulces, cada una del tamaño de tu puño; lo que sobre espera a mañana, en vez de depender de la fuerza de voluntad del momento", "Falla si tomas más de 3 porciones más de 2 días en una semana", null,
      { lateral: { src: "Aerolíneas: límite de peso del equipaje", dist: 3, drop: "Comer cuando se te antoje sin límite" } }),
    N9: node("D4", 2, 0, "Surtir agua", "Surtir como lo hace la tiendita de la esquina antes de quedarse sin mercancía: tener siempre en el refri una caja de agua mineral sin azúcar y una bolsa de limones, y comprar otra caja cuando queden 3 latas, para que un antojo nunca te mande por un refresco o un frappé", "Falla si en 14 días sigues comprando más de 3 bebidas azucaradas para llevar", null,
      { lateral: { src: "Comercio: surtir antes de que se acabe", dist: 4, drop: "Comprar bebida solo cuando se te antoje" } }),
    N10: node("D2", 2, 0, "Tope de gasto", "Si los snacks sustitutos como la fruta y el yogur sin azúcar cuestan más del doble de lo que gastabas antes en snacks cada semana, lo dejarás antes de un mes y volverás a comprar snacks", "Parar si en 14 días los snacks sustitutos cuestan más del doble de tu antiguo presupuesto para snacks", "El precio de la fruta varía mucho según la temporada",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Los sustitutos salen demasiado caros para mantenerlos" } }),
    N11: node("D4", 1, 0, "Sin ofertas", "Si compras comida y bebida por cajas para tener envío gratis o descuento por volumen, cuanto más tengas en casa, más acabas comiendo cada día", "Parar si en 14 días compras comida o bebida por cajas o para llegar al mínimo del envío gratis más de una vez", "No controlas los dulces que te regalan amigos y familia",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Los descuentos te hacen comprar cada vez más" } }),
    N12: node("D3", 0, 1, "Sin aparatos", "Si esperas a tener una máquina de soda, edulcorantes y todo tipo de sustitutos antes de empezar, el dinero gastado te empuja a tragarte cosas que no te gustan y lo dejarás antes de 2 semanas", "Parar si en 14 días compras más de 1 aparato o sustituto que en realidad no usas", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Te lo tragas para no desperdiciarlo" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "No tener snacks azucarados en casa y seguir comiendo tus snacks azucarados de siempre no pueden darse a la vez" },
    { type: "excludes", from: "N1", to: "N5", why: "Si el dulce solo sale de la fruta entera, no puedes quedarte con los snacks azucarados que te gustan" },
    { type: "excludes", from: "N4", to: "N11", why: "La fruta de casa depende de comprar una caja cada semana; si prohíbes comprar por cajas, ese plan de compra se cae" },
    { type: "excludes", from: "N2", to: "N7", why: "Este camino solo cambia las bebidas y deja las comidas en paz, lo que choca con rehacer la salsa agridulce" },
    { type: "excludes", from: "N2", to: "N10", why: "Este camino solo cambia las bebidas y no compra snacks sustitutos, así que un tope de gasto en sustitutos no aplica aquí; elige uno" },
    { type: "excludes", from: "N9", to: "N11", why: "Tener siempre agua mineral implica comprarla por cajas, lo que choca de frente con no comprar a granel" },
    { type: "requires", from: "N1", to: "N8", why: "La fruta también tiene azúcar; aunque sea tu único capricho, necesitas un límite diario o comer demasiado también pasa factura" },
    { type: "requires", from: "N4", to: "N10", why: "Comprar fruta y yogur por cajas cada semana suma, así que necesitas un tope de gasto o la cartera se rinde antes" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Una vuelta fija al súper por semana", v: "Renunciar a los snacks que te gustan", t: "Las dos primeras semanas de antojos son duras", l: "Como mucho tres porciones de fruta al día", x: "Nada de salir corriendo por un postre" },
      fatal: "N10", thesis: "El dulce, solo de fruta entera y en cantidad limitada, y los snacks azucarados fuera de casa", title: "Pasarse a la fruta · casa sin dulces",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tener siempre agua mineral en el refri", v: "Esperar 15 minutos antes de ceder al antojo", t: "Cambiar solo un poco cada semana", l: "El azúcar de las comidas sigue igual", x: "Nada de comer tus snacks de siempre como antes" },
      fatal: "N12", thesis: "Echar mano del agua mineral sin azúcar cuando llega el antojo y probar sabores nuevos en poca cantidad antes de comprar más", title: "Primero las bebidas · recortar poco a poco",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Contar porciones cada vez", v: "Los dulces de casa siguen tentándote", t: "Los resultados tardan en verse", l: "Recortar depende solo del autocontrol", x: "Renunciar a pasarse del todo a la fruta" },
      fatal: "N11", thesis: "Seguir comiendo lo que te gusta, pero en envases pequeños, con porciones limitadas y rehaciendo la salsa agridulce", title: "Lo de siempre · limitar y cambiar la salsa",
    },
  },
  recommend: { key: "alpha", why: "La fruta ya es dulce y ácida de por sí, y no tener snacks azucarados en casa es lo que menos fuerza de voluntad exige" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos tus caprichos agridulces salen de una sola fruta o bebida", kill: "Si esa única cosa se agota o te cansas de ella, todo el plan se cae", label: "Un solo sustituto" },
};
