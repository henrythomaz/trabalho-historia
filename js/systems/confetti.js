/** Efeito de confete local, sem API ou dependência externa. */
export class ConfettiEffect {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-layer';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.append(this.canvas);
    this.context = this.canvas.getContext('2d');
    this.particles = [];
    this.frame = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  celebrate() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.resize();
    const palette = ['#e7b45f', '#b64b3e', '#f4e8ce', '#6e9471', '#6f8fa8'];
    const count = Math.min(170, Math.max(90, Math.round(this.width * 0.28)));
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.random() * Math.PI * 0.82) + Math.PI * 0.09;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x: this.width * (0.22 + Math.random() * 0.56),
        y: -10 - Math.random() * this.height * 0.12,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.095 + Math.random() * 0.09,
        width: 4 + Math.random() * 6,
        height: 5 + Math.random() * 8,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.22,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 210 + Math.random() * 100
      });
    }
    if (this.frame === null) this.frame = requestAnimationFrame((time) => this.draw(time));
  }

  draw() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < this.height + 30);
    for (const p of this.particles) {
      p.vy += p.gravity;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.min(1, p.life / 35);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }
    if (this.particles.length) this.frame = requestAnimationFrame(() => this.draw());
    else {
      ctx.clearRect(0, 0, this.width, this.height);
      this.frame = null;
    }
  }
}
