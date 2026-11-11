import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES } from '../js/data/scenes.js';
import { overlapsCircleRect, moveWithCollisions, nearestPoi } from '../js/systems/collision.js';

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.src = '';
    this.dataset = {};
    this.onload = null;
    this.onerror = null;
  }
}
globalThis.Image = FakeImage;
const { NpcManager, poseSources } = await import('../js/systems/npc-manager.js');
const { DialogueSystem, dialoguePoseIndexForPage } = await import('../js/systems/dialogue.js');
const { PLAYER_SPRITE_FILES, PlayerSpriteManager, playerSpritePaths } = await import('../js/systems/player-sprites.js');

test('as fases apresentam os acontecimentos em várias páginas curtas de diálogo', () => {
  assert.deepEqual(Object.keys(SCENES).sort(), ['france', 'russia']);
  for (const scene of Object.values(SCENES)) {
    assert.equal(scene.poi.length, scene.id === 'france' ? 10 : 7);
    for (const poi of scene.poi) {
      assert.ok(poi.title && poi.short && poi.id);
      assert.ok(poi.lines.length >= 3 && poi.lines.length <= 4, `${poi.id} precisa de 3 ou 4 páginas`);
      for (const page of poi.lines) {
        const words = page.trim().split(/\s+/).length;
        assert.ok(words >= 10 && words <= 25, `${poi.id} tem uma página com ${words} palavras`);
      }
    }
  }
});

test('colisão círculo-retângulo impede atravessar construção', () => {
  const obstacle = { x: 100, y: 100, w: 100, h: 100 };
  assert.equal(overlapsCircleRect(120, 120, 12, obstacle), true);
  assert.equal(overlapsCircleRect(80, 80, 12, obstacle), false);
  const player = { x: 80, y: 150, radius: 14 };
  const scene = { world: { width: 400, height: 400 }, obstacles: [obstacle] };
  moveWithCollisions(player, 30, 0, scene);
  assert.equal(player.x, 80, 'o personagem não entra no obstáculo');
});

test('movimento permite deslizar junto à parede e respeita limites', () => {
  const player = { x: 80, y: 80, radius: 10 };
  const scene = { world: { width: 200, height: 200 }, obstacles: [{ x: 100, y: 60, w: 30, h: 80 }] };
  moveWithCollisions(player, 30, 20, scene);
  assert.equal(player.x, 80);
  assert.equal(player.y, 100);
  moveWithCollisions(player, -60, 0, scene);
  assert.equal(player.x, 20);
});

test('NPCs são distribuídos em ordem aleatória sem repetir antes de todos participarem', () => {
  const manager = new NpcManager();
  for (const phase of ['france', 'russia']) {
    manager.reset(phase);
    const firstCycle = new Set([manager.pick(phase).id, manager.pick(phase).id, manager.pick(phase).id]);
    assert.equal(firstCycle.size, 3);
    assert.equal(manager.characters[phase].length, 3);
    assert.ok(manager.activeCharacterId, 'o personagem escolhido fica marcado como falante');
    manager.clearActive();
    assert.equal(manager.activeCharacterId, null);
  }
});

test('cada personagem carrega três poses separadas para cenário e diálogo', () => {
  const manager = new NpcManager();
  for (const phase of ['france', 'russia']) {
    for (const character of manager.characters[phase]) {
      assert.equal(character.scenePoses.length, 3);
      assert.equal(character.dialoguePoses.length, 3);
      assert.equal(character.poses, character.scenePoses, 'o alias antigo continua apontando para as poses do mapa');
      character.scenePoses.forEach((pose, index) => {
        assert.ok(pose.src.includes(`personagens/${character.folder}/cenario/pose${index + 1}.png`));
      });
      character.dialoguePoses.forEach((pose, index) => {
        assert.ok(pose.src.includes(`personagens/${character.folder}/dialogo/pose${index + 1}.png`));
      });
    }
  }
  const scenePaths = poseSources('personagem1', 2, 'cenario');
  const dialoguePaths = poseSources('personagem1', 2, 'dialogo');
  assert.ok(scenePaths.includes('personagens/personagem1/cenario/pose 2.png'));
  assert.ok(dialoguePaths.includes('personagens/personagem1/dialogo/pose2/image.png'));
  assert.ok(scenePaths.includes('personagens/personagem1/pose2.png'), 'o formato antigo continua como fallback');
  const fallbackImage = manager.characters.france[0].scenePoses[0];
  fallbackImage.onerror();
  assert.equal(fallbackImage.src, 'personagens/personagem1/cenario/pose 1.png');
});

test('NPC seleciona pose 1 parado, pose 2 perto e pose 3 durante o diálogo', () => {
  const manager = new NpcManager();
  const character = manager.characters.france[0];
  const position = { x: 100, y: 100 };
  assert.equal(manager.getPoseIndex(character, { x: 300, y: 300 }, position), 0);
  assert.equal(manager.getPoseIndex(character, { x: 150, y: 100 }, position), 1);
  manager.activeCharacterId = character.id;
  assert.equal(manager.getPoseIndex(character, { x: 300, y: 300 }, position), 2);
});

test('seleção de pose respeita o conjunto do cenário ou do diálogo', () => {
  const manager = new NpcManager();
  const character = manager.characters.france[0];
  const [scene1, scene2, scene3] = character.scenePoses;
  const [dialogue1, dialogue2, dialogue3] = character.dialoguePoses;
  for (const image of [scene1, scene2, scene3, dialogue1, dialogue2, dialogue3]) {
    image.complete = true;
    image.naturalWidth = 32;
  }
  assert.equal(manager.getPose(character, 1, 'cenario'), scene2);
  assert.equal(manager.getPose(character, 2, 'cenario'), scene3);
  assert.equal(manager.getPose(character, 0, 'dialogo'), dialogue1);
  assert.equal(manager.getPose(character, 1, 'dialogo'), dialogue2);
  assert.equal(manager.getPose(character, 2, 'dialogo'), dialogue3);
  dialogue3.complete = false;
  assert.equal(manager.getPose(character, 2, 'dialogo'), dialogue1);
});

test('as poses do retrato acompanham a página e mantêm a terceira nas páginas seguintes', () => {
  assert.equal(dialoguePoseIndexForPage(0), 0);
  assert.equal(dialoguePoseIndexForPage(1), 1);
  assert.equal(dialoguePoseIndexForPage(2), 2);
  assert.equal(dialoguePoseIndexForPage(3), 2);
  assert.equal(dialoguePoseIndexForPage(10), 2);
});

test('diálogo avança página por página e atualiza o contador 1/N, 2/N...', () => {
  const manager = new NpcManager();
  const makeElement = () => ({
    hidden: true, textContent: '', innerHTML: '', src: '', complete: false,
    naturalWidth: 0, dataset: {}, style: {},
    addEventListener() {},
    removeAttribute(name) { if (name === 'src') this.src = ''; }
  });
  const elements = {
    layer: makeElement(), next: makeElement(), name: makeElement(), role: makeElement(),
    step: makeElement(), text: makeElement(), image: makeElement(), fallback: makeElement(),
    topicImage: makeElement(), topicImageButton: makeElement()
  };
  const dialogue = new DialogueSystem(elements, manager, () => {});
  const poi = SCENES.france.poi[0];
  dialogue.open('france', poi);
  assert.equal(elements.step.textContent, `1 / ${poi.lines.length}`);
  assert.equal(elements.text.textContent, poi.lines[0]);
  dialogue.advance();
  assert.equal(elements.step.textContent, `2 / ${poi.lines.length}`);
  assert.equal(elements.text.textContent, poi.lines[1]);
  while (dialogue.active) dialogue.advance();
  assert.equal(elements.layer.hidden, true);
});

test('ponto mais próximo ignora pontos já concluídos', () => {
  const scene = SCENES.france;
  const player = { x: scene.poi[0].x, y: scene.poi[0].y };
  assert.equal(nearestPoi(player, scene, 100, new Set())?.id, scene.poi[0].id);
  assert.notEqual(nearestPoi(player, scene, 100, new Set([scene.poi[0].id]))?.id, scene.poi[0].id);
});

test('conteúdo cobre os tópicos essenciais pedidos nas duas revoluções', () => {
  const french = SCENES.france.poi.flatMap(p => p.lines).join(' ').toLowerCase();
  const russian = SCENES.russia.poi.flatMap(p => p.lines).join(' ').toLowerCase();
  for (const term of ['três estados', 'estados gerais', 'juramento da péla', 'bastilha', 'grande medo', 'privilégios feudais', 'declaração', 'monarquia', 'república', 'girondinos', 'jacobinos', 'terror', 'robespierre', 'diretório', 'napoleão']) {
    assert.ok(french.includes(term), `conteúdo francês deve mencionar ${term}`);
  }
  for (const term of ['nicolau ii', '1905', 'domingo sangrento', 'primeira guerra mundial', 'abdicou', 'governo provisório', 'sovietes', 'lenin', 'bolcheviques', 'outubro', 'guerra civil', 'urss', '1922']) {
    assert.ok(russian.includes(term), `conteúdo russo deve mencionar ${term}`);
  }
});

test('cada tópico tem um caminho de imagem opcional próprio', () => {
  for (const scene of Object.values(SCENES)) {
    for (const poi of scene.poi) {
      assert.equal(poi.image, `assets/topicos/${scene.id}/${poi.id}.png`);
    }
  }
});

test('prédios não invadem a área de aproximação dos marcos clicáveis', () => {
  for (const scene of Object.values(SCENES)) {
    for (const poi of scene.poi) {
      for (const obstacle of scene.obstacles) {
        const dx = Math.max(obstacle.x - poi.x, 0, poi.x - (obstacle.x + obstacle.w));
        const dy = Math.max(obstacle.y - poi.y, 0, poi.y - (obstacle.y + obstacle.h));
        assert.ok(Math.hypot(dx, dy) >= 80,
          `${scene.id}/${poi.id} está próximo demais de um prédio (${dx}, ${dy})`);
      }
    }
  }
});


test('pasta player aceita sprite único, direções e quadros opcionais de caminhada', () => {
  const paths = playerSpritePaths();
  assert.ok(paths.idle.includes('player/player.png'));
  assert.ok(paths.down.includes('player/front.png'));
  assert.ok(paths.up.includes('player/back.png'));
  assert.ok(paths.walk1.includes('player/walk1.png'));
  assert.ok(paths.walk2.includes('player/walk2.png'));
  assert.ok(PLAYER_SPRITE_FILES.rightWalk1.includes('right-walk1.png'));
});


test('jogador continua com o desenho procedural quando nenhuma imagem foi carregada', () => {
  const sprites = new PlayerSpriteManager();
  assert.equal(sprites.getSprite({ facing: 'down', moving: false }), null);
  assert.equal(sprites.getSprite({ facing: 'left', moving: true, animationTime: 0.2 }), null);
});


test('trilhas calmas são distintas e não exigem API ou chave externa', async () => {
  const { MUSIC_THEMES } = await import('../js/systems/audio.js');
  assert.deepEqual(Object.keys(MUSIC_THEMES).sort(), ['france', 'russia']);
  assert.equal(MUSIC_THEMES.france.melody.length, 16);
  assert.equal(MUSIC_THEMES.russia.melody.length, 16);
  assert.notDeepEqual(MUSIC_THEMES.france.melody, MUSIC_THEMES.russia.melody);
  assert.notDeepEqual(MUSIC_THEMES.france.chords, MUSIC_THEMES.russia.chords);
});

test('site inclui logo atualizado, confete local e publicação estática no GitHub Pages', async () => {
  const { readFile, access } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const main = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');
  assert.match(html, /assets\/outros\/logo-entre-revolucoes\.png/);
  assert.match(html, /assets\/outros\/favicon\.png/);
  assert.match(main, /confetti\.celebrate\(\)/);
  assert.match(main, /systems\/confetti\.js/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  await access(new URL('../assets/outros/logo-entre-revolucoes.png', import.meta.url));
  await access(new URL('../assets/outros/favicon.png', import.meta.url));
  await access(new URL('../.nojekyll', import.meta.url));
});

test('guia local orienta usar HTTP e inclui inicializador para Linux', async () => {
  const { readFile, access } = await import('node:fs/promises');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const launcher = await readFile(new URL('../iniciar-local.sh', import.meta.url), 'utf8');
  assert.match(readme, /\.\/iniciar-local\.sh/);
  assert.match(readme, /Não abra `index\.html` com duplo clique/);
  assert.match(launcher, /python3 -m http\.server/);
});
