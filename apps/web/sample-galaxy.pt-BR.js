// 內建示範星系（IntentAnalysisResponse v1.0，巴西葡萄牙語版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Fronteiras entre camadas", D2: "Como se exprime a variação", D3: "Âmbito da personalização", D4: "Composição do tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Posição contrária: levar "${dims[dim]}" ao extremo oposto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_PT_BR = {
  schema_version: "1.0",
  core: {
    decision: "Cada marca deve fazer fork dos seus próprios componentes, ou deve haver um único core compartilhado, controlado por configuração?",
    metric: "Em 60 dias: um tema novo sai em ≤2 dias e o CSS de cada tema tem <50KB",
  },
  quadrants: {
    Q1: { scar: "Componentes comcompartilhados cheios de ifs por marca", sacred: "Zero ramificações no core" },
    Q2: { scar: "Mais de 100 temas remendados à mão, um a um", sacred: "Os tipos pegam os erros" },
    Q3: { scar: "Copiamos um design system e abstraímos demais", sacred: "Estrutura substituível" },
    Q4: { scar: "Vi a personalização sair do controle três vezes", sacred: "As fronteiras se mantêm" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 camadas", "Dividir os componentes em um core puro, em uma view que coordena e em uma folha de theme; o core não pode importar IDs de tema nem rotas", "Errado se, em 14 dias, aparecerem verificações de tema no core", null),
    N2: node("D2", 0, 1, "Só vars CSS", "Exprimir todas as diferenças entre temas apenas com custom properties de CSS, sem qualquer ramificação em componentes ou layouts", "Errado se o 3.º tema já obrigar a mexer em componentes", "Diferenças de layout não se resolvem só com cores"),
    N3: node("D1", 1, 0, "CSS diferido", "Em tempo de execução, carregar apenas a folha de estilos do tema ativo, em vez de juntar todos os temas no primeiro render", "Errado se, em 14 dias, o CSS de algum tema passar dos 50KB", null),
    N4: node("D4", 0, 2, "Config. tipada", "Cada tema entrega um objeto de configuração TypeScript completo; se faltar algum campo, o build falha", "Errado se um tema novo ainda obrigar a alterar componentes comcompartilhados", null),
    N5: node("D3", 2, 0, "Fork por marca", "Cada tema copia o diretório de componentes e o altera de forma independente, para que nenhuma marca afete outra", "Errado se, a partir do 10.º tema, corrigir um bug mexer em mais de 10 lugares", "Corrigir um bug obriga a remendar N cópias"),
    N6: node("D3", 1, 2, "Temas canary", "Lançar cada tema novo atrás de uma feature flag para 5% dos tenants durante uma semana; passar a 100% só se a taxa de erros cumprir a meta", "Errado se a taxa de erros do canary passar de 1%", null),
    N7: node("D3", 2, 1, "Trocar carcaça", "[D2 plataforma de carro] Os layouts são como carrocerias: você troca a carroceria inteira enquanto o chassi comum (view e core) fica igual", "Errado se trocar um layout exigir alterações no core", "As interações divergem entre layouts",
      { lateral: { src: "Indústria automotiva: chassi de plataforma", dist: 2, drop: "Redesenhar cada modelo do zero" } }),
    N8: node("D2", 1, 0, "Slots fixos", "[D3 peças de LEGO] Os layouts declaram slots fixos; os temas só podem encaixar componentes nesses slots e não podem alterar a estrutura fora deles", "Errado se o DOM fora dos slots for alterado uma única vez", null,
      { lateral: { src: "Brinquedos: encaixe de peças LEGO", dist: 3, drop: "Personalização livre do DOM" } }),
    N9: node("D4", 2, 0, "Herdar diffs", "[D4 família tipográfica] Os temas declaram apenas o diff em relação ao tema padrão; todos os outros campos são herdados automaticamente", "Errado se a herança passar de 3 níveis", null,
      { lateral: { src: "Tipografia: famílias de pesos", dist: 4, drop: "Cópia completa por tema" } }),
    N10: node("D2", 2, 0, "Limitar chaves", "Se cada pedido de personalização acrescentar um campo de configuração, manter a configuração vai acabar custando mais do que fazer fork e pronto", "Parar de acrescentar campos assim que uma interface de configuração passar dos 40 campos", "Inferno de configuração",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "A abstração sai mais cara do que duplicar" } }),
    N11: node("D4", 1, 0, "Travar atalhos", "Se o negócio puder exigir verificações de marca diretamente nos componentes comcompartilhados, a fronteira cai em menos de um trimestre", "Anulado se, em 14 dias, for acrescentada alguma verificação de marca aos componentes comcompartilhados", "Trocar fronteiras por prazos",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "A pressão dos prazos premeia quem fura as fronteiras" } }),
    N12: node("D3", 0, 1, "Sem big bang", "Se for preciso migrar os 70 módulos antes de lançar o que quer que seja, o custo afundado vai deixar o refactor pela metade", "Parar se o primeiro módulo não tiver saído em 14 dias", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Um refactor big bang faz dos prazos reféns" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Configuração tipada partilhada ou fork de componentes por marca: é uma ou outra" },
    { type: "excludes", from: "N1", to: "N5", why: "Um core compartilhado de três camadas e cópias de componentes por marca excluem-se mutuamente" },
    { type: "excludes", from: "N4", to: "N11", why: "A configuração tipada já trava os atalhos na compilação, então revisar as fronteiras à mão seria um controle redundante" },
    { type: "excludes", from: "N2", to: "N7", why: "Se os temas só mudam variáveis CSS, não há troca de componentes de layout inteiros" },
    { type: "excludes", from: "N2", to: "N10", why: "Com variáveis CSS puras não há campos de configuração para inchar; escolha uma" },
    { type: "excludes", from: "N9", to: "N11", why: "As cadeias de herança permitem sobrescritas locais, o que choca com uma salvaguarda de zero atalhos" },
    { type: "requires", from: "N1", to: "N8", why: "Depois de separar as três camadas, os temas precisam personalizar através de slots fixos, senão a camada view fica furada" },
    { type: "requires", from: "N4", to: "N10", why: "A configuração tipada precisa de um limite de campos, senão vira um inferno de configuração" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Esforço inicial de refactoring", v: "Sem forks rápidos", t: "60 dias para montar o esqueleto", l: "É preciso escrever testes de integridade", x: "Sem atalhos por marca" },
      fatal: "N10", thesis: "Fronteiras de três camadas e configuração tipada reduzem cada tema a uma única folha", title: "Por configuração · 3 camadas",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Pouca variação de layout", v: "Menos liberdade de design", t: "Pequenos passos toda semana", l: "Layouts complexos ficam de fora", x: "Sem personalização estrutural" },
      fatal: "N12", thesis: "Só variáveis CSS e herança, lançando os temas aos poucos atrás de canaries", title: "Só estilos · gradual",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Código duplicado", v: "Corrigir um bug mexe em muitos lugares", t: "O mais rápido para lançar", l: "O custo de manutenção cresce de forma linear", x: "Abrir mão da configuração tipada" },
      fatal: "N11", thesis: "Trocar layouts inteiros e deixar cada marca fazer fork da sua própria carroceria", title: "Forks por marca · chassi comum",
    },
  },
  recommend: { key: "alpha", why: "Com mais de 100 temas, só um design orientado por configuração mantém o custo de manutenção sob controle" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos os temas herdam do mesmo tema padrão", kill: "Se o tema padrão quebrar, quebra o layout de todos os temas", label: "SPOF tema base" },
};
