/**
 * Duas trilhas instrumentais originais, sintetizadas pelo Web Audio.
 * Não dependem de API, arquivos remotos, chave ou servidor: funcionam em
 * qualquer hospedagem estática. O navegador libera o áudio após o primeiro clique.
 */
const MIDI = (note) => 440 * (2 ** ((note - 69) / 12));

export const MUSIC_THEMES = Object.freeze({
  france: Object.freeze({
    stepMs: 720,
    melody: [64, 67, 72, 67, 69, 72, 76, 72, 65, 69, 72, 69, 67, 71, 74, 71],
    chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]
  }),
  russia: Object.freeze({
    stepMs: 790,
    melody: [62, 65, 69, 65, 60, 62, 65, 69, 62, 65, 69, 72, 60, 64, 67, 64],
    chords: [[50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55]]
  })
});

export class AudioSystem {
  constructor(button) {
    this.button = button;
    this.enabled = true;
    this.context = null;
    this.master = null;
    this.phase = 'france';
    this.musicPlaying = false;
    this.step = 0;
    this.stepTimer = null;
    this.button.addEventListener('click', () => this.toggle());
    this._updateButton();
  }

  _ensureContext() {
    if (this.context) return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? 0.72 : 0;
    this.master.connect(this.context.destination);
    return true;
  }

  start() {
    if (!this.enabled || !this._ensureContext()) return;
    this.context.resume?.();
    this.master.gain.setTargetAtTime(0.72, this.context.currentTime, 0.35);
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    this._scheduleMusicStep();
  }

  _scheduleMusicStep() {
    if (!this.musicPlaying || !this.enabled || !this.context) return;
    const theme = MUSIC_THEMES[this.phase] || MUSIC_THEMES.france;
    const now = this.context.currentTime + 0.035;
    const step = this.step % theme.melody.length;

    if (step % 4 === 0) {
      const chord = theme.chords[Math.floor(step / 4) % theme.chords.length];
      this._playPad(chord, now, 2.95);
    }
    this._playPluck(theme.melody[step], now, 0.52);

    this.step += 1;
    this.stepTimer = window.setTimeout(() => this._scheduleMusicStep(), theme.stepMs);
  }

  _playPluck(midiNote, start, duration) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(MIDI(midiNote), start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.035, start + 0.055);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  _playPad(chord, start, duration) {
    for (const midiNote of chord) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(MIDI(midiNote), start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(0.012, start + 0.55);
      envelope.gain.setValueAtTime(0.012, start + duration - 0.65);
      envelope.gain.linearRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.04);
    }
  }

  setPhase(phase, resume = this.musicPlaying) {
    this.phase = MUSIC_THEMES[phase] ? phase : 'france';
    this.stopMusic();
    if (this.enabled && resume) this.start();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.stepTimer !== null) window.clearTimeout(this.stepTimer);
    this.stepTimer = null;
  }

  // Mantém o nome usado pela versão anterior do jogo.
  stopAmbience() {
    this.stopMusic();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this._ensureContext()) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.72 : 0, this.context.currentTime, 0.12);
    }
    if (this.enabled) this.start();
    else this.stopMusic();
    this._updateButton();
  }

  blip(frequency = 440, duration = 0.09) {
    if (!this.enabled || !this._ensureContext()) return;
    this.context.resume?.();
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, this.context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.045, this.context.currentTime + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration + 0.02);
  }

  _updateButton() {
    this.button.textContent = this.enabled ? '♫' : '♪';
    this.button.classList.toggle('muted', !this.enabled);
    this.button.setAttribute('aria-label', this.enabled ? 'Silenciar música' : 'Ativar música');
    this.button.title = this.enabled ? 'Música ligada' : 'Música desligada';
  }
}
