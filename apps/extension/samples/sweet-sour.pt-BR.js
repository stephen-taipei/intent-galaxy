// 擴充功能內建生活題示範星系（巴西葡萄牙語版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "De onde vem o doce", D2: "Válvula de escape", D3: "Quanto você muda", D4: "O que tem em casa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A visão oposta leva "${dims[dim]}" ao outro extremo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_PT_BR = {
  schema_version: "1.0",
  core: {
    decision: "Você troca todos os docinhos por fruta inteira, ou continua comendo o que ama, só que em menor quantidade?",
    metric: "Durante 30 dias, no máximo 3 lanchinhos e bebidas com açúcar por semana no total (anotados no celular para conferir)",
  },
  quadrants: {
    Q1: { scar: "Comi um pacote inteiro de fruta desidratada achando que era saudável", sacred: "O doce só vem da fruta inteira" },
    Q2: { scar: "Cortei o açúcar três vezes e caí de novo na segunda semana em todas", sacred: "Só vale se você conseguir manter de verdade" },
    Q3: { scar: "Copiei uma dieta low carb e enjoei em três dias", sacred: "Mude o método, não o sabor" },
    Q4: { scar: "Já vi gente demais cortar o açúcar e voltar tudo de novo", sacred: "Crie regras em vez de depender da força de vontade" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fruta inteira", "Sempre que der vontade de doce, comer só fruta fresca inteira, como kiwi, abacaxi, frutas vermelhas ou laranja; suco, fruta desidratada e fruta cristalizada não contam", "Falha se, em 14 dias, você comprar sobremesa para matar a vontade em mais de 3 dias", null),
    N2: node("D2", 0, 1, "Água com gás", "Quando a vontade bater, tomar primeiro um copo de água com gás sem açúcar com limão ou maracujá; se depois de 15 minutos ainda quiser um doce, deixe para depois da próxima refeição. Só mudam as bebidas: as refeições continuam iguais e você não compra lanchinhos substitutos", "Falha se, em 14 dias, você ainda quiser algo doce depois dos 15 minutos de espera em mais da metade das vezes", "Uma bebida não resolve a vontade de mastigar alguma coisa"),
    N3: node("D1", 1, 0, "Só pós-refeição", "Comer lanchinhos agridoces e fruta só até 1 hora depois de uma refeição; nada de estômago vazio e nada nas 3 horas antes de dormir", "Falha se, depois de 14 dias assim, você ainda for atrás de lanchinho antes de dormir em mais de 3 noites", null),
    N4: node("D4", 0, 2, "Casa sem doces", "Fazer compras uma vez por semana: fruta da estação por caixa e iogurte natural sem açúcar para a semana toda; esses são os únicos lanchinhos em casa, e doce industrializado nunca entra", "Falha se, em 14 dias, ainda tiver uma semana em que você compra doce na rua mais de 3 vezes", null),
    N5: node("D3", 2, 0, "Metade do doce", "Continuar comendo os lanchinhos agridoces que você ama, só que menos: trocar por embalagens individuais e cortar pela metade a quantidade diária, sem substitutos", "Falha se, a partir da 2ª semana, você comer mais da metade do que comia antes em mais de 2 dias por semana", "Muitas vezes você abre o segundo pacote logo depois do primeiro"),
    N6: node("D3", 1, 2, "Testar bebidas", "Para cada sabor novo de bebida sem açúcar, comprar a menor embalagem e tomar 3 dias seguidos; só compre o fardo inteiro se gostar, nunca estoque tudo de uma vez", "Falha se um sabor que você comprou no fardo depois de testar ainda estiver com mais da metade 14 dias depois", null),
    N7: node("D3", 2, 1, "Outro molho", "Como trocar a capinha do celular em vez do celular: manter os ingredientes principais do porco ou do peixe agridoce, mas fazer o molho em casa com tomate, abacaxi e vinagre, com metade do açúcar de sempre", "Falha se, depois de fazer o molho novo 2 vezes em 14 dias, todo mundo em casa disser que não ficou bom", "No restaurante ou no delivery não dá para mudar o molho",
      { lateral: { src: "Tecnologia: trocar a capinha do celular", dist: 2, drop: "Tirar o prato do cardápio de vez" } }),
    N8: node("D2", 1, 0, "Máx. 3 porções", "Como o limite de bagagem de uma companhia aérea: no máximo 3 porções por dia somando fruta e lanchinhos agridoces, cada uma do tamanho do seu punho; o que passar fica para amanhã, em vez de depender da força de vontade na hora", "Falha se você comer mais de 3 porções em mais de 2 dias na semana", null,
      { lateral: { src: "Aviação: limite de peso da bagagem", dist: 3, drop: "Comer quando quiser, sem limite" } }),
    N9: node("D4", 2, 0, "Repor água", "Repor como o mercadinho do bairro faz antes de acabar: ter sempre na geladeira um fardo de água com gás sem açúcar e um saco de limões, e comprar outro fardo quando sobrarem 3 latas, para que a vontade nunca faça você sair atrás de um refrigerante ou de um bubble tea", "Falha se, em 14 dias, você ainda comprar mais de 3 bebidas com açúcar na rua", null,
      { lateral: { src: "Varejo: repor antes de esgotar", dist: 4, drop: "Comprar bebida só quando der vontade" } }),
    N10: node("D2", 2, 0, "Teto de gasto", "Se os lanchinhos substitutos, como fruta e iogurte sem açúcar, custarem mais que o dobro do que você gastava antes com lanchinhos por semana, você desiste em menos de um mês e volta a comprar besteira", "Pare se, em 14 dias, os lanchinhos substitutos custarem mais que o dobro do seu antigo orçamento de lanchinhos", "O preço da fruta varia muito conforme a estação",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Os substitutos ficam caros demais para manter" } }),
    N11: node("D4", 1, 0, "Sem promoções", "Se você compra comida e bebida em fardo para ganhar frete grátis ou desconto por quantidade, quanto mais tiver em casa, mais acaba comendo todo dia", "Pare se, em 14 dias, você comprar comida ou bebida em fardo ou para bater o mínimo do frete grátis mais de uma vez", "Você não controla os doces que amigos e família dão de presente",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Desconto faz você comprar cada vez mais" } }),
    N12: node("D3", 0, 1, "Sem aparelhos", "Se você esperar ter uma máquina de água gaseificada, adoçantes e todo tipo de substituto antes de começar, o dinheiro gasto te empurra a engolir o que não gosta e você desiste em menos de 2 semanas", "Pare se, em 14 dias, você comprar mais de 1 aparelho ou substituto que acaba não usando", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Você come à força para não desperdiçar" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Não ter doce em casa e continuar comendo seus doces de sempre não dá para acontecer ao mesmo tempo" },
    { type: "excludes", from: "N1", to: "N5", why: "Se o doce só vem da fruta inteira, não dá para manter os lanchinhos doces que você ama" },
    { type: "excludes", from: "N4", to: "N11", why: "A fruta em casa depende de comprar uma caixa toda semana; se você proíbe comprar em quantidade, esse plano de abastecimento desmorona" },
    { type: "excludes", from: "N2", to: "N7", why: "Esse caminho só muda as bebidas e deixa as refeições em paz, o que contradiz refazer o molho agridoce" },
    { type: "excludes", from: "N2", to: "N10", why: "Esse caminho só muda as bebidas e não compra lanchinhos substitutos, então um teto de gasto com substitutos não se aplica; escolha um" },
    { type: "excludes", from: "N9", to: "N11", why: "Ter sempre água com gás em estoque significa comprar em fardo, o que bate de frente com não comprar em quantidade" },
    { type: "requires", from: "N1", to: "N8", why: "Fruta também tem açúcar; mesmo que fruta seja seu único doce, você precisa de um limite diário, senão comer demais também cobra seu preço" },
    { type: "requires", from: "N4", to: "N10", why: "Comprar fruta e iogurte por caixa toda semana vai somando, então você precisa de um teto de gasto, senão o bolso desiste primeiro" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Uma ida fixa ao mercado por semana", v: "Abrir mão dos lanchinhos que você ama", t: "As duas primeiras semanas de vontade são puxadas", l: "No máximo três porções de fruta por dia", x: "Nada de sair correndo atrás de sobremesa" },
      fatal: "N10", thesis: "O doce vem só da fruta inteira, em quantidade limitada, e doce industrializado fica fora de casa", title: "Trocar por fruta · casa sem doces",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Manter água com gás sempre na geladeira", v: "Esperar 15 minutos antes de ceder à vontade", t: "Mudar só um pouquinho por semana", l: "O açúcar das refeições continua igual", x: "Nada de comer os lanchinhos de sempre como antes" },
      fatal: "N12", thesis: "Quando a vontade bater, partir para a água com gás sem açúcar e provar sabores novos em pouca quantidade antes de comprar mais", title: "Trocar a bebida primeiro · cortar aos poucos",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Contar porções toda vez", v: "Os doces em casa continuam tentando você", t: "Demora para ver resultado", l: "Cortar depende só do autocontrole", x: "Abrir mão de trocar tudo por fruta" },
      fatal: "N11", thesis: "Continuar comendo o que você ama, mas em embalagens pequenas, com porções limitadas e refazendo o molho agridoce", title: "Manter os favoritos · limitar e trocar o molho",
    },
  },
  recommend: { key: "alpha", why: "A fruta já é doce e azedinha por natureza, e não ter doce em casa é o que exige menos força de vontade" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos os seus docinhos agridoces vêm de uma única fruta ou bebida", kill: "Se essa única coisa acabar ou você enjoar dela, o plano inteiro desmorona", label: "Um só substituto" },
};
