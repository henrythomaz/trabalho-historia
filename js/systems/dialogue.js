export const dialoguePoseIndexForPage = (pageIndex) => Math.min(Math.max(0, pageIndex), 2);

export class DialogueSystem {
  constructor(elements, npcManager, onEnd) {
    this.el = elements;
    this.npcManager = npcManager;
    this.onEnd = onEnd;
    this.active = false;
    this.lines = [];
    this.index = 0;
    this.character = null;
    this.currentPoi = null;
    this._bind();
  }

  _bind() {
    const advance = () => this.advance();
    this.el.next.addEventListener('click', advance);
    this.el.layer.addEventListener('click', (event) => {
      // Tocar em qualquer área do jogo avança; o botão Continuar já trata seu próprio clique.
      if (!event.target.closest('.dialogue-next')) advance();
    });
  }

  open(phase, poi) {
    if (this.active) return;
    this.active = true;
    this.currentPoi = poi;
    this._loadTopicImage(poi);
    this.lines = Array.isArray(poi.lines) ? poi.lines.filter(line => typeof line === 'string' && line.trim()) : [String(poi.lines || '')];
    if (!this.lines.length) this.lines = ['Não há texto disponível para este acontecimento.'];
    this.index = 0;
    this.character = this.npcManager.pick(phase);
    this.el.layer.hidden = false;
    this._render();
  }

  _loadTopicImage(poi) {
    const image = this.el.topicImage;
    const button = this.el.topicImageButton;
    if (!image) return;
    if (button) button.hidden = true;
    else image.hidden = true;
    image.onload = () => {
      if (this.active && this.currentPoi === poi && image.naturalWidth > 0) {
        if (button) button.hidden = false;
        else image.hidden = false;
      }
    };
    image.onerror = () => {
      if (this.currentPoi === poi) {
        if (button) button.hidden = true;
        else image.hidden = true;
      }
    };
    if (poi.image) image.src = poi.image;
    else image.removeAttribute('src');
  }

  _render() {
    const c = this.character;
    this.el.name.textContent = c.name;
    this.el.role.textContent = c.role;
    this.el.step.textContent = `${this.index + 1} / ${this.lines.length}`;
    this.el.text.textContent = this.lines[this.index];
    this._renderPortrait();
    this.el.next.innerHTML = this.index === this.lines.length - 1 ? 'ENCERRAR <span>✕</span>' : 'CONTINUAR <span>▼</span>';
  }

  _renderPortrait() {
    const c = this.character;
    if (!c) return;
    // O retrato do diálogo usa seu conjunto próprio de arte. As páginas 1, 2 e
    // 3+ selecionam as poses 1, 2 e 3, respectivamente.
    const dialoguePoseIndex = dialoguePoseIndexForPage(this.index);
    const preferredPose = c.dialoguePoses?.[dialoguePoseIndex];

    // Se o arquivo da página ainda está carregando, atualiza o retrato ao terminar.
    if (preferredPose && !preferredPose.complete) {
      const previousOnload = preferredPose.onload;
      preferredPose.onload = () => {
        previousOnload?.();
        if (this.active && this.character === c) this._renderPortrait();
      };
    }

    const pose = this.npcManager.getPose(c, dialoguePoseIndex, 'dialogo');
    if (pose) {
      this.el.image.src = pose.src;
      this.el.image.hidden = false;
      this.el.fallback.hidden = true;
    } else {
      this.el.image.hidden = true;
      this.el.fallback.hidden = false;
      this.el.fallback.textContent = c.symbol;
      this.el.fallback.style.background = `radial-gradient(circle at 50% 25%,#e6bd82 0 14%,transparent 15%),linear-gradient(90deg,${c.color},${c.accent} 46%,${c.color})`;
    }
  }

  advance() {
    if (!this.active) return;
    if (this.index < this.lines.length - 1) { this.index += 1; this._render(); return; }
    this.active = false;
    this.currentPoi = null;
    if (this.el.topicImage) {
      this.el.topicImage.hidden = true;
      this.el.topicImage.removeAttribute('src');
    }
    if (this.el.topicImageButton) this.el.topicImageButton.hidden = true;
    this.npcManager.clearActive?.();
    this.el.layer.hidden = true;
    this.onEnd?.();
  }
}
