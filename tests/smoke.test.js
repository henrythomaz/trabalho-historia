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
const { npcPlacementsForScene } = await import('../js/render/renderer.js');
const { distributeCharactersAcrossTopics } = await import('../js/systems/character-distribution.js');

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

test('a distribuição usa blocos contínuos e entrega os tópicos extras aos primeiros personagens', () => {
  const topics = Array.from({ length: 10 }, (_, index) => ({ id: `topico-${index + 1}` }));
  const characters = Array.from({ length: 4 }, (_, index) => ({ id: `personagem-${index + 1}` }));
  const assignments = distributeCharactersAcrossTopics(topics, characters);
  const counts = characters.map(character => assignments.filter(item => item.character === character).length);

  assert.deepEqual(counts, [3, 3, 2, 2]);
  assert.deepEqual(assignments.map(item => item.character.id), [
    'personagem-1', 'personagem-1', 'personagem-1',
    'personagem-2', 'personagem-2', 'personagem-2',
    'personagem-3', 'personagem-3',
    'personagem-4', 'personagem-4'
  ]);
  assert.deepEqual(assignments.filter(item => item.isAnchorTopic).map(item => item.topic.id), [
    'topico-1', 'topico-4', 'topico-7', 'topico-9'
  ]);
});

test('cada tópico mantém o NPC de seu bloco nas duas fases atuais', () => {
  const manager = new NpcManager();
  for (const phase of ['france', 'russia']) {
    const scene = SCENES[phase];
    const assignments = distributeCharactersAcrossTopics(scene.poi, manager.characters[phase]);
    const counts = manager.characters[phase].map(character =>
      assignments.filter(item => item.character.id === character.id).length
    );

    assert.equal(assignments.length, scene.poi.length);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
    for (const assignment of assignments) {
      assert.equal(
        manager.getCharacterForTopic(phase, assignment.topic, scene.poi).id,
        assignment.character.id,
        `${phase}/${assignment.topic.id} precisa manter seu personagem`
      );
    }
  }
});

test('NPCs aparecem apenas ao lado do primeiro tópico de cada bloco', () => {
  const manager = new NpcManager();
  for (const phase of ['france', 'russia']) {
    const scene = SCENES[phase];
    const placements = npcPlacementsForScene(scene, manager.characters[phase]);
    const expectedAnchors = distributeCharactersAcrossTopics(scene.poi, manager.characters[phase])
      .filter(item => item.isAnchorTopic);

    assert.equal(placements.length, expectedAnchors.length);
    assert.deepEqual(placements.map(item => item.topic.id), expectedAnchors.map(item => item.topic.id));
    for (const placement of placements) {
      assert.ok(Math.hypot(placement.position.x - placement.topic.x, placement.position.y - placement.topic.y) <= 160);
      for (const obstacle of scene.obstacles) {
        const dx = Math.max(obstacle.x - placement.position.x, 0, placement.position.x - (obstacle.x + obstacle.w));
        const dy = Math.max(obstacle.y - placement.position.y, 0, placement.position.y - (obstacle.y + obstacle.h));
        assert.ok(Math.hypot(dx, dy) >= 24, `${phase}/${placement.person.id} não deve ficar dentro de prédio`);
      }
    }
  }
});

test('a personagem 7 está cadastrada e possui os três retratos de diálogo', async () => {
  const { CHARACTERS } = await import('../js/data/characters.js');
  const { access } = await import('node:fs/promises');
  const yasmin = CHARACTERS.russia.find(character => character.id === 'personagem7');
  assert.ok(yasmin, 'personagem7 precisa estar na lista da Rússia');
  assert.equal(yasmin.folder, 'personagem7');
  for (let pose = 1; pose <= 3; pose += 1) {
    await access(new URL(`../personagens/personagem7/dialogo/pose${pose}.png`, import.meta.url));
  }
  await access(new URL('../personagens/personagem7/cenario/pose1.png', import.meta.url));
  await access(new URL('../personagens/personagem7/cenario/pose2.png', import.meta.url));
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

test('personagem sem pose 3 de cenário reaproveita a pose 2 sem quebrar o mapa', () => {
  const manager = new NpcManager();
  const yasmin = manager.characters.russia.find(character => character.id === 'personagem7');
  const [standingPose, approachingPose, missingSpeakingPose] = yasmin.scenePoses;
  standingPose.complete = true; standingPose.naturalWidth = 1230;
  approachingPose.complete = true; approachingPose.naturalWidth = 1230;
  missingSpeakingPose.complete = true; missingSpeakingPose.naturalWidth = 0;
  assert.equal(manager.getPose(yasmin, 2, 'cenario'), approachingPose);
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
  dialogue.open('france', poi, SCENES.france.poi);
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
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
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
