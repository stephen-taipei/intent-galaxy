// 擴充功能生活題示範星系（葡萄牙語（葡萄牙）版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Localização", D2: "Como escolher", D3: "Quanta obra", D4: "Capacidade e loiça" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `A posição contrária leva «${dims[dim]}» ao extremo oposto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_PT = {
  schema_version: "1.0",
  core: {
    decision: "Faz obras na cozinha para receber uma máquina de lavar loiça, ou escolhe uma que caiba na cozinha que já tem?",
    metric: "Nos primeiros 30 dias, pô-la a trabalhar pelo menos 5 vezes por semana e não passar mais de 5 minutos por dia a lavar loiça à mão",
  },
  quadrants: {
    Q1: { scar: "Comprei a máquina e continuo a lavar loiça à mão", sacred: "Primeiro conte a sua loiça" },
    Q2: { scar: "A meio da instalação, a mangueira afinal não chegava", sacred: "Meça antes de comprar" },
    Q3: { scar: "Comprei pela lista de recomendações da internet e não cabia", sacred: "Vá buscar ideias a outras áreas" },
    Q4: { scar: "Vi três máquinas acabarem como escorredor de loiça", sacred: "Pense bem em como pode falhar" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Encastrar", "Tirar o módulo de 45 ou 60 cm ao lado do lava-loiça e encastrar lá a máquina, para não ocupar bancada nem atrapalhar a passagem", "Não serve se a largura, altura ou profundidade do módulo forem menores do que as medidas de encastre indicadas pela máquina", null),
    N2: node("D2", 0, 1, "Após refeições", "Escolher um modelo com programa rápido de menos de 1 hora e pô-lo a lavar depois de cada refeição, para nunca ficar loiça suja no lava-loiça durante a noite", "Não serve se, em 14 dias, a loiça sair gordurosa do programa rápido mais de 2 vezes", "Os programas rápidos costumam saltar a secagem, por isso a loiça tem de secar ao ar"),
    N3: node("D1", 1, 0, "Junto à banca", "Pôr a máquina a menos de 1 metro do lava-loiça e ligar a mangueira de escoamento diretamente ao esgoto do lava-loiça, sem furar paredes nem mexer na canalização", "Não serve se a mangueira de escoamento incluída não chegar ao lava-loiça e for preciso uma extensão", null),
    N4: node("D4", 0, 2, "Para a família", "Com 3 ou mais pessoas em casa, optar por 12 ou mais serviços, para que tachos e pratos vão todos numa só lavagem em vez de duas", "Não serve se, em 14 dias, houver mais de 2 dias em que pratos e tachos não cabem numa só lavagem", null),
    N5: node("D3", 2, 0, "Mini de bancada", "Comprar uma mini de bancada com 8 serviços ou menos: sem tirar módulos, sem mexer na canalização e vai consigo se mudar de casa", "Não serve se, em 14 dias, houver mais de 3 dias em que são precisas 2 lavagens para ficar tudo limpo", "Rouba um bom pedaço de bancada de preparação"),
    N6: node("D3", 1, 2, "Testar primeiro", "Comprar um modelo que funcione de livre instalação ou encastrado, deixá-lo ao lado do lava-loiça 30 dias inteiros e só depois decidir se tira o módulo, em vez de o desmontar logo no primeiro dia", "Não serve se, durante os 30 dias de teste, a máquina atrapalhar a passagem ou bloquear uma gaveta", null),
    N7: node("D3", 2, 1, "Com depósito", "Tal como uma autocaravana com depósito de água próprio, escolher um modelo de bancada que se enche à mão: sem ligar à torneira nem mexer na canalização", "Não serve se, numa semana qualquer, a saltar e lavar à mão 2 ou mais vezes por preguiça de a encher", "Encher dá mais trabalho do que parece",
      { lateral: { src: "Campismo: depósito de água próprio", dist: 2, drop: "Ligação fixa à torneira" } }),
    N8: node("D2", 1, 0, "Medir antes", "Tal como a lista de verificação de um piloto antes de descolar, medir largura, profundidade e altura antes de encomendar, e depois confirmar onde ficam a tomada e o esgoto; se faltar algum dos 5, não encomenda", "Não serve se alguma coisa não bater certo ou não der para instalar quando chegar", null,
      { lateral: { src: "Aviação: verificação antes de descolar", dist: 3, drop: "Encomendar a olho" } }),
    N9: node("D4", 2, 0, "Loiça apta", "Tal como um restaurante que só usa loiça própria para máquina, substituir todos os tachos e pratos marcados como não aptos, para não sobrar nada para lavar à mão", "Não serve se, nos 14 dias após a troca, ainda lavar à mão mais de 3 peças por dia", null,
      { lateral: { src: "Restauração: loiça profissional", dist: 4, drop: "Loiça velha e desirmanada lá de casa" } }),
    N10: node("D2", 2, 0, "Sem meia carga", "Se a puser a trabalhar com menos de meia carga, gasta quase tanta água e eletricidade como cheia, por isso lavar cada prato fica mais do dobro do preço", "Registe a sua loiça durante 7 dias antes de encomendar; se a média for inferior a 6 serviços por dia, passe para uma mini", "A loiça começa a cheirar mal enquanto espera pela carga completa",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Uma máquina grande meio vazia não compensa" } }),
    N11: node("D4", 1, 0, "Tachos fora", "Se enfiar woks e panelas grandes lá dentro por comodidade, uma mini não leva a loiça numa só lavagem e acaba outra vez a lavar à mão", "Abandone este plano se, em 14 dias, por enfiar tachos, tiver de fazer uma segunda lavagem mais de 2 vezes", "Nem toda a gente em casa vai cumprir a regra",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Encher a máquina demais por comodidade" } }),
    N12: node("D3", 0, 1, "Sem obras", "Se instalar a máquina se transformar em remodelar a cozinha toda, depois de começar a obra e pagar, já não há volta a dar e tem de ir até ao fim", "Não comece se o orçamento pedido antes de tirar o módulo for mais do dobro do preço da máquina", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Começada a obra, já não há volta atrás" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Uma máquina de 12 ou mais serviços não cabe na bancada, por isso é essa ou uma mini de bancada" },
    { type: "excludes", from: "N1", to: "N5", why: "Com uma máquina já encastrada no módulo, não vai comprar também uma mini de bancada; é uma ou outra" },
    { type: "excludes", from: "N4", to: "N11", why: "A ideia de escolher o tamanho familiar é lavar também os tachos, o que contradiz deixá-los de fora" },
    { type: "excludes", from: "N2", to: "N7", why: "Lavar depois de cada refeição obriga a encher o depósito à mão três vezes por dia, o que é difícil de manter" },
    { type: "excludes", from: "N2", to: "N10", why: "Lavar depois de cada refeição costuma ficar abaixo de meia carga, o que contradiz a regra de não haver meias cargas" },
    { type: "excludes", from: "N9", to: "N11", why: "A ideia de trocar para tachos e pratos aptos é metê-los na máquina, o que contradiz deixar os tachos de fora" },
    { type: "requires", from: "N1", to: "N8", why: "Basta 1 cm a mais para não entrar no módulo, por isso tem de medir tudo antes de encomendar" },
    { type: "requires", from: "N4", to: "N10", why: "Uma máquina grande meio vazia gasta a água e a eletricidade de uma carga completa, por isso nada de meias cargas" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Remoção do módulo e mão de obra da instalação", v: "Menos um armário de arrumação", t: "Esperar que o técnico meça e instale", l: "Esperar por meia carga para lavar", x: "Abdicar da mini de bancada" },
      fatal: "N10", thesis: "Medir o módulo, encastrar uma máquina grande e só a pôr a lavar quando estiver pelo menos meio cheia", title: "Encastrada grande, de uma vez",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tachos e pratos novos, mais água e eletricidade a cada refeição", v: "Atrapalha a passagem durante o teste", t: "O módulo só sai ao fim de 30 dias", l: "Secar a loiça ao ar depois do programa rápido", x: "Abdicar da mini de bancada" },
      fatal: "N12", thesis: "Lavagem rápida após cada refeição; fica junto ao lava-loiça até provar que resulta e só depois é encastrada", title: "Rápida todos os dias, testar antes de encastrar",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Encher a água à mão em cada lavagem", v: "Ocupa um bom pedaço de bancada", t: "Lavar os tachos à mão todos os dias", l: "8 serviços ou menos", x: "Abdicar de encastrar e da grande capacidade" },
      fatal: "N11", thesis: "Uma mini de bancada que se enche à mão; os tachos lavam-se à mão", title: "Mini de bancada, sem canalização",
    },
  },
  recommend: { key: "alpha", why: "Numa casa com 3 ou mais pessoas, uma máquina grande trata da loiça do dia inteiro numa só lavagem" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "A loiça da família toda depende desta única máquina; se avariar, a única alternativa é lavar à mão", kill: "Abandone este plano se uma reparação demorar mais de 7 dias e a família voltar a lavar à mão", label: "Máquina única" },
};
