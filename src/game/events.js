// ============================================================
// events.js — dados dos quatro eventos históricos.
// Cada evento é independente da lógica do jogo: textos,
// alternativas e efeitos simulados vivem apenas aqui.
// Efeitos: deltas sobre os indicadores (0–100):
//   abastecimento, igualdade, legitimidade, pressao
// ============================================================

export const INDICATORS = [
  { id: 'abastecimento', label: 'Abastecimento' },
  { id: 'igualdade', label: 'Igualdade social' },
  { id: 'legitimidade', label: 'Legitimidade política' },
  { id: 'pressao', label: 'Pressão social' }
];

export const INITIAL_INDICATORS = {
  abastecimento: 50,
  igualdade: 50,
  legitimidade: 50,
  pressao: 50
};

export const PHASES = {
  france: {
    id: 'france',
    name: 'FRANÇA — 1789',
    intro:
      'A monarquia enfrenta uma crise financeira, enquanto desigualdades sociais, dificuldades econômicas e disputas políticas ampliam a insatisfação.',
    button: 'EXPLORAR PARIS'
  },
  russia: {
    id: 'russia',
    name: 'RÚSSIA — 1917',
    intro:
      'A guerra, a escassez e a crise do czarismo contribuíram para uma disputa sobre quem deveria governar e como responder às reivindicações populares.',
    button: 'EXPLORAR PETROGRADO'
  }
};

export const EVENTS = [
  {
    id: 'fr-crise-fiscal',
    phase: 'france',
    order: 1,
    title: 'Quem deve pagar pela crise?',
    kicker: 'França, 1789 · Administração real',
    hotspotLabel: 'Investigar a administração do rei',
    context:
      'A monarquia enfrenta uma grave crise financeira. O sistema tributário é marcado por privilégios, enquanto a convocação dos Estados Gerais abre uma disputa sobre representação e poder.',
    question: 'Como enfrentar a crise fiscal?',
    options: [
      {
        letter: 'A',
        title: 'Reformar os privilégios tributários',
        description:
          'Defender uma tributação mais abrangente, enfrentando a resistência dos grupos privilegiados.',
        effects: { igualdade: 14, legitimidade: -6, pressao: 6 },
        result:
          'A reforma ampliou a tributação e reduziu privilégios na simulação, mas a reação dos grupos privilegiados abalou a estabilidade política no curto prazo.',
        history:
          'A crise fiscal e a resistência a reformas contribuíram para a convocação dos Estados Gerais em 1789. As disputas sobre representação e votação tornaram-se centrais no processo revolucionário.'
      },
      {
        letter: 'B',
        title: 'Preservar os privilégios existentes',
        description:
          'Evitar um confronto imediato com os grupos privilegiados, mantendo o modelo tradicional.',
        effects: { legitimidade: 4, pressao: 10, igualdade: -4 },
        result:
          'A ordem foi mantida por enquanto, mas a insatisfação cresceu e a estrutura de privilégios permaneceu intocada na simulação.',
        history:
          'Os privilégios e as tentativas de reforma integravam um conflito maior sobre a organização do Antigo Regime. A sociedade francesa não era politicamente homogênea, e diferentes grupos defendiam mudanças distintas.'
      },
      {
        letter: 'C',
        title: 'Transferir o peso da crise aos setores populares',
        description:
          'Buscar recursos rapidamente, concentrando a carga da crise nos grupos com menos privilégios.',
        effects: { abastecimento: 6, igualdade: -12, pressao: 14 },
        result:
          'O governo arrecadou recursos rápidos na simulação, mas a desigualdade aumentou e a pressão social disparou.',
        history:
          'A desigualdade tributária e as dificuldades econômicas contribuíram para a insatisfação com o Antigo Regime. Essa situação foi parte de um conjunto de causas, não uma explicação isolada para a Revolução.'
      }
    ]
  },
  {
    id: 'fr-pao',
    phase: 'france',
    order: 2,
    title: 'Quando o pão fica caro',
    kicker: 'França, 1789 · A padaria da praça',
    hotspotLabel: 'Investigar a padaria',
    context:
      'Dificuldades econômicas e a alta dos preços dos alimentos ampliam a insatisfação. Em Paris, a mobilização popular ganha importância e a crise política se aprofunda.',
    question: 'Como responder à insatisfação popular?',
    options: [
      {
        letter: 'A',
        title: 'Negociar reformas e ampliar a representação',
        description:
          'Buscar uma saída política, aceitando que a crise não pode ser resolvida apenas pela autoridade monárquica.',
        effects: { pressao: -10, legitimidade: 8 },
        result:
          'A negociação acalmou parte da população e deu fôlego à autoridade na simulação, embora grupos ligados à ordem tradicional resistissem às mudanças.',
        history:
          'A Revolução Francesa envolveu a transformação das instituições políticas, a disputa sobre soberania e a contestação dos privilégios. A mobilização popular teve papel fundamental no processo.'
      },
      {
        letter: 'B',
        title: 'Adotar medidas emergenciais de abastecimento',
        description:
          'Tentar reduzir o impacto imediato das dificuldades alimentares, sem resolver todas as disputas políticas.',
        effects: { abastecimento: 14, pressao: -8 },
        result:
          'O abastecimento melhorou e a pressão social diminuiu no curto prazo, mas as disputas políticas e a desigualdade continuaram sem solução.',
        history:
          'As dificuldades econômicas e o preço do pão ajudaram a ampliar a insatisfação popular. O contexto da Revolução, contudo, também envolvia disputas institucionais, fiscais e políticas.'
      },
      {
        letter: 'C',
        title: 'Reprimir as manifestações',
        description:
          'Utilizar a força para tentar restaurar a ordem, preservando a autoridade existente.',
        effects: { legitimidade: -12, pressao: 12, abastecimento: -4 },
        result:
          'A repressão impôs uma calma momentânea nas ruas, mas desgastou a autoridade e alimentou uma insatisfação ainda maior na simulação.',
        history:
          'A tomada da Bastilha, em 14 de julho de 1789, tornou-se um marco simbólico da Revolução. A mobilização em Paris esteve ligada a um contexto mais amplo de crise política, circulação de armas e contestação da autoridade real.'
      }
    ]
  },
  {
    id: 'ru-guerra',
    phase: 'russia',
    order: 3,
    title: 'Uma guerra sem fim?',
    kicker: 'Rússia, 1917 · Fábrica e estação',
    hotspotLabel: 'Investigar a fábrica e a estação',
    context:
      'A Primeira Guerra Mundial intensifica os problemas econômicos e o desgaste político. Após a Revolução de Fevereiro, o czarismo cai, mas o Governo Provisório continua enfrentando a guerra e uma sociedade em crise.',
    question: 'Qual deve ser a prioridade política?',
    options: [
      {
        letter: 'A',
        title: 'Continuar o esforço de guerra',
        description:
          'Manter o compromisso militar, apesar dos custos sociais e econômicos.',
        effects: { legitimidade: -10, pressao: 12, abastecimento: -6 },
        result:
          'Os compromissos militares foram mantidos, mas o desgaste político e a escassez pioraram na simulação.',
        history:
          'O Governo Provisório manteve a Rússia na Primeira Guerra Mundial. Essa posição contribuiu para o desgaste de sua autoridade em um contexto de oposição crescente à continuidade do conflito.'
      },
      {
        letter: 'B',
        title: 'Buscar uma saída negociada da guerra',
        description:
          'Priorizar uma solução para o conflito, reconhecendo que a retirada também teria custos e consequências.',
        effects: { pressao: -10, legitimidade: 8, abastecimento: 4 },
        result:
          'A busca pela paz aliviou a pressão social na simulação, mas os termos e os custos de uma saída permaneceram incertos.',
        history:
          'A oposição à guerra foi importante na mobilização revolucionária. A paz tornou-se uma das reivindicações centrais dos bolcheviques, mas a retirada efetiva ocorreu depois da tomada do poder, nas condições estabelecidas pelo Tratado de Brest-Litovsk, em 1918.'
      },
      {
        letter: 'C',
        title: 'Adiar uma decisão definitiva',
        description:
          'Manter o governo funcionando enquanto se tenta construir uma solução política mais ampla.',
        effects: { legitimidade: -6, pressao: 6 },
        result:
          'O governo ganhou alguns dias de calma, mas a incerteza cresceu e a autoridade continuou se desgastando sem respostas concretas.',
        history:
          'O Governo Provisório enfrentou dificuldades para conciliar a continuidade da guerra, a crise econômica, as reivindicações populares e a disputa com os sovietes. Não existia consenso sobre como resolver esses problemas.'
      }
    ]
  },
  {
    id: 'ru-poder',
    phase: 'russia',
    order: 4,
    title: 'Quem deve decidir o futuro da Rússia?',
    kicker: 'Rússia, 1917 · Conselho de operários e soldados',
    hotspotLabel: 'Investigar o soviete',
    context:
      'A queda do czar não encerrou a crise. Trabalhadores, soldados, camponeses e diferentes organizações políticas defendiam soluções distintas para a guerra, a distribuição da terra e a organização do poder.',
    question: 'Como enfrentar a disputa sobre o futuro político?',
    options: [
      {
        letter: 'A',
        title: 'Priorizar a Assembleia Constituinte',
        description:
          'Defender uma solução institucional baseada em eleições para uma assembleia representativa.',
        effects: { legitimidade: 10, pressao: 6, igualdade: 2 },
        result:
          'A aposta nas instituições fortaleceu a legitimidade na simulação, mas a lentidão do processo manteve as reivindicações urgentes sem resposta.',
        history:
          'A Assembleia Constituinte foi eleita depois da Revolução de Outubro, mas acabou dissolvida pelo governo bolchevique em janeiro de 1918. A relação entre representação, soberania e poder revolucionário tornou-se uma das disputas centrais do novo regime.'
      },
      {
        letter: 'B',
        title: 'Priorizar terra e paz',
        description:
          'Dar prioridade às reivindicações por terra e ao encerramento da participação russa na guerra.',
        effects: { pressao: -12, igualdade: 10, legitimidade: -4 },
        result:
          'Atender às reivindicações por terra e paz aliviou a pressão social na simulação, mas gerou conflitos com grupos que rejeitavam os termos e as consequências das medidas.',
        history:
          '“Paz, Terra e Pão” sintetizou reivindicações importantes no contexto revolucionário. A questão agrária era fundamental para muitos camponeses, mas diferentes forças políticas divergiam sobre como e por quem as mudanças deveriam ser conduzidas.'
      },
      {
        letter: 'C',
        title: 'Transferir o poder aos sovietes sob liderança bolchevique',
        description:
          'Apoiar a transferência de poder para os sovietes, com liderança dos bolcheviques.',
        effects: { legitimidade: -8, pressao: 8, igualdade: 6 },
        result:
          'A transferência de poder mobilizou grupos revolucionários na simulação, mas aprofundou o conflito com as forças políticas adversárias e transformou a organização do poder.',
        history:
          'Em outubro de 1917, os bolcheviques lideraram a tomada do poder em Petrogrado. O acontecimento abriu uma nova etapa de conflitos sobre o governo, a representação política e a direção da revolução. A evolução posterior incluiu guerra civil, centralização do poder e restrições ao pluralismo político.'
      }
    ]
  }
];

// ---------- Conteúdo da tela final ----------

export const FINAL = {
  title: 'DUAS REVOLUÇÕES. CAMINHOS DIFERENTES.',
  subtitle:
    'As crises abriram espaço para transformações profundas, mas os resultados dependeram de conflitos sociais, instituições, escolhas políticas e circunstâncias históricas.',
  pathLabel: 'Seu percurso dentro da simulação',
  france: {
    title: 'Revolução Francesa',
    points: [
      ['Contexto', 'crise fiscal, desigualdade jurídica e tributária, dificuldades econômicas e contestação do Antigo Regime.'],
      ['Marco inicial', 'convocação dos Estados Gerais em 1789 e escalada dos conflitos políticos.'],
      ['Participação popular', 'mobilização urbana e rural, além da atuação de diferentes grupos políticos e sociais.'],
      ['Transformações', 'fim dos privilégios feudais, redefinição da soberania política e mudanças institucionais profundas.'],
      ['Desdobramentos', 'república, conflitos internos, período do Terror e ascensão de Napoleão.']
    ]
  },
  russia: {
    title: 'Revolução Russa',
    points: [
      ['Contexto', 'desigualdades sociais, crise do czarismo, tensões agrárias e efeitos da Primeira Guerra Mundial.'],
      ['Fevereiro de 1917', 'queda do czar e formação do Governo Provisório, em meio a um quadro de poder dividido.'],
      ['Outubro de 1917', 'tomada do poder pelos bolcheviques.'],
      ['Transformações', 'mudanças na propriedade, na organização do Estado e nas relações políticas.'],
      ['Desdobramentos', 'guerra civil, centralização do poder e formação posterior da União Soviética.']
    ]
  },
  dimensions: [
    {
      title: '1 · Crise que contribuiu para a revolução',
      fr: 'Crise fiscal do Estado, privilégios tributários e dificuldades econômicas em um regime de desigualdade jurídica.',
      ru: 'Desgaste da Primeira Guerra Mundial, escassez e crise de legitimidade do czarismo.'
    },
    {
      title: '2 · Principais reivindicações',
      fr: 'Representação política, fim dos privilégios e redefinição da soberania.',
      ru: '“Paz, Terra e Pão”: fim da guerra, reforma agrária e abastecimento.'
    },
    {
      title: '3 · Grupos e forças políticas em disputa',
      fr: 'Monarquia, grupos privilegiados e um Terceiro Estado internamente diverso.',
      ru: 'Governo Provisório, sovietes, bolcheviques, trabalhadores, soldados e camponeses — sem um único bloco homogêneo.'
    },
    {
      title: '4 · Transformações institucionais',
      fr: 'Fim dos privilégios feudais e nova organização política ao longo de vários anos.',
      ru: 'Queda da monarquia, mudanças na propriedade e nova organização do Estado após outubro.'
    },
    {
      title: '5 · Consequências e contradições',
      fr: 'República, conflitos internos, Terror e, por fim, o império napoleônico.',
      ru: 'Guerra civil, centralização do poder e, anos depois, a formação da União Soviética.'
    }
  ],
  philosophers: [
    {
      name: 'Rousseau',
      theme: 'Soberania popular e legitimidade',
      text: 'Suas ideias ajudam a discutir de onde vem a autoridade para governar — um debate presente nas duas revoluções, sem que ele sozinho tenha “causado” a Revolução Francesa.',
      question: 'Quem tem legitimidade para governar, e de onde vem essa autoridade?'
    },
    {
      name: 'Karl Marx',
      theme: 'Classes sociais e condições materiais',
      text: 'Seus conceitos ajudam a interpretar desigualdades e conflitos de interesse, sobretudo no contexto russo — sem explicar sozinhos todos os acontecimentos.',
      question: 'Como as condições materiais de vida influenciam os conflitos políticos?'
    },
    {
      name: 'John Locke',
      theme: 'Direitos e consentimento',
      text: 'Seus conceitos sobre direitos, consentimento dos governados e limites do poder ajudam a discutir a legitimidade e as críticas ao poder arbitrário.',
      question: 'Quando um governo perde o direito de comandar?'
    }
  ],
  question: 'Uma revolução consegue cumprir suas promessas sem criar novas disputas pelo poder?',
  questionHint: 'Discuta essa questão considerando os acontecimentos das duas revoluções.',
  sources: [
    {
      label: 'Encyclopaedia Britannica — French Revolution',
      url: 'https://www.britannica.com/event/French-Revolution'
    },
    {
      label: 'Encyclopaedia Britannica — Russian Revolution',
      url: 'https://www.britannica.com/event/Russian-Revolution'
    },
    {
      label: 'OpenStax — World History, Volume 2 (material didático aberto)',
      url: 'https://openstax.org/details/books/world-history-volume-2'
    },
    {
      label: 'Declaração dos Direitos do Homem e do Cidadão (1789) — texto na Wikisource',
      url: 'https://pt.wikisource.org/wiki/Declara%C3%A7%C3%A3o_dos_Direitos_do_Homem_e_do_Cidad%C3%A3o'
    }
  ]
};

// Textos de fechamento conforme o estado final da simulação.
export function closingText(indicators) {
  const { abastecimento, igualdade, legitimidade, pressao } = indicators;
  const problems = [];
  if (pressao >= 65) problems.push('a pressão social seguiu alta');
  if (legitimidade <= 35) problems.push('a autoridade política saiu desgastada');
  if (abastecimento <= 35) problems.push('o abastecimento continuou crítico');
  if (igualdade <= 35) problems.push('as desigualdades permaneceram profundas');
  if (problems.length === 0) {
    return 'Na sua simulação, nenhum indicador terminou em situação crítica — mas na História real, nenhuma decisão resolveu todos os conflitos de uma vez. Revoluções abrem caminhos, não garantem destinos.';
  }
  const list =
    problems.length === 1
      ? problems[0]
      : problems.slice(0, -1).join(', ') + ' e ' + problems[problems.length - 1];
  return `No fim do seu percurso simulado, ${list}. Assim como na História, cada escolha atendeu a alguns grupos e entrou em conflito com outros — não havia uma sequência perfeita de decisões.`;
}
