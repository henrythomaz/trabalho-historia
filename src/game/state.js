// ============================================================
// state.js — estado da partida: indicadores, decisões, progresso.
// ============================================================

import { INITIAL_INDICATORS, EVENTS } from './events.js';

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function createGameState() {
  return {
    // telas: title | intro | explore | event | result | transition | final
    screen: 'title',
    phase: 'france',
    currentEventIndex: -1,
    indicators: { ...INITIAL_INDICATORS },
    decisions: [], // { eventId, eventTitle, letter, title }
    completedEvents: new Set(),
    busy: false // trava cliques durante transições
  };
}

export function nextPendingEvent(state) {
  return EVENTS.find((e) => !state.completedEvents.has(e.id)) || null;
}

export function eventsOfPhase(phase) {
  return EVENTS.filter((e) => e.phase === phase);
}

export function applyEffects(state, effects) {
  const before = { ...state.indicators };
  for (const [key, delta] of Object.entries(effects)) {
    if (key in state.indicators) {
      state.indicators[key] = clamp(state.indicators[key] + delta);
    }
  }
  return { before, after: { ...state.indicators } };
}

export function registerDecision(state, event, option) {
  state.decisions.push({
    eventId: event.id,
    eventTitle: event.title,
    phase: event.phase,
    letter: option.letter,
    title: option.title
  });
  state.completedEvents.add(event.id);
}

export function progressLabel(state) {
  const done = state.completedEvents.size;
  return `DECISÃO ${Math.min(done + 1, 4)} DE 4`;
}
