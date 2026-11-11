/** Dados visuais e pontos de interesse. Coordenadas em unidades do mundo. */
const makePoi = (phase, id, y, title, short, icon, pages) => ({
  id, x: 520, y, title, short, icon, radius: 48,
  // Convenção: uma imagem PNG opcional por tópico, com o mesmo nome do ID.
  image: `assets/topicos/${phase}/${id}.png`,
  // Cada item é uma página independente do diálogo (ex.: 1 / 4, 2 / 4...).
  lines: pages
});

export const SCENES = {
  france: {
    id: 'france', label: '1789–1799 FRANÇA', footer: 'PARIS 1789', title: 'Paris em ebulição', year: '1789–1799',
    world: { width: 1040, height: 3220 }, palette: 'france', spawn: { x: 520, y: 185 },
    obstacles: [
      { x: 70, y: 160, w: 260, h: 175 }, { x: 700, y: 145, w: 270, h: 205 },
      { x: 65, y: 500, w: 225, h: 175 }, { x: 750, y: 500, w: 220, h: 195 },
      { x: 55, y: 900, w: 250, h: 180 }, { x: 735, y: 920, w: 235, h: 170 },
      { x: 285, y: 30, w: 165, h: 95 }, { x: 615, y: 1380, w: 190, h: 90 }
    ],
    poi: [
      makePoi('france', 'estates', 190, 'Sociedade e crise do Antigo Regime', 'SOCIEDADE ANTIGO REGIME', '⚖', [
        'A sociedade francesa era dividida em três estados: clero, nobreza e Terceiro Estado.',
        'Clero e nobreza mantinham privilégios. O Terceiro Estado reunia burgueses, artesãos, trabalhadores e camponeses.',
        'A maior parte dos impostos recaía sobre o Terceiro Estado, que tinha pouca influência política.',
        'Dívidas do governo, más colheitas e o preço alto do pão agravaram a crise da monarquia.'
      ]),
      makePoi('france', 'estates-general', 500, 'Estados Gerais e Juramento da Péla', 'ESTADOS GERAIS 1789', '▤', [
        'Em maio de 1789, Luís XVI convocou os Estados Gerais para discutir a grave crise financeira.',
        'Cada estado tinha tradicionalmente um voto. Assim, clero e nobreza podiam derrotar o Terceiro Estado.',
        'Os representantes do Terceiro Estado reivindicaram representar a nação e proclamaram a Assembleia Nacional.',
        'No Juramento da Péla, prometeram não se separar até que a França tivesse uma Constituição.'
      ]),
      makePoi('france', 'bastille', 810, 'Queda da Bastilha', 'BASTILHA 14 JUL 1789', '▥', [
        'Em 14 de julho de 1789, uma multidão de parisienses marchou até a fortaleza da Bastilha.',
        'Os revoltosos buscavam armas e pólvora em meio ao medo de uma repressão real.',
        'A fortaleza foi tomada. A queda da Bastilha tornou-se símbolo da resistência ao absolutismo.'
      ]),
      makePoi('france', 'great-fear', 1120, 'Grande Medo e fim dos privilégios feudais', 'GRANDE MEDO 1789', '⚑', [
        'No verão de 1789, rumores de ataques aristocráticos provocaram pânico em diversas regiões rurais.',
        'Camponeses invadiram propriedades e destruíram registros de obrigações feudais. Esse movimento ficou conhecido como Grande Medo.',
        'Na noite de 4 de agosto, a Assembleia votou o fim de muitos privilégios feudais e direitos senhoriais.'
      ]),
      makePoi('france', 'rights', 1430, 'Declaração dos Direitos do Homem e do Cidadão', 'DIREITOS 1789', '📜', [
        'A Declaração dos Direitos do Homem e do Cidadão foi aprovada em agosto de 1789.',
        'O documento defendia liberdade, igualdade perante a lei, propriedade e soberania da nação.',
        'Apesar de sua linguagem universal, mulheres não receberam igualdade política e a escravidão continuou nas colônias.'
      ]),
      makePoi('france', 'constitutional', 1740, 'Monarquia Constitucional e crise política', 'MONARQUIA 1791–1792', '♜', [
        'A Constituição de 1791 transformou a França em uma monarquia constitucional e limitou os poderes do rei.',
        'O voto era restrito por critérios de renda, deixando grande parte da população sem participação eleitoral.',
        'A tentativa de fuga de Luís XVI e a guerra contra monarquias europeias aumentaram a desconfiança e a tensão.'
      ]),
      makePoi('france', 'republic', 2050, 'Queda da Monarquia e Proclamação da República', 'REPÚBLICA 1792', '★', [
        'Em agosto de 1792, uma insurreição popular atacou o centro do poder monárquico e levou à suspensão do rei.',
        'A Convenção Nacional reuniu representantes eleitos para decidir os rumos da revolução.',
        'Em 21 de setembro de 1792, a Convenção aboliu a monarquia e proclamou a República.'
      ]),
      makePoi('france', 'king-execution', 2360, 'Girondinos, Jacobinos e execução de Luís XVI', 'DISPUTAS 1793', '⚔', [
        'Na Convenção, girondinos e jacobinos divergiam sobre a velocidade e a direção da revolução.',
        'A disputa política se intensificou enquanto a França enfrentava guerra externa e conflitos internos.',
        'Luís XVI foi julgado pela Convenção e executado na guilhotina em 21 de janeiro de 1793.'
      ]),
      makePoi('france', 'terror', 2670, 'Período do Terror e queda de Robespierre', 'TERROR 1793–1794', '⚑', [
        'Entre 1793 e 1794, o governo revolucionário enfrentou invasões, revoltas internas e suspeitas de conspiração.',
        'O Comitê de Salvação Pública concentrou poderes e reprimiu quem considerava inimigo da revolução.',
        'O período ficou conhecido como Terror. Robespierre caiu e foi executado em julho de 1794.'
      ]),
      makePoi('france', 'directory', 2980, 'Diretório e Golpe de Napoleão', 'DIRETÓRIO 1795–1799', '♛', [
        'A Constituição de 1795 instituiu o Diretório, um governo de cinco diretores apoiado por um sistema político instável.',
        'Crises econômicas, conflitos sociais e guerras enfraqueceram o regime e aumentaram a influência dos militares.',
        'No golpe de 18 de Brumário, em novembro de 1799, Napoleão Bonaparte tomou o poder.'
      ] )
    ],
    ambience: 'france'
  },
  russia: {
    id: 'russia', label: '1905–1922 RÚSSIA', footer: 'PETROGRADO 1917', title: 'Petrogrado em revolta', year: '1905–1922',
    world: { width: 1040, height: 2290 }, palette: 'russia', spawn: { x: 520, y: 185 },
    obstacles: [
      { x: 65, y: 155, w: 280, h: 190 }, { x: 710, y: 150, w: 255, h: 190 },
      { x: 55, y: 510, w: 235, h: 190 }, { x: 760, y: 500, w: 215, h: 180 },
      { x: 60, y: 900, w: 260, h: 180 }, { x: 750, y: 910, w: 225, h: 175 },
      { x: 555, y: 15, w: 240, h: 90 }, { x: 240, y: 1385, w: 190, h: 80 }
    ],
    poi: [
      makePoi('russia', 'tsar', 190, 'Nicolau II e a crise do Império Russo', 'NICOLAU II ATÉ 1905', '♜', [
        'No início do século XX, Nicolau II governava o Império Russo como czar autocrático.',
        'A maioria da população vivia no campo, em condições difíceis, enquanto as cidades cresciam com a industrialização.',
        'Desigualdade, repressão política e derrotas militares ampliaram a insatisfação com o regime.'
      ]),
      makePoi('russia', 'bloody-sunday', 500, 'Revolução de 1905 e Domingo Sangrento', 'REVOLUÇÃO 1905', '⚑', [
        'Em janeiro de 1905, trabalhadores marcharam pacificamente em São Petersburgo para entregar uma petição ao czar.',
        'Tropas abriram fogo contra a multidão. O episódio ficou conhecido como Domingo Sangrento.',
        'Greves e revoltas se espalharam pelo império. Nicolau II aceitou criar a Duma, um parlamento com poderes limitados.'
      ]),
      makePoi('russia', 'world-war', 810, 'Primeira Guerra Mundial e agravamento da crise', 'GUERRA MUNDIAL 1914–1917', '⚒', [
        'A entrada da Rússia na Primeira Guerra Mundial, em 1914, agravou problemas que já existiam.',
        'Derrotas militares, milhões de baixas e dificuldades de abastecimento atingiram soldados e famílias.',
        'A inflação e a falta de alimentos nas cidades fizeram crescer greves e protestos contra o czar.'
      ]),
      makePoi('russia', 'february', 1120, 'Revolução de Fevereiro e abdicação de Nicolau II', 'FEVEREIRO 1917', '✊', [
        'Em fevereiro de 1917 pelo calendário juliano, operárias e trabalhadores foram às ruas por pão e pelo fim da guerra.',
        'Greves cresceram e soldados enviados para reprimir os protestos passaram a apoiar a população.',
        'Sem apoio político ou militar, Nicolau II abdicou. No calendário gregoriano, era março de 1917.'
      ]),
      makePoi('russia', 'provisional', 1430, 'Governo Provisório, Sovietes e bolcheviques', 'GOVERNO PROVISÓRIO 1917', '☭', [
        'Após a abdicação do czar, o Governo Provisório assumiu o poder e prometeu organizar uma nova ordem política.',
        'Os Sovietes, conselhos de trabalhadores e soldados, também exerciam forte influência nas cidades e nas tropas.',
        'A decisão de continuar na guerra desgastou o governo. Lenin e os bolcheviques ganharam apoio com as palavras paz, pão e terra.'
      ]),
      makePoi('russia', 'october', 1740, 'Revolução de Outubro e tomada do poder', 'OUTUBRO 1917', '★', [
        'Em outubro de 1917 pelo calendário juliano, os bolcheviques organizaram uma insurreição em Petrogrado.',
        'Guardas vermelhos e unidades aliadas ocuparam pontos estratégicos, como pontes, estações e centros de comunicação.',
        'O Governo Provisório foi derrubado e um novo governo liderado pelos bolcheviques assumiu o poder.'
      ]),
      makePoi('russia', 'civil-war', 2050, 'Guerra Civil Russa e formação da URSS', 'GUERRA CIVIL 1918–1922', '⚔', [
        'A tomada do poder provocou uma guerra civil entre o Exército Vermelho e diferentes forças contrarrevolucionárias, chamadas de brancas.',
        'O conflito foi acompanhado por intervenção estrangeira, fome, epidemias e enorme sofrimento da população.',
        'Os bolcheviques venceram os principais adversários. Em dezembro de 1922, foi criada oficialmente a União Soviética, a URSS.'
      ])
    ],
    ambience: 'russia'
  }
};
