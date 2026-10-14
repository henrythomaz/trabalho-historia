// ============================================================
// ui.js — telas, painéis, indicadores, resultado e tela final.
// Toda a manipulação de DOM fica aqui.
// ============================================================

import { INDICATORS, PHASES, FINAL, closingText } from './events.js';
import { progressLabel } from './state.js';

const $ = (id) => document.getElementById(id);

const els = {
  title: $('screen-title'),
  hud: $('hud'),
  hudPhase: $('hud-phase-name'),
  hudProgress: $('hud-progress'),
  indicators: $('indicators'),
  phaseIntro: $('phase-intro'),
  phaseIntroTitle: $('phase-intro-title'),
  phaseIntroText: $('phase-intro-text'),
  btnPhaseStart: $('btn-phase-start'),
  hotspotHint: $('hotspot-hint'),
  eventPanel: $('event-panel'),
  eventKicker: $('event-kicker'),
  eventTitle: $('event-title'),
  eventContext: $('event-context'),
  eventQuestion: $('event-question'),
  eventOptions: $('event-options'),
  resultPanel: $('result-panel'),
  resultTitle: $('result-title'),
  resultEffects: $('result-effects'),
  resultSummary: $('result-summary'),
  resultHistory: $('result-history'),
  btnContinue: $('btn-continue'),
  transition: $('transition'),
  screenFinal: $('screen-final'),
  finalContent: $('final-content'),
  screenFallback: $('screen-fallback'),
  fallbackContent: $('fallback-content'),
  toast: $('toast')
};

function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

export function createUI() {
  // monta as barras de indicadores uma única vez
  const indicatorEls = {};
  for (const ind of INDICATORS) {
    const wrap = document.createElement('div');
    wrap.className = 'indicator';
    wrap.innerHTML = `
      <div class="indicator-label"><span>${ind.label}</span><span class="indicator-value">50</span></div>
      <div class="indicator-bar"><div class="indicator-fill"></div></div>`;
    els.indicators.appendChild(wrap);
    indicatorEls[ind.id] = {
      value: wrap.querySelector('.indicator-value'),
      fill: wrap.querySelector('.indicator-fill')
    };
  }

  return {
    els,

    // ---------- tela inicial ----------
    showTitle(onStart) {
      show(els.title);
      hide(els.hud);
      $('btn-start').onclick = () => {
        hide(els.title);
        onStart();
      };
    },

    // ---------- HUD ----------
    showHUD(phaseId) {
      show(els.hud);
      els.hudPhase.textContent = PHASES[phaseId].name;
    },
    setProgress(state) {
      els.hudProgress.textContent = progressLabel(state);
    },
    updateIndicators(indicators) {
      for (const ind of INDICATORS) {
        const v = indicators[ind.id];
        const el = indicatorEls[ind.id];
        el.value.textContent = v;
        el.fill.style.width = `${v}%`;
        // cor sem ser o único canal: número sempre visível
        el.fill.style.background =
          ind.id === 'pressao'
            ? v > 65 ? 'var(--bad)' : 'var(--gold)'
            : v < 35 ? 'var(--bad)' : 'var(--gold)';
      }
    },

    // ---------- introdução da fase ----------
    showPhaseIntro(phaseId, onBegin) {
      const phase = PHASES[phaseId];
      els.phaseIntroTitle.textContent = phase.name;
      els.phaseIntroText.textContent = phase.intro;
      els.btnPhaseStart.textContent = phase.button;
      show(els.phaseIntro);
      els.btnPhaseStart.onclick = () => {
        hide(els.phaseIntro);
        onBegin();
      };
    },

    // ---------- dica de hotspot ----------
    showHint(html) {
      els.hotspotHint.innerHTML = html;
      show(els.hotspotHint);
    },
    hideHint() { hide(els.hotspotHint); },

    // ---------- painel de evento ----------
    showEvent(event, onPick) {
      els.eventKicker.textContent = event.kicker;
      els.eventTitle.textContent = event.title;
      els.eventContext.textContent = event.context;
      els.eventQuestion.textContent = event.question;
      els.eventOptions.innerHTML = '';
      event.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option';
        btn.innerHTML = `
          <span class="option-letter">${opt.letter}</span>
          <span class="option-title">${opt.title}</span>
          <span class="option-desc">${opt.description}</span>`;
        btn.addEventListener('click', () => onPick(opt), { once: true });
        els.eventOptions.appendChild(btn);
      });
      show(els.eventPanel);
    },
    hideEvent() { hide(els.eventPanel); },

    // ---------- resultado ----------
    showResult(event, option, effects, indicators, onContinue) {
      els.resultTitle.textContent = option.title;
      els.resultEffects.innerHTML = '';
      const labels = Object.fromEntries(INDICATORS.map((i) => [i.id, i.label]));
      const entries = Object.entries(effects);
      if (entries.length === 0) {
        els.resultEffects.innerHTML = '<span class="effect-chip effect-chip--neutral">Sem mudanças nos indicadores</span>';
      }
      for (const [key, delta] of entries) {
        const chip = document.createElement('span');
        const isBad = key === 'pressao' ? delta > 0 : delta < 0;
        chip.className = `effect-chip ${delta === 0 ? 'effect-chip--neutral' : isBad ? 'effect-chip--down' : 'effect-chip--up'}`;
        const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';
        chip.textContent = `${arrow} ${labels[key]} ${delta > 0 ? '+' : ''}${delta}`;
        els.resultEffects.appendChild(chip);
      }
      els.resultSummary.textContent = option.result;
      els.resultHistory.textContent = option.history;
      show(els.resultPanel);
      els.btnContinue.onclick = () => {
        hide(els.resultPanel);
        onContinue();
      };
      this.updateIndicators(indicators);
    },
    hideResult() { hide(els.resultPanel); },

    // ---------- transição ----------
    showTransition(done) {
      show(els.transition);
      const wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1200 : 2600;
      setTimeout(() => {
        hide(els.transition);
        done();
      }, wait);
    },

    // ---------- tela final ----------
    showFinal(state, { onRestart }) {
      const c = els.finalContent;
      c.innerHTML = '';

      // cartão principal
      const main = document.createElement('div');
      main.className = 'final-card';
      main.innerHTML = `
        <h2 class="final-title">${FINAL.title}</h2>
        <p class="final-subtitle">${FINAL.subtitle}</p>
        <h3 class="section-title">${FINAL.pathLabel}</h3>`;
      for (const d of state.decisions) {
        const item = document.createElement('div');
        item.className = 'choice-item';
        item.innerHTML = `
          <p class="choice-event">${d.eventTitle}</p>
          <p class="choice-pick">${d.letter} · ${d.title}</p>`;
        main.appendChild(item);
      }
      const closing = document.createElement('p');
      closing.className = 'panel-text';
      closing.style.marginTop = '12px';
      closing.textContent = closingText(state.indicators);
      main.appendChild(closing);
      c.appendChild(main);

      // quadro comparativo
      const cmp = document.createElement('div');
      cmp.className = 'final-card';
      cmp.innerHTML = `<h3 class="section-title">As duas revoluções lado a lado</h3><div class="compare-grid"></div>`;
      const grid = cmp.querySelector('.compare-grid');
      for (const [data, cls] of [[FINAL.france, 'compare-card--fr'], [FINAL.russia, 'compare-card--ru']]) {
        const card = document.createElement('div');
        card.className = `compare-card ${cls}`;
        card.innerHTML = `<h4>${data.title}</h4><ul>${data.points
          .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
          .join('')}</ul>`;
        grid.appendChild(card);
      }
      c.appendChild(cmp);

      // comparação direta em cinco dimensões
      const dims = document.createElement('div');
      dims.className = 'final-card';
      dims.innerHTML = `<h3 class="section-title">Comparação direta</h3>`;
      for (const dim of FINAL.dimensions) {
        const d = document.createElement('div');
        d.className = 'dimension';
        d.innerHTML = `
          <h5>${dim.title}</h5>
          <p><strong>França:</strong> ${dim.fr}</p>
          <p><strong>Rússia:</strong> ${dim.ru}</p>`;
        dims.appendChild(d);
      }
      c.appendChild(dims);

      // conexões filosóficas
      const phil = document.createElement('div');
      phil.className = 'final-card';
      phil.innerHTML = `<h3 class="section-title">Ideias em disputa</h3><div class="philosopher-grid"></div>`;
      const pg = phil.querySelector('.philosopher-grid');
      for (const p of FINAL.philosophers) {
        const card = document.createElement('div');
        card.className = 'philosopher';
        card.innerHTML = `
          <h5>${p.name}</h5>
          <p class="ph-theme">${p.theme}</p>
          <p>${p.text}</p>
          <p class="ph-question">${p.question}</p>`;
        pg.appendChild(card);
      }
      c.appendChild(phil);

      // pergunta final
      const q = document.createElement('div');
      q.className = 'final-card final-question';
      q.innerHTML = `<blockquote>“${FINAL.question}”</blockquote><p>${FINAL.questionHint}</p>`;
      c.appendChild(q);

      // fontes
      const src = document.createElement('div');
      src.className = 'final-card';
      src.innerHTML = `
        <h3 class="section-title">Fontes históricas</h3>
        <ul class="sources-list">
          ${FINAL.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`).join('')}
        </ul>
        <p class="panel-text" style="margin-top:10px">Datas russas de 1917 seguem aqui a convenção didática (Fevereiro e Outubro, calendário juliano então em vigor na Rússia).</p>`;
      c.appendChild(src);

      // ações
      const actions = document.createElement('div');
      actions.className = 'final-actions';
      const btnAgain = document.createElement('button');
      btnAgain.className = 'btn btn--primary';
      btnAgain.type = 'button';
      btnAgain.textContent = 'JOGAR NOVAMENTE';
      btnAgain.addEventListener('click', onRestart);
      const btnReview = document.createElement('button');
      btnReview.className = 'btn btn--ghost';
      btnReview.type = 'button';
      btnReview.textContent = 'REVER A COMPARAÇÃO';
      btnReview.addEventListener('click', () => {
        cmp.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      actions.append(btnAgain, btnReview);
      c.appendChild(actions);

      show(els.screenFinal);
      hide(els.hud);
    },
    hideFinal() { hide(els.screenFinal); },

    // ---------- fallback sem WebGL ----------
    showFallback() {
      hide(els.title);
      show(els.screenFallback);
    },

    toast(msg) {
      els.toast.textContent = msg;
      show(els.toast);
      setTimeout(() => hide(els.toast), 3500);
    }
  };
}
