import { SCENES } from './data/scenes.js';
import { Controls } from './systems/controls.js';
import { moveWithCollisions, nearestPoi } from './systems/collision.js';
import { NpcManager } from './systems/npc-manager.js';
import { DialogueSystem } from './systems/dialogue.js';
import { AudioSystem } from './systems/audio.js';
import { Renderer } from './render/renderer.js';
import { PlayerSpriteManager } from './systems/player-sprites.js';
import { ConfettiEffect } from './systems/confetti.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const ui = {
  start: $('start-screen'), startButton: $('start-button'),
  dialogue: $('dialogue-layer'), dialoguePanel: $('dialogue-layer').querySelector('.dialogue-panel'),
  portrait: $('speaker-portrait'), image: $('portrait-image'), fallback: $('portrait-fallback'), topicImage: $('topic-image'),
  topicImageButton: $('topic-image-button'), topicImageModal: $('topic-image-modal'),
  topicImageExpanded: $('topic-image-expanded'), topicImageClose: $('topic-image-close'),
  name: $('speaker-name'), role: $('speaker-role'), step: $('dialogue-step'), text: $('dialogue-text'),
  next: $('next-dialogue'), tap: $('dialogue-tap'),
  transition: $('transition-screen'), transitionButton: $('transition-button'),
  ending: $('ending-screen'), restart: $('restart-button'),
  era: $('era-label'), progress: $('progress-label'), progressFill: $('progress-fill'),
  footer: $('footer-location'), toast: $('toast'), nearby: $('nearby-prompt'), nearbyTitle: $('nearby-title'),
  interact: $('interact-button'), endingFound: $('ending-found')
};

const controls = new Controls(canvas);
const renderer = new Renderer(canvas, $('poi-label-layer'));
const npcManager = new NpcManager();
const playerSprites = new PlayerSpriteManager();
const audio = new AudioSystem($('sound-toggle'));
const confetti = new ConfettiEffect(document.querySelector('.game-frame'));
let phase = 'france';
let scene = SCENES[phase];
let player = { x: scene.spawn.x, y: scene.spawn.y, radius: 14, speed: 205, facing: 'down', moving: false, animationTime: 0 };
let completed = new Set();
let targetPoi = null;
let currentPoi = null;
let mode = 'start';
let lastTime = 0;
let toastTimer = 0;

const dialogue = new DialogueSystem({
  layer: ui.dialogue, panel: ui.dialoguePanel, image: ui.image, fallback: ui.fallback,
  topicImage: ui.topicImage, topicImageButton: ui.topicImageButton,
  name: ui.name, role: ui.role, step: ui.step, text: ui.text, next: ui.next, tap: ui.tap
}, npcManager, onDialogueEnd);

function closeTopicImage() {
  ui.topicImageModal.hidden = true;
  ui.topicImageExpanded.removeAttribute('src');
}

function openTopicImage(event) {
  // A imagem fica dentro do painel de diálogo; não deixe o clique avançar a fala.
  event?.stopPropagation();
  if (ui.topicImageButton.hidden || !ui.topicImage.src) return;
  ui.topicImageExpanded.src = ui.topicImage.src;
  ui.topicImageModal.hidden = false;
  ui.topicImageClose.focus();
}

function onDialogueEnd() {
  closeTopicImage();
  if (currentPoi) {
    completed.add(currentPoi.id);
    audio.blip(620, .13);
    updateProgress();
    targetPoi = null;
    if (completed.size === scene.poi.length) {
      ui.nearby.hidden = true;
      mode = 'transition';
      window.setTimeout(() => showPhaseCompletion(), 420);
    }
  }
  currentPoi = null;
}

function showPhaseCompletion() {
  if (phase === 'france') {
    $('transition-kicker').textContent = 'PRIMEIRA JORNADA CONCLUÍDA';
    $('transition-year').textContent = '1917';
    $('transition-title').textContent = 'Agora, a Rússia.';
    $('transition-copy').textContent = 'Do fim do século XVIII ao início do século XX: uma nova crise, uma guerra mundial e outra revolução.';
    ui.transitionButton.innerHTML = 'AVANÇAR NO TEMPO <span>→</span>';
    $('transition-button').dataset.action = 'russia';
    ui.transition.hidden = false;
  } else {
    mode = 'ending';
    ui.endingFound.textContent = String(Object.values(SCENES).reduce((sum, s) => sum + s.poi.length, 0));
    ui.ending.hidden = false;
    confetti.celebrate();
  }
}

function updateProgress() {
  ui.progress.textContent = `${completed.size} / ${scene.poi.length}`;
  ui.progressFill.style.width = `${(completed.size / scene.poi.length) * 100}%`;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 1900);
}

function openPoi(poi) {
  if (mode !== 'playing' || completed.has(poi.id) || dialogue.active) return;
  currentPoi = poi;
  targetPoi = null;
  ui.nearby.hidden = true;
  audio.blip(510, .08);
  dialogue.open(phase, poi, scene.poi);
}

function startGame() {
  ui.start.hidden = true;
  mode = 'playing';
  audio.start();
  updateHud();
  showToast('Explore a rua e procure os marcos históricos.');
}

function updateHud() {
  ui.era.textContent = scene.label;
  ui.footer.textContent = scene.footer;
  updateProgress();
}

function switchToRussia() {
  ui.transition.hidden = true;
  phase = 'russia';
  scene = SCENES[phase];
  player.x = scene.spawn.x; player.y = scene.spawn.y;
  completed = new Set(); targetPoi = null;
  npcManager.reset(phase);
  audio.setPhase(phase);
  mode = 'playing';
  updateHud();
  showToast('Petrogrado, 1917. Encontre os sete marcos.');
}

function restartGame() {
  ui.ending.hidden = true;
  ui.transition.hidden = true;
  closeTopicImage();
  ui.dialogue.hidden = true;
  ui.start.hidden = false;
  phase = 'france'; scene = SCENES[phase];
  player.x = scene.spawn.x; player.y = scene.spawn.y;
  completed = new Set(); targetPoi = null; currentPoi = null;
  npcManager.reset('france'); npcManager.reset('russia');
  audio.setPhase('france', false);
  mode = 'start'; updateHud();
}

function handleCanvasTap(event) {
  if (mode !== 'playing' || dialogue.active) return;
  const rect = canvas.getBoundingClientRect();
  const sx = event.clientX - rect.left, sy = event.clientY - rect.top;
  // Reutiliza exatamente a câmera arredondada usada pelo renderizador e pelos títulos nítidos.
  const cameraX = renderer.cameraX;
  const cameraY = renderer.cameraY;
  const wx = sx + cameraX, wy = sy + cameraY;
  let tapped = null, best = 78;
  for (const poi of scene.poi) {
    const d = Math.hypot(wx - poi.x, wy - poi.y);
    if (d < best) { tapped = poi; best = d; }
  }
  if (!tapped) return;
  if (completed.has(tapped.id)) { showToast('Este marco já foi explorado.'); return; }
  const distance = Math.hypot(player.x - tapped.x, player.y - tapped.y);
  if (distance <= 102) openPoi(tapped);
  else {
    targetPoi = tapped;
    showToast(`Aproximando-se: ${tapped.title}`);
  }
}

canvas.addEventListener('pointerup', handleCanvasTap);
ui.topicImageButton.addEventListener('click', openTopicImage);
ui.topicImageClose.addEventListener('click', closeTopicImage);
ui.topicImageModal.addEventListener('click', (event) => {
  if (event.target === ui.topicImageModal || event.target.classList.contains('topic-image-modal-backdrop')) closeTopicImage();
});
ui.interact.addEventListener('click', () => {
  const poi = nearestPoi(player, scene, 115, completed);
  if (poi) openPoi(poi);
});
ui.startButton.addEventListener('click', startGame);
ui.transitionButton.addEventListener('click', () => {
  if ($('transition-button').dataset.action === 'russia') switchToRussia();
});
ui.restart.addEventListener('click', restartGame);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !ui.topicImageModal.hidden) { closeTopicImage(); return; }
  if ((event.key === 'e' || event.key === 'Enter') && mode === 'playing' && !dialogue.active) {
    const poi = nearestPoi(player, scene, 115, completed);
    if (poi) openPoi(poi);
  }
});

function updatePlayerFacing(dx, dy, delta) {
  if (Math.hypot(dx, dy) <= .001) return;
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx < 0 ? 'left' : 'right';
  else player.facing = dy < 0 ? 'up' : 'down';
  player.moving = true;
  player.animationTime += delta;
}

function update(delta) {
  player.moving = false;
  if (mode !== 'playing' || dialogue.active) return;
  const input = controls.getVector();
  if (Math.hypot(input.x, input.y) > .05) {
    targetPoi = null;
    const moveX = input.x * player.speed * delta;
    const moveY = input.y * player.speed * delta;
    updatePlayerFacing(moveX, moveY, delta);
    moveWithCollisions(player, moveX, moveY, scene);
  } else if (targetPoi && !completed.has(targetPoi.id)) {
    const dx = targetPoi.x - player.x, dy = targetPoi.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 82) openPoi(targetPoi);
    else {
      const moveX = (dx / dist) * player.speed * .78 * delta;
      const moveY = (dy / dist) * player.speed * .78 * delta;
      updatePlayerFacing(moveX, moveY, delta);
      moveWithCollisions(player, moveX, moveY, scene);
    }
  }

  const nearby = nearestPoi(player, scene, 102, completed);
  if (nearby) {
    ui.nearby.hidden = false;
    ui.nearbyTitle.textContent = nearby.title;
  } else if (!targetPoi) ui.nearby.hidden = true;
  if (targetPoi && Math.hypot(player.x - targetPoi.x, player.y - targetPoi.y) <= 86) openPoi(targetPoi);
}

function frame(timestamp) {
  const delta = Math.min(.05, (timestamp - (lastTime || timestamp)) / 1000);
  lastTime = timestamp;
  update(delta);
  const nearby = mode === 'playing' ? nearestPoi(player, scene, 102, completed) : null;
  renderer.render({ scene, player, npcManager, playerSprites, phase, completed, nearby, delta });
  requestAnimationFrame(frame);
}

updateHud();
requestAnimationFrame(frame);
