// 擴充功能內建生活題示範星系（葡萄牙語（葡萄牙）版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "De onde vem o doce", D2: "Escape para a vontade", D3: "Quanto muda", D4: "O que há em casa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A posição contrária leva «${dims[dim]}» ao outro extremo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_PT = {
  schema_version: "1.0",
  core: {
    decision: "Troca todos os miminhos doces por fruta inteira, ou continua a comer o que gosta, só que em menor quantidade?",
    metric: "Durante 30 dias, no máximo 3 snacks e bebidas açucarados por semana no total (registados no telemóvel para confirmar)",
  },
  quadrants: {
    Q1: { scar: "Comi um saco inteiro de fruta desidratada a achar que era saudável", sacred: "O doce só vem da fruta inteira" },
    Q2: { scar: "Cortei no açúcar três vezes e cedi sempre na segunda semana", sacred: "Só conta se conseguir mesmo manter" },
    Q3: { scar: "Copiei um plano low carb e ao fim de três dias já estava farto", sacred: "Mude o método, não o sabor" },
    Q4: { scar: "Já vi demasiada gente cortar no açúcar e voltar ao mesmo", sacred: "Regras valem mais do que força de vontade" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fruta inteira", "Sempre que lhe apetecer algo doce, comer só fruta fresca inteira, como kiwi, ananás, frutos vermelhos ou laranja; sumos, fruta desidratada e fruta cristalizada não contam", "Falha se, em 14 dias, comprar sobremesa para matar a vontade em mais de 3 dias", null),
    N2: node("D2", 0, 1, "Água com gás", "Quando a vontade aparecer, beber primeiro um copo de água com gás sem açúcar com limão ou maracujá; se 15 minutos depois ainda quiser um doce, fica para depois da próxima refeição. Só mudam as bebidas: as refeições ficam iguais e não compra snacks substitutos", "Falha se, em 14 dias, ainda quiser algo doce depois dos 15 minutos de espera em mais de metade das vezes", "Uma bebida não resolve a vontade de mastigar alguma coisa"),
    N3: node("D1", 1, 0, "Só após comer", "Comer snacks agridoces e fruta só na hora a seguir a uma refeição; nada de estômago vazio e nada nas 3 horas antes de dormir", "Falha se, ao fim de 14 dias assim, ainda for à procura de snacks antes de dormir em mais de 3 noites", null),
    N4: node("D4", 0, 2, "Casa sem doces", "Ir às compras uma vez por semana: fruta da época às caixas e iogurte natural sem açúcar para a semana toda; são os únicos snacks em casa e os snacks açucarados nunca entram", "Falha se, em 14 dias, ainda houver uma semana em que compra doces na rua mais de 3 vezes", null),
    N5: node("D3", 2, 0, "Meia dose", "Continuar a comer os snacks agridoces de que gosta, mas menos: passar para embalagens individuais e cortar para metade a quantidade diária, sem substitutos", "Falha se, a partir da 2.ª semana, comer mais de metade do que comia antes em mais de 2 dias por semana", "Muitas vezes abre-se um segundo pacote logo a seguir ao primeiro"),
    N6: node("D3", 1, 2, "Testar bebidas", "Para cada sabor novo de bebida sem açúcar, comprar a embalagem mais pequena e beber 3 dias seguidos; só compra a grade inteira se gostar, nunca faz stock tudo de uma vez", "Falha se um sabor que comprou à grade depois de testar ainda estiver mais de metade cheio 14 dias depois", null),
    N7: node("D3", 2, 1, "Outro molho", "Como trocar a capa do telemóvel em vez do telemóvel: manter os ingredientes principais do porco ou do peixe agridoce, mas fazer o molho em casa com tomate, ananás e vinagre, com metade do açúcar habitual", "Falha se, depois de fazer o novo molho 2 vezes em 14 dias, toda a gente em casa disser que não presta", "No restaurante ou no take-away não dá para mudar o molho",
      { lateral: { src: "Tecnologia: trocar a capa do telemóvel", dist: 2, drop: "Tirar o prato da ementa de vez" } }),
    N8: node("D2", 1, 0, "Máx. 3 porções", "Como o limite de bagagem de uma companhia aérea: no máximo 3 porções por dia entre fruta e snacks agridoces, cada uma do tamanho do seu punho; o que passar fica para amanhã, em vez de depender da força de vontade do momento", "Falha se comer mais de 3 porções em mais de 2 dias numa semana", null,
      { lateral: { src: "Aviação: limite de peso da bagagem", dist: 3, drop: "Comer quando apetecer, sem limite" } }),
    N9: node("D4", 2, 0, "Repor água", "Repor como faz a mercearia do bairro antes de esgotar: ter sempre no frigorífico uma grade de água com gás sem açúcar e um saco de limões, e comprar outra grade quando restarem 3 latas, para que a vontade nunca o mande comprar um refrigerante ou um bubble tea", "Falha se, em 14 dias, ainda comprar mais de 3 bebidas açucaradas para levar", null,
      { lateral: { src: "Comércio: repor antes de esgotar", dist: 4, drop: "Comprar bebida só quando apetece" } }),
    N10: node("D2", 2, 0, "Limite de gasto", "Se os snacks substitutos, como fruta e iogurte sem açúcar, custarem mais do dobro do que gastava antes em snacks por semana, desiste em menos de um mês e volta a comprar snacks", "Parar se, em 14 dias, os snacks substitutos custarem mais do dobro do antigo orçamento para snacks", "O preço da fruta varia muito com a época",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Os substitutos saem caros demais para manter" } }),
    N11: node("D4", 1, 0, "Sem promoções", "Se comprar comida e bebida às caixas para ter portes grátis ou desconto de quantidade, quanto mais houver em casa, mais acaba por comer todos os dias", "Parar se, em 14 dias, comprar comida ou bebida às caixas ou para chegar ao mínimo dos portes grátis mais de uma vez", "Não controla os doces que amigos e família oferecem",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Os descontos fazem comprar cada vez mais" } }),
    N12: node("D3", 0, 1, "Sem aparelhos", "Se esperar até ter uma máquina de água gaseificada, adoçantes e todo o tipo de substitutos antes de começar, o dinheiro gasto empurra-o a comer à força o que não gosta e desiste em menos de 2 semanas", "Parar se, em 14 dias, comprar mais de 1 aparelho ou substituto que acaba por não usar", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Come à força para não desperdiçar" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Não ter snacks açucarados em casa e continuar a comer os snacks açucarados de sempre não podem acontecer ao mesmo tempo" },
    { type: "excludes", from: "N1", to: "N5", why: "Se o doce só vem da fruta inteira, não dá para manter os snacks açucarados de que gosta" },
    { type: "excludes", from: "N4", to: "N11", why: "A fruta em casa depende de comprar uma caixa por semana; se proibir compras às caixas, esse plano de abastecimento cai por terra" },
    { type: "excludes", from: "N2", to: "N7", why: "Este caminho só muda as bebidas e deixa as refeições como estão, o que contradiz refazer o molho agridoce" },
    { type: "excludes", from: "N2", to: "N10", why: "Este caminho só muda as bebidas e não compra snacks substitutos; um limite de gasto em substitutos pertence a outro caminho, por isso escolha um" },
    { type: "excludes", from: "N9", to: "N11", why: "Ter sempre água com gás em stock obriga a comprá-la às grades, o que choca de frente com não comprar em quantidade" },
    { type: "requires", from: "N1", to: "N8", why: "A fruta também tem açúcar; mesmo que seja o único miminho, precisa de um limite diário, senão comer demais também cobra o seu preço" },
    { type: "requires", from: "N4", to: "N10", why: "Comprar fruta e iogurte às caixas todas as semanas vai somando, por isso precisa de um limite de gasto, senão a carteira cede primeiro" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Uma ida fixa às compras por semana", v: "Abdicar dos snacks de que gosta", t: "As duas primeiras semanas de vontades custam", l: "No máximo três porções de fruta por dia", x: "Nada de ir a correr comprar uma sobremesa" },
      fatal: "N10", thesis: "O doce vem só da fruta inteira, em quantidade limitada, e os snacks açucarados ficam fora de casa", title: "Passar para a fruta · casa sem doces",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ter sempre água com gás no frigorífico", v: "Esperar 15 minutos antes de ceder à vontade", t: "Mudar só um pouco por semana", l: "O açúcar das refeições fica igual", x: "Nada de comer os snacks de sempre como antes" },
      fatal: "N12", thesis: "Quando a vontade aperta, ir à água com gás sem açúcar e provar sabores novos em pouca quantidade antes de comprar mais", title: "Primeiro as bebidas · cortar aos poucos",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Contar porções sempre", v: "Os doces em casa continuam a tentar", t: "Os resultados demoram a aparecer", l: "Cortar depende só do autocontrolo", x: "Abdicar de passar totalmente para a fruta" },
      fatal: "N11", thesis: "Continuar a comer o que gosta, mas em embalagens pequenas, com porções limitadas e refazendo o molho agridoce", title: "Os favoritos · limitar e trocar o molho",
    },
  },
  recommend: { key: "alpha", why: "A fruta já é doce e ácida por natureza, e não ter snacks açucarados em casa é o que exige menos força de vontade" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos os seus miminhos agridoces vêm de uma só fruta ou bebida", kill: "Se essa única coisa esgotar ou se fartar dela, o plano inteiro cai por terra", label: "Um só substituto" },
};
