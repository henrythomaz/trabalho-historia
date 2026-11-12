# Entre Revoluções — jogo educativo 2D

Jogo curto de exploração top-down sobre a Revolução Francesa (1789–1799) e a Revolução Russa (1905–1922). Funciona localmente no navegador, sem backend, sem build e sem dependências externas para a lógica do jogo.

## Executar

1. Extraia a pasta `revolucoes-2d-dialogos-player-pixelizacao`.
2. **Não abra `index.html` com duplo clique (`file://`)**: o jogo usa módulos JavaScript ES, que os navegadores bloqueiam nesse modo por segurança. Na pasta do jogo, execute:

   ```bash
   ./iniciar-local.sh
   ```

   Depois acesse `http://localhost:8000`. Se preferir, o comando equivalente é `python3 -m http.server 8000`.
3. No celular, abra o endereço IP do computador na mesma rede Wi-Fi, usando a porta `8000`. O layout prioriza retrato.

O erro `Access to script ... from origin 'null' has been blocked by CORS policy` aparece quando o `index.html` é aberto diretamente pelo sistema de arquivos. Não é necessário remover `type="module"` nem transformar o projeto em um servidor com backend: basta servi-lo por HTTP, como o GitHub Pages faz.

## Controles

- **Celular:** arraste o joystick do canto inferior esquerdo para andar. Toque em um marco no cenário para caminhar automaticamente até ele; quando estiver perto, toque em **INTERAGIR**.
- **Computador:** use `W`, `A`, `S`, `D` ou as setas. Pressione `E` ou `Enter` perto de um marco. Também é possível clicar em um marco visível.
- Avance as mensagens tocando no botão **CONTINUAR**.
- Use o botão `♫` no topo para ligar/desligar a música. A trilha francesa toca na primeira fase e muda automaticamente para outra trilha calma ao começar a fase russa; o áudio começa após clicar em **COMEÇAR JORNADA**.

A fase francesa possui dez acontecimentos e a russa, sete, apresentados em ordem cronológica. Cada tópico traz um resumo de 20 a 30 palavras. Ao concluir todos os marcos de uma fase, aparece a transição para a próxima revolução; o encerramento compara brevemente os processos.


## Distribuição dos NPCs pelos tópicos

Os personagens são associados aos tópicos automaticamente, em blocos consecutivos e equilibrados. A ordem dos personagens nos arrays `france` e `russia` de `js/data/characters.js` determina a ordem desses blocos. Quando a divisão não é exata, os primeiros personagens recebem um tópico a mais. Por exemplo, 10 tópicos e 4 personagens resultam em blocos de **3, 3, 2 e 2 tópicos**: o NPC 1 fica associado aos tópicos 1–3, o NPC 2 aos tópicos 4–6, o NPC 3 aos tópicos 7–8 e o NPC 4 aos tópicos 9–10.

No mapa, cada NPC aparece somente ao lado do primeiro tópico de seu bloco. Ao abrir qualquer tópico desse mesmo bloco, o diálogo sempre usa aquele NPC; assim, a pessoa mostrada no cenário não muda inesperadamente entre as páginas ou os tópicos relacionados. Ao adicionar ou remover personagens nos arrays de `characters.js`, a distribuição é recalculada automaticamente.

Na configuração atual, a França tem 10 tópicos e 3 personagens (blocos de **4, 3 e 3**); a Rússia tem 7 tópicos e 4 personagens (blocos de **2, 2, 2 e 1**).

## Inserir as duas versões de cada personagem PNG

Cada personagem possui **seis imagens independentes**: três para aparecer no mapa e três para o retrato dos diálogos. As pastas já estão preparadas para os sete personagens:

```text
personagens/
├── personagem1/
│   ├── cenario/
│   │   ├── pose1.png
│   │   ├── pose2.png
│   │   └── pose3.png
│   └── dialogo/
│       ├── pose1.png
│       ├── pose2.png
│       └── pose3.png
├── personagem2/ (mesma estrutura)
├── personagem3/ (mesma estrutura)
├── personagem4/ (mesma estrutura)
├── personagem5/ (mesma estrutura)
├── personagem6/ (mesma estrutura)
└── personagem7/ (mesma estrutura)
```

**Poses da pasta `cenario/`:**
- `pose1.png`: personagem parado no mapa.
- `pose2.png`: jogador se aproxima do NPC.
- `pose3.png`: NPC que está participando do diálogo.

**Poses da pasta `dialogo/`:**
- `pose1.png`: primeira página da conversa.
- `pose2.png`: segunda página.
- `pose3.png`: terceira página e todas as páginas seguintes.

Use imagens diferentes nas duas pastas para que o desenho do mapa tenha o acabamento próprio de sprite de jogo, enquanto o retrato do diálogo tenha sua versão mais detalhada/pixelada. Os arquivos devem ser PNG e usar exatamente esses nomes.
Na personagem 7, `cenario/pose3.png` ainda não está no pacote enviado. Até esse arquivo ser adicionado, o jogo usa `cenario/pose2.png` como alternativa para a pose de participação no diálogo; os três retratos da pasta `dialogo/` já estão presentes.

**Compatibilidade com os arquivos antigos:** caso uma pose nova ainda não exista, o carregador procura automaticamente `pose1.png`, `pose2.png` ou `pose3.png` na pasta principal do personagem (e também aceita subpastas antigas `pose 1/`, `pose2/` etc.). Assim, você pode atualizar os personagens aos poucos sem deixar o NPC invisível.

O resumo de cada acontecimento agora é dividido em três ou quatro páginas curtas. O contador mostra automaticamente `1 / N`, `2 / N` e assim por diante. Nos retratos, a pose muda junto com a página: primeira página usa pose 1, segunda usa pose 2 e terceira em diante usa pose 3.

## Imagens opcionais do jogador

A pasta `player/` permite substituir o aventureiro que antes era desenhado diretamente pelo Canvas. Para usar uma única imagem, basta colocar `player.png` dentro dela. O jogo carrega esse PNG automaticamente; se não encontrar uma imagem válida, mantém o desenho original sem erro.

Também é possível adicionar imagens direcionais (`front.png`, `back.png`, `left.png` e `right.png`) para o personagem mudar conforme a direção do movimento. Para animar a caminhada, use `walk1.png` e `walk2.png` (ou `pose2.png` e `pose3.png`), e, opcionalmente, versões direcionais como `front-walk1.png` e `front-walk2.png`. A lista completa de nomes aceitos está em `player/README.txt`.

As imagens devem ser PNG, preferencialmente com fundo transparente. A arte mantém sua proporção e o tamanho visual aproximado do jogador atual.

## Imagens opcionais dos tópicos históricos

Cada tópico pode mostrar uma ilustração no canto superior direito do diálogo. Os arquivos são opcionais: se a imagem não existir, o espaço da ilustração fica oculto, sem ícone de arquivo quebrado.

Adicione suas imagens PNG usando exatamente o nome do ID do tópico:

```text
assets/topicos/
├── france/
│   ├── estates.png
│   ├── estates-general.png
│   ├── bastille.png
│   ├── great-fear.png
│   ├── rights.png
│   ├── constitutional.png
│   ├── republic.png
│   ├── king-execution.png
│   ├── terror.png
│   └── directory.png
└── russia/
    ├── tsar.png
    ├── bloody-sunday.png
    ├── world-war.png
    ├── february.png
    ├── provisional.png
    ├── october.png
    └── civil-war.png
```

O vínculo é definido junto aos dados de cada tópico em `js/data/scenes.js`, pela convenção `assets/topicos/{fase}/{id-do-topico}.png`. Para adicionar ou trocar uma ilustração, basta colocar o PNG correspondente na pasta; não é necessário gerar imagens dentro do jogo nem alterar o diálogo.

Os títulos dos marcos são exibidos em uma camada HTML nítida acima do mapa pixel art. O cenário usa um framebuffer reduzido em blocos de aproximadamente 4,5 pixels e é ampliado por vizinho mais próximo, reforçando discretamente o acabamento pixel art. NPCs recebem uma redução de resolução de 3% e o jogador, de 4%, em camadas próprias; os personagens continuam ordenados pela coordenada vertical, sem passar pelo framebuffer do cenário. Os retratos próprios de diálogo mantêm sua renderização pixelada. As imagens dos tópicos podem ser clicadas para abrir uma visualização ampliada com fundo escurecido e botão X para fechar. Os prédios próximos a quatro marcos foram reposicionados com seus respectivos retângulos de colisão para deixar livres as áreas de aproximação e interação; a regra de colisão e a progressão do jogo permanecem preservadas.

## Estrutura

```text
index.html
css/styles.css
js/main.js
js/data/{characters.js,scenes.js}
js/systems/{audio.js,character-distribution.js,collision.js,confetti.js,controls.js,dialogue.js,npc-manager.js}
js/render/renderer.js
assets/{cenarios,audio,outros}/
personagens/personagem1 ... personagem7/
tests/smoke.test.js
scripts/build.js
.github/workflows/deploy-pages.yml
.nojekyll
```

O mapa e os personagens provisórios são desenhados em Canvas 2D. `assets/cenarios/` e `assets/audio/` ficam disponíveis para futuros recursos próprios. O áudio atual é sintetizado com Web Audio e não requer arquivos de áudio.

## Testes locais

Com Node.js 18 ou superior:

```bash
npm test
```

Para gerar a pasta estática de publicação localmente, execute `npm run build`. Os testes verificam a quantidade de acontecimentos, o tamanho dos textos, a cobertura dos tópicos históricos, a colisão circular-retangular e a rotação equilibrada dos três NPCs da França e os quatro NPCs da Rússia, incluindo as posições de mapa.

## Publicar gratuitamente no GitHub Pages

O projeto é um site estático: não tem backend, bundler, variáveis secretas ou chamadas obrigatórias a APIs externas. O comando de build apenas copia os arquivos necessários para a pasta `dist`, que é enviada ao GitHub Pages. Os caminhos dos arquivos são relativos, então o jogo também funciona quando o repositório é publicado em um subcaminho do GitHub Pages.

1. Envie o conteúdo desta pasta para a branch `main` de um repositório no GitHub.
2. No repositório, abra **Settings → Pages** e, em **Build and deployment → Source**, selecione **GitHub Actions**.
3. O workflow `.github/workflows/deploy-pages.yml` executa `npm test` e publica os arquivos da raiz automaticamente a cada push na branch `main`. Também pode ser iniciado manualmente pela aba **Actions**.
4. Quando a publicação terminar, o endereço do site aparece no job `deploy` e em **Settings → Pages**.

**Importante:** envie os arquivos que estão dentro desta pasta diretamente para a raiz do repositório (incluindo `index.html`, `js/`, `css/`, `assets/`, `personagens/`, `player/` e `.github/`). Não deixe tudo dentro de uma segunda pasta, pois o GitHub Pages precisa encontrar `index.html` na raiz publicada.

Se a branch principal do repositório tiver outro nome, ajuste `branches: [main]` no workflow. Para testar localmente, execute `python3 -m http.server 8000` na pasta do projeto e abra `http://localhost:8000`.

## Conteúdo histórico e referências

O jogo usa personagens fictícios compostos (não são depoimentos históricos reais). Os textos são resumos didáticos:

- Encyclopaedia Britannica, [French Revolution (1787–1799)](https://www.britannica.com/event/French-Revolution).
- PBS American Experience, [The French Revolution](https://www.pbs.org/wgbh/americanexperience/features/adams-french-revolution/).
- United States Holocaust Memorial Museum, [The Russian Revolution: 1917](https://encyclopedia.ushmm.org/content/en/article/the-russian-revolution-1917).
- Encyclopaedia Britannica, [Russian Revolution](https://www.britannica.com/event/Russian-Revolution).

**Nota de calendário:** a Rússia usava o calendário juliano em 1917. Por isso, a Revolução de Fevereiro corresponde a março no calendário gregoriano e a Revolução de Outubro corresponde a novembro. O Estado soviético surgiu após a tomada do poder de 1917; a URSS foi formalmente criada em dezembro de 1922.
