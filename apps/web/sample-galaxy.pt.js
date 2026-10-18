// 內建示範星系（IntentAnalysisResponse v1.0，葡萄牙語（葡萄牙）版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Como o código se divide em camadas", D2: "Em que os temas diferem", D3: "Até onde vai a personalização", D4: "Como se montam as definições do tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `O outro lado: levar «${dims[dim]}» no sentido oposto`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_PT = {
  schema_version: "1.0",
  core: {
    decision: "Cada marca deve ter a sua própria cópia (fork) dos componentes, ou todas devem partilhar o mesmo núcleo e mudar as diferenças através de ficheiros de configuração?",
    metric: "Em 60 dias: um tema novo sai em 2 dias ou menos, e o CSS de cada tema tem menos de 50KB",
  },
  quadrants: {
    Q1: { scar: "Componentes partilhados cheios de ifs por marca", sacred: "Nada de verificar a marca no núcleo" },
    Q2: { scar: "Corrigi à mão os layouts de mais de 100 temas", sacred: "Deixar a verificação de tipos apanhar os erros" },
    Q3: { scar: "Copiámos o design system de outros e complicámos demais", sacred: "Peças que se trocam inteiras" },
    Q4: { scar: "Vi a personalização descontrolar-se três vezes", sacred: "As camadas não se saltam" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Separar camadas", "Dividir os componentes em três camadas: um núcleo só com a lógica, uma view que liga tudo e uma camada de tema para os estilos; o núcleo não pode importar IDs de tema nem rotas", "Falha se, em 14 dias, aparecer no núcleo código que verifica o tema", null),
    N2: node("D2", 0, 1, "Só vars CSS", "Escrever todas as diferenças entre temas como variáveis CSS (custom properties), sem qualquer verificação de tema em componentes ou layouts", "Falha se o 3.º tema já obrigar a mudar componentes", "Diferenças de layout não se resolvem só com cores"),
    N3: node("D1", 1, 0, "Carregar 1 tema", "Durante a execução, carregar só a folha de estilos do tema atual, em vez de juntar todos os temas no primeiro carregamento da página", "Falha se, em 14 dias, o CSS de algum tema passar dos 50KB", null),
    N4: node("D4", 0, 2, "Config. tipada", "Cada tema entrega um objeto de configuração TypeScript completo; se faltar algum campo, o build falha", "Falha se um tema novo ainda obrigar a alterar componentes partilhados", null),
    N5: node("D3", 2, 0, "Cópia por marca", "Cada tema copia a pasta de componentes e altera-a por conta própria, para que nenhuma marca afete outra", "Falha se, a partir do 10.º tema, corrigir um bug obrigar a mudar mais de 10 sítios", "Corrigir um bug obriga a remendar todas as cópias"),
    N6: node("D3", 1, 2, "Poucos primeiro", "Ativar cada tema novo só para 5% dos clientes durante uma semana (com um interruptor de funcionalidades); ligá-lo para todos só se a taxa de erros se mantiver dentro da meta", "Falha se a taxa de erros passar de 1% durante essa semana", null),
    N7: node("D3", 2, 1, "Trocar carcaça", "Como os carros que partilham o chassis e só mudam a carroçaria: troca-se um layout inteiro enquanto a view e o núcleo partilhados por baixo ficam iguais", "Falha se trocar um layout obrigar a mexer no núcleo", "Os controlos podem comportar-se de forma diferente de um layout para outro",
      { lateral: { src: "Carros: chassis partilhado", dist: 2, drop: "Um molde novo para cada modelo" } }),
    N8: node("D2", 1, 0, "Encaixes fixos", "Como as peças de LEGO, que só encaixam nos pinos: os layouts definem encaixes fixos (slots), os temas só podem pôr componentes nesses encaixes e nada fora deles pode mudar", "Falha se o DOM fora dos encaixes for alterado uma única vez", null,
      { lateral: { src: "Brinquedos: peças de LEGO", dist: 3, drop: "Mexer no DOM à vontade" } }),
    N9: node("D4", 2, 0, "Herdar a base", "Como o negrito e o fino da mesma fonte: um tema só indica em que difere do tema por omissão, e todos os outros campos passam automaticamente", "Falha se a herança passar de 3 níveis", null,
      { lateral: { src: "Tipografia: pesos de uma fonte", dist: 4, drop: "Uma cópia completa por tema" } }),
    N10: node("D2", 2, 0, "Limitar campos", "Se cada pedido de personalização acrescentar um campo de configuração, manter a configuração vai acabar por custar mais do que simplesmente copiar o código", "Parar de acrescentar campos assim que uma única interface de configuração passar dos 40", "Tantas definições que ninguém as percebe",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "A abstração acaba por sair mais cara do que o código copiado" } }),
    N11: node("D4", 1, 0, "Sem remendos", "Se o negócio puder exigir verificações de marca diretamente nos componentes partilhados, a separação em camadas desfaz-se em menos de um trimestre", "Abandonar este plano se, em 14 dias, for acrescentada nem que seja 1 verificação de marca aos componentes partilhados", "Saltar as camadas para cumprir um prazo",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Cumprir o prazo é elogiado; saltar as camadas não tem castigo" } }),
    N12: node("D3", 0, 1, "Sem refazer", "Se for preciso passar os 70 módulos antes de lançar o que quer que seja, quanto mais se investiu, mais custa parar, e a reescrita tende a ficar a meio", "Parar se o primeiro módulo não tiver saído em 14 dias", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Reescrever tudo de uma vez arruína o calendário" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Uma configuração tipada partilhada ou uma cópia separada para cada marca: só pode escolher uma" },
    { type: "excludes", from: "N1", to: "N5", why: "Um núcleo partilhado de três camadas ou uma cópia dos componentes para cada marca: só pode escolher uma" },
    { type: "excludes", from: "N4", to: "N11", why: "A configuração tipada já trava os atalhos no build, por isso rever as camadas à mão é verificar a mesma coisa duas vezes" },
    { type: "excludes", from: "N2", to: "N7", why: "Se os temas só mudam variáveis CSS, ninguém troca componentes de layout inteiros" },
    { type: "excludes", from: "N2", to: "N10", why: "Só com variáveis CSS não há campos de configuração a acumular; escolha uma" },
    { type: "excludes", from: "N9", to: "N11", why: "A herança deixa um tema mudar pormenores por conta própria, o que choca com o sinal de alerta de nunca saltar as camadas" },
    { type: "requires", from: "N1", to: "N8", why: "Com três camadas, os temas têm de personalizar através de encaixes fixos, senão a camada view fica cheia de remendos" },
    { type: "requires", from: "N4", to: "N10", why: "A configuração tipada precisa de um limite de campos, senão cresce até ninguém a perceber" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Trabalho inicial de reescrita", v: "Nada de cópias rápidas", t: "60 dias para montar a estrutura", l: "É preciso escrever testes a fundo", x: "Nada de atalhos especiais para marcas" },
      fatal: "N10", thesis: "Três camadas para os componentes e um ficheiro de configuração tipado por tema, para que cada tema seja só uma configuração", title: "Por configuração · 3 camadas",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Pouca variedade de layouts", v: "Menos liberdade de design", t: "Uma pequena mudança por semana", l: "Layouts complexos ficam de fora", x: "Sem mudanças na estrutura da página" },
      fatal: "N12", thesis: "Só variáveis CSS e herança; mostrar os temas novos primeiro a poucos utilizadores e depois alargar", title: "Só estilos · aos poucos",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Código duplicado", v: "Corrigir um bug mexe em muitos sítios", t: "O mais rápido a lançar", l: "Mais temas, mais manutenção", x: "Abdicar da configuração tipada" },
      fatal: "N11", thesis: "Trocar layouts inteiros e deixar cada marca ter a sua própria cópia da carcaça", title: "Cópias por marca · chassis comum",
    },
  },
  recommend: { key: "alpha", why: "Com mais de 100 temas, só uma abordagem baseada em configuração mantém o custo de manutenção sob controlo" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Todos os temas herdam do mesmo tema por omissão", kill: "Se o tema por omissão se avariar, o layout de todos os temas avaria com ele", label: "Tudo num tema" },
};
