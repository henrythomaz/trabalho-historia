// ============================================================
// main.js — orquestra a partida: máquina de estados simples
// ligando cena 3D, dados dos eventos, estado e interface.
// Inclui modo alternativo (fallback) para dispositivos sem WebGL.
// ============================================================

import './style.css';
import { EVENTS, PHASES } from './game/events.js';
import {
  createGameState,
  nextPendingEvent,
  applyEffects,
  registerDecision
} from './game/state.js';
import { createUI } from './game/ui.js';

const ui = createUI();
let state = createGameState();
let scene = null;

// ---------- Inicialização da cena 3D com fallback ----------
async function initScene() {
  try {
    const { SceneManager } = await import('./game/scene.js');
    const container = document.getElementById('scene-container');
    scene = new SceneManager(container);
    scene.onHotspotTap = handleHotspotTap;
    scene.setLevel('france');
    return true;
  } catch (err) {
    console.error('[jogo] falha ao iniciar WebGL:', err);
    return false;
  }
}

// ---------- Fluxo principal da partida ----------
function startGame() {
  state = createGameState();
  state.screen = 'intro';
  ui.showHUD('france');
  ui.updateIndicators(state.indicators);
  ui.setProgress(state);
  ui.showPhaseIntro('france', () => enterExplore());
}

function enterExplore() {
  const event = nextPendingEvent(state);
  if (!event) return showFinal();
  state.screen = 'explore';
  state.currentEventIndex = EVENTS.indexOf(event);
  ui.setProgress(state);
  ui.showHint(`Toque no marcador dourado: <strong>${event.hotspotLabel}</strong>`);
  // alternativa acessível: a própria dica abre o evento atual
  ui.els.hotspotHint.onclick = () => handleHotspotTap(event.id);
  scene?.setActiveHotspot(event.id);
}

function handleHotspotTap(eventId) {
  if (state.busy || state.screen !== 'explore') return;
  const event = nextPendingEvent(state);
  if (!event) return;
  if (eventId !== event.id) {
    ui.toast('Esse local já foi investigado. Procure o marcador dourado ativo.');
    return;
  }
  state.screen = 'event';
  ui.hideHint();
  scene?.focusHotspot(eventId);
  setTimeout(() => {
    ui.showEvent(event, (option) => resolveChoice(event, option));
  }, 450);
}

function resolveChoice(event, option) {
  if (state.busy) return;
  state.busy = true;
  ui.hideEvent();
  registerDecision(state, event, option);
  applyEffects(state, option.effects);
  state.screen = 'result';
  ui.showResult(event, option, option.effects, state.indicators, () => {
    state.busy = false;
    advanceAfterResult(event);
  });
}

function advanceAfterResult(event) {
  const next = nextPendingEvent(state);
  if (!next) {
    showFinal();
    return;
  }
  if (next.phase !== event.phase) {
    // transição França → Rússia
    state.screen = 'transition';
    ui.showTransition(() => {
      state.phase = 'russia';
      scene?.setLevel('russia');
      ui.showHUD('russia');
      ui.setProgress(state);
      state.screen = 'intro';
      ui.showPhaseIntro('russia', () => enterExplore());
    });
  } else {
    scene?.resetCameraFocus();
    enterExplore();
  }
}

function showFinal() {
  state.screen = 'final';
  ui.hideHint();
  ui.showFinal(state, {
    onRestart: () => {
      ui.hideFinal();
      state = createGameState();
      scene?.setLevel('france');
      scene?.resetCameraFocus();
      startGame();
    }
  });
}

// ---------- Modo alternativo (sem WebGL): cartões históricos ----------
function startFallback() {
  ui.showFallback();
  const root = document.getElementById('fallback-content');
  let fbState = createGameState();

  const renderStep = () => {
    const event = nextPendingEvent(fbState);
    root.innerHTML = '';
    if (!event) {
      // tela final simplificada
      const done = document.createElement('div');
      done.className = 'fallback-card';
      done.innerHTML = `<h2 class="panel-title">DUAS REVOLUÇÕES. CAMINHOS DIFERENTES.</h2>`;
      for (const d of fbState.decisions) {
        const item = document.createElement('p');
        item.className = 'panel-text';
        item.textContent = `${d.eventTitle} — você escolheu: ${d.letter} · ${d.title}`;
        done.appendChild(item);
      }
      const btn = document.createElement('button');
      btn.className = 'btn btn--primary';
      btn.type = 'button';
      btn.textContent = 'JOGAR NOVAMENTE';
      btn.addEventListener('click', () => { fbState = createGameState(); renderStep(); });
      done.appendChild(btn);
      root.appendChild(done);
      return;
    }
    const card = document.createElement('div');
    card.className = 'fallback-card';
    card.innerHTML = `
      <p class="panel-kicker">${event.kicker}</p>
      <h2 class="panel-title">${event.title}</h2>
      <p class="panel-text">${event.context}</p>
      <p class="panel-question">${event.question}</p>`;
    const list = document.createElement('div');
    list.className = 'options';
    event.options.forEach((opt) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option';
      b.innerHTML = `<span class="option-letter">${opt.letter}</span><span class="option-title">${opt.title}</span>`;
      b.addEventListener('click', () => {
        registerDecision(fbState, event, opt);
        applyEffects(fbState, opt.effects);
        list.innerHTML = '';
        const res = document.createElement('div');
        res.innerHTML = `
          <div class="result-block result-block--sim" style="margin-top:14px">
            <h3 class="result-heading">NA SUA SIMULAÇÃO</h3>
            <p class="panel-text">${opt.result}</p>
          </div>
          <div class="result-block result-block--history">
            <h3 class="result-heading">O QUE ACONTECEU NA HISTÓRIA</h3>
            <p class="panel-text">${opt.history}</p>
          </div>`;
        const next = document.createElement('button');
        next.className = 'btn btn--primary';
        next.type = 'button';
        next.textContent = 'CONTINUAR';
        next.addEventListener('click', renderStep);
        res.appendChild(next);
        card.appendChild(res);
      }, { once: true });
      list.appendChild(b);
    });
    card.appendChild(list);
    root.appendChild(card);
  };
  renderStep();
}

// ---------- Boot ----------
(async function boot() {
  const ok = await initScene();
  if (ok) {
    ui.showTitle(() => startGame());
  } else {
    startFallback();
  }
})();
