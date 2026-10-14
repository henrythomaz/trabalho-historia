# Pão, Terra e Poder

Jogo 3D educacional sobre a **Revolução Francesa (1789)** e a **Revolução Russa (1917)**, feito para apresentações escolares. O jogador explora duas cidades low-poly construídas em Three.js, toca em locais destacados e toma quatro decisões com consequências simuladas e explicações históricas reais.

- Sem instalação, sem cadastro, sem login — basta abrir o link.
- Funciona em celulares (Android/iPhone), tablets e computadores.
- Sem backend, sem banco de dados, sem recursos externos: tudo é gerado proceduralmente no navegador.
- Se o dispositivo não suportar WebGL, uma versão simplificada em cartões apresenta os mesmos eventos e decisões.

## Executar localmente

Requisitos: Node.js 20 (LTS).

```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # gera a pasta dist/
npm run preview  # serve o build de produção localmente
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie este código para a branch `main`:
   ```bash
   git init
   git add .
   git commit -m "Pão, Terra e Poder — jogo 3D educacional"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   git push -u origin main
   ```
2. No GitHub, abra **Settings → Pages** do repositório.
3. Em **Build and deployment → Source**, selecione **GitHub Actions** (não selecione "Deploy from a branch").
4. O workflow `.github/workflows/deploy.yml` publica automaticamente a pasta `dist/` a cada push na `main`.
5. Ao final do workflow, o jogo ficará disponível em:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

O projeto usa `base: './'` no `vite.config.js`, então todos os caminhos do build são relativos e funcionam em subdiretórios, sem variáveis secretas ou configuração adicional.

## Estrutura do projeto

```
index.html                  Entrada e estrutura das telas
vite.config.js              Build estático com base relativa
public/favicon.svg          Ícone
src/main.js                 Orquestração da partida e fallback
src/style.css               Identidade visual e responsividade
src/game/events.js          Os 4 eventos: textos, alternativas e efeitos
src/game/state.js           Estado da partida e indicadores (0–100)
src/game/ui.js              Telas, painéis e tela final
src/game/scene.js           Renderer, câmera ortográfica e raycaster
src/game/levels.js          Cenários da França (1789) e da Rússia (1917)
src/game/buildings.js       Construções e elementos low-poly reutilizáveis
.github/workflows/deploy.yml Publicação automática no GitHub Pages
```

## Notas de responsabilidade histórica

- Os efeitos numéricos são **simulações didáticas**, não estatísticas históricas — o jogo deixa isso explícito na interface.
- As explicações distinguem o que ocorreu na História do que é resultado da simulação.
- A tela final inclui fontes verificáveis: Encyclopaedia Britannica, OpenStax e a Declaração dos Direitos do Homem e do Cidadão (Wikisource).
- As datas russas de 1917 seguem a convenção didática (Fevereiro e Outubro, calendário juliano então em vigor na Rússia).
