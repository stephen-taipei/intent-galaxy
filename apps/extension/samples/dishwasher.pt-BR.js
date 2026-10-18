// 擴充功能生活題示範星系（巴西葡萄牙語版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Localização", D2: "Como escolher", D3: "Quanta reforma", D4: "Capacidade e louça" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A posição contrária leva "${dims[dim]}" ao extremo oposto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_PT_BR = {
  schema_version: "1.0",
  core: {
    decision: "Vale reformar a cozinha para receber uma lava-louças, ou escolher uma que caiba na cozinha que você já tem?",
    metric: "Nos primeiros 30 dias, usar pelo menos 5 vezes por semana e não passar mais de 5 minutos por dia lavando louça à mão",
  },
  quadrants: {
    Q1: { scar: "Comprei a máquina e continuo lavando louça à mão", sacred: "Primeiro conte sua louça" },
    Q2: { scar: "No meio da instalação, descobri que a mangueira não alcançava", sacred: "Meça antes de comprar" },
    Q3: { scar: "Comprei pela lista de recomendações da internet e não cabia", sacred: "Busque ideias em outras áreas" },
    Q4: { scar: "Vi três máquinas acabarem como escorredor de louça", sacred: "Pense bem em como pode dar errado" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Embutir", "Tirar o armário de 45 ou 60 cm ao lado da pia e embutir lá a máquina, para não ocupar bancada nem atrapalhar a passagem", "Não serve se a largura, altura ou profundidade do armário forem menores do que as medidas de embutir indicadas pela máquina", null),
    N2: node("D2", 0, 1, "Após refeições", "Escolher um modelo com programa rápido de menos de 1 hora e ligar depois de cada refeição, para nunca ficar louça suja na pia durante a noite", "Não serve se, em 14 dias, a louça sair gordurosa do programa rápido mais de 2 vezes", "Os programas rápidos costumam pular a secagem, então a louça precisa secar ao ar"),
    N3: node("D1", 1, 0, "Perto da pia", "Pôr a máquina a menos de 1 metro da pia e ligar a mangueira de escoamento diretamente ao ralo da pia, sem furar paredes nem mexer no encanamento", "Não serve se a mangueira de escoamento incluída não chegar à pia e for preciso uma extensão", null),
    N4: node("D4", 0, 2, "Para a família", "Com 3 ou mais pessoas em casa, optar por 12 ou mais serviços, para que panelas e pratos vão todos em uma só lavagem em vez de duas", "Não serve se, em 14 dias, houver mais de 2 dias em que pratos e panelas não cabem em uma só lavagem", null),
    N5: node("D3", 2, 0, "Mini de bancada", "Comprar uma mini de bancada com 8 serviços ou menos: sem tirar armários, sem mexer no encanamento e vai junto se você se mudar", "Não serve se, em 14 dias, houver mais de 3 dias em que são necessárias 2 lavagens para ficar tudo limpo", "Rouba um bom pedaço da bancada onde você prepara a comida"),
    N6: node("D3", 1, 2, "Testar primeiro", "Comprar um modelo que funcione de livre instalação ou embutido, deixar ao lado da pia 30 dias inteiros e só depois decidir se vale tirar o armário, em vez de desmontar já no primeiro dia", "Não serve se, durante os 30 dias de teste, a máquina atrapalhar a passagem ou bloquear uma gaveta", null),
    N7: node("D3", 2, 1, "Reservatório", "Como um motorhome com reservatório de água próprio, escolher um modelo de bancada que se enche à mão: sem ligar à torneira nem mexer no encanamento", "Não serve se, em alguma semana, você pular a máquina e lavar à mão 2 ou mais vezes por preguiça de encher", "Encher dá mais trabalho do que parece",
      { lateral: { src: "Camping: reservatório de água próprio", dist: 2, drop: "Ligação fixa à torneira" } }),
    N8: node("D2", 1, 0, "Medir antes", "Como a lista de checagem de um piloto antes de decolar, medir largura, profundidade e altura antes de fazer o pedido, e depois confirmar onde ficam a tomada e o ralo; se faltar algum dos 5, não faça o pedido", "Não serve se alguma coisa não bater ou não der para instalar quando chegar", null,
      { lateral: { src: "Aviação: checagem antes de decolar", dist: 3, drop: "Pedir no olhômetro" } }),
    N9: node("D4", 2, 0, "Louça apta", "Como um restaurante que só usa louça própria para máquina, substituir todas as panelas e pratos marcados como não aptos, para não sobrar nada para lavar à mão", "Não serve se, nos 14 dias após a troca, você ainda lavar à mão mais de 3 peças por dia", null,
      { lateral: { src: "Restaurantes: louça profissional", dist: 4, drop: "Louça velha e desparelhada de casa" } }),
    N10: node("D2", 2, 0, "Sem meia carga", "Se você ligar com menos de meia carga, gasta quase tanta água e eletricidade como cheia, então lavar cada prato sai mais que o dobro do preço", "Anote sua louça durante 7 dias antes de fazer o pedido; se a média for inferior a 6 serviços por dia, troque por uma mini", "A louça começa a cheirar mal enquanto espera pela carga completa",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Uma máquina grande meio vazia não compensa" } }),
    N11: node("D4", 1, 0, "Panelas fora", "Se você enfiar woks e panelas grandes lá dentro por comodidade, uma mini não leva a louça em uma só lavagem e acaba lavando à mão de novo", "Abandone este plano se, em 14 dias, por enfiar panelas, precisar fazer uma segunda lavagem mais de 2 vezes", "Nem todo mundo em casa vai cumprir a regra",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Encher a máquina demais por comodidade" } }),
    N12: node("D3", 0, 1, "Sem reforma", "Se instalar a máquina virar uma reforma da cozinha inteira, depois de começar a obra e pagar, não tem mais volta e você precisa ir até o fim", "Não comece se o orçamento feito antes de tirar o armário for mais do dobro do preço da máquina", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Começou a obra, não tem mais volta" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Uma máquina de 12 ou mais serviços não cabe na bancada, então é ela ou uma mini de bancada" },
    { type: "excludes", from: "N1", to: "N5", why: "Com uma máquina já embutida no armário, você não vai comprar também uma mini de bancada; é uma ou outra" },
    { type: "excludes", from: "N4", to: "N11", why: "O objetivo de escolher o tamanho familiar é lavar também as panelas, o que contradiz deixar as panelas de fora" },
    { type: "excludes", from: "N2", to: "N7", why: "Lavar depois de cada refeição obriga a encher o reservatório à mão três vezes por dia, o que é difícil de sustentar" },
    { type: "excludes", from: "N2", to: "N10", why: "Lavar depois de cada refeição costuma ficar abaixo de meia carga, o que contradiz a regra de não haver meias cargas" },
    { type: "excludes", from: "N9", to: "N11", why: "O objetivo de trocar para panelas e pratos aptos é colocar na máquina, o que contradiz deixar as panelas de fora" },
    { type: "requires", from: "N1", to: "N8", why: "Basta 1 cm a mais para não entrar no armário, então é preciso medir tudo antes de fazer o pedido" },
    { type: "requires", from: "N4", to: "N10", why: "Uma máquina grande meio vazia gasta a água e a eletricidade de uma carga completa, então nada de meias cargas" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Remoção do armário e mão de obra da instalação", v: "Um armário a menos para guardar coisas", t: "Esperar o técnico medir e instalar", l: "Esperar por meia carga para lavar", x: "Abrir mão da mini de bancada" },
      fatal: "N10", thesis: "Medir o armário, embutir uma máquina grande e só ligar quando estiver pelo menos meio cheia", title: "Embutida grande, de uma vez",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Panelas e pratos novos, mais água e eletricidade a cada refeição", v: "Atrapalha a passagem durante o teste", t: "O armário só sai depois de 30 dias", l: "Secar a louça ao ar depois do programa rápido", x: "Abrir mão da mini de bancada" },
      fatal: "N12", thesis: "Lavagem rápida após cada refeição; fica junto à pia até provar que funciona e só depois é embutida", title: "Rápida todos os dias, testar antes de embutir",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Encher a água à mão em cada lavagem", v: "Ocupa um bom pedaço de bancada", t: "Lavar as panelas à mão todos os dias", l: "8 serviços ou menos", x: "Abrir mão de embutir e da grande capacidade" },
      fatal: "N11", thesis: "Uma mini de bancada que você enche à mão; as panelas são lavadas à mão", title: "Mini de bancada, sem encanamento",
    },
  },
  recommend: { key: "alpha", why: "Em uma casa com 3 ou mais pessoas, uma máquina grande dá conta da louça do dia inteiro em uma só lavagem" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "A louça da família inteira depende desta única máquina; se quebrar, a única alternativa é lavar à mão", kill: "Abandone este plano se um conserto demorar mais de 7 dias e a família voltar a lavar à mão", label: "Máquina única" },
};
