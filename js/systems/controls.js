export class Controls {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.joystick = document.getElementById('joystick');
    this.knob = document.getElementById('joystick-knob');
    this.pointerId = null;
    this.axis = { x: 0, y: 0 };
    this._bindKeyboard();
    this._bindJoystick();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)) {
        event.preventDefault(); this.keys.add(key);
      }
    }, { passive: false });
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this._resetJoystick(); });
  }

  _bindJoystick() {
    if (!this.joystick) return;
    this.joystick.addEventListener('pointerdown', (event) => {
      event.preventDefault(); this.pointerId = event.pointerId;
      this.joystick.setPointerCapture(event.pointerId); this._updateJoystick(event);
    });
    this.joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.pointerId) { event.preventDefault(); this._updateJoystick(event); }
    });
    const release = (event) => {
      if (event.pointerId === this.pointerId) this._resetJoystick();
    };
    this.joystick.addEventListener('pointerup', release);
    this.joystick.addEventListener('pointercancel', release);
    this.joystick.addEventListener('lostpointercapture', () => this._resetJoystick());
  }

  _updateJoystick(event) {
    const rect = this.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const max = rect.width * .34;
    const dx = event.clientX - cx, dy = event.clientY - cy;
    const length = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, max / length);
    this.axis.x = (dx * scale) / max;
    this.axis.y = (dy * scale) / max;
    this.knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  }

  _resetJoystick() {
    this.pointerId = null; this.axis.x = 0; this.axis.y = 0;
    if (this.knob) this.knob.style.transform = 'translate(0,0)';
  }

  getVector() {
    let x = this.axis.x, y = this.axis.y;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    return { x, y };
  }
}
