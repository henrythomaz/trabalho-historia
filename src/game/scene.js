// ============================================================
// scene.js — renderer, câmera ortográfica isométrica, luzes,
// raycaster para hotspots, loop de animação e redimensionamento.
// ============================================================

import * as THREE from 'three';
import { buildLevel } from './levels.js';

const CAM_DIST = 26;

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.level = null;
    this.onHotspotTap = null;
    this.paused = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._camGoal = null;
    this._zoomGoal = null;
    this._elapsed = 0;
    this._last = performance.now();

    // --- renderer ---
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'low-power'
    });
    if (!this.renderer.getContext()) {
      throw new Error('WebGL indisponível');
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = false; // sombras econômicas: desligadas
    container.appendChild(this.renderer.domElement);

    // --- cena e câmera ---
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
    this.cameraTarget = new THREE.Vector3(0, 0.5, 0);
    this._applyCamera();

    // --- luzes ---
    this.ambient = new THREE.AmbientLight(0xfff1d6, 0.85);
    this.sun = new THREE.DirectionalLight(0xffe6b3, 1.6);
    this.sun.position.set(12, 18, 8);
    this.scene.add(this.ambient, this.sun);

    // --- raycaster ---
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._onPointerDown = (ev) => this._handlePointer(ev);
    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown);

    // --- resize ---
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);

    // --- pausa em segundo plano ---
    this._onVisibility = () => {
      this.paused = document.hidden;
      if (!this.paused) this._last = performance.now();
    };
    document.addEventListener('visibilitychange', this._onVisibility);

    this._resize();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  // Carrega um cenário ('france' | 'russia'), descartando o anterior.
  setLevel(id) {
    if (this.level) {
      this.scene.remove(this.level.group);
      this.level.dispose();
      this.level = null;
    }
    const level = buildLevel(id);
    this.level = level;
    this.scene.add(level.group);
    this.scene.fog = level.fog;
    this.scene.background = new THREE.Color(level.skyColor);
    this.ambient.color.set(level.ambient.color);
    this.ambient.intensity = level.ambient.intensity;
    this.sun.color.set(level.sun.color);
    this.sun.intensity = level.sun.intensity;
    this.sun.position.set(...level.sun.position);
    this.cameraTarget.copy(level.cameraTarget);
    this._camGoal = null;
    this._applyCamera();
    this._resize();
  }

  // Destaca apenas o hotspot ativo; os demais ficam discretos.
  setActiveHotspot(eventId) {
    if (!this.level) return;
    for (const [id, hs] of Object.entries(this.level.hotspots)) {
      hs.userData.active = id === eventId;
    }
  }

  // Aproximação suave da câmera até um hotspot.
  focusHotspot(eventId) {
    const hs = this.level?.hotspots[eventId];
    if (!hs || this.reducedMotion) return;
    this._camGoal = hs.position.clone().multiplyScalar(0.75);
    this._camGoal.y = 0.5;
    this._zoomGoal = 1.5;
    setTimeout(() => this.resetCameraFocus(), 2600);
  }

  resetCameraFocus() {
    if (!this.level) return;
    this._camGoal = this.level.cameraTarget.clone();
    this._zoomGoal = 1.0;
  }

  _applyCamera() {
    // ângulo isométrico oblíquo
    this.camera.position.set(
      this.cameraTarget.x + CAM_DIST * 0.72,
      this.cameraTarget.y + CAM_DIST * 0.62,
      this.cameraTarget.z + CAM_DIST * 0.72
    );
    this.camera.lookAt(this.cameraTarget);
  }

  _resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    // frustum maior em retrato para caber a cidade, com limite para não encolher demais
    const base = aspect >= 1 ? 10.5 : Math.min((10.5 / Math.max(aspect, 0.42)) * 0.72, 17);
    const zoom = this._zoom ?? 1;
    const view = base / zoom;
    this.camera.left = -view * aspect;
    this.camera.right = view * aspect;
    this.camera.top = view;
    this.camera.bottom = -view;
    this.camera.updateProjectionMatrix();
  }

  _handlePointer(ev) {
    if (!this.level || !this.onHotspotTap) return;
    try {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = [];
      for (const [id, hs] of Object.entries(this.level.hotspots)) {
        hits.push({ id, mesh: hs.userData.hit });
      }
      const intersects = this.raycaster.intersectObjects(hits.map((h) => h.mesh), false);
      if (intersects.length > 0) {
        const found = hits.find((h) => h.mesh === intersects[0].object);
        if (found) this.onHotspotTap(found.id);
      }
    } catch (err) {
      console.error('[cena] erro na seleção do hotspot:', err);
    }
  }

  _loop(now) {
    this._raf = requestAnimationFrame(this._loop);
    if (this.paused) {
      this._last = now;
      return;
    }
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.05);
    if (this.reducedMotion) dt *= 0.25;

    this._elapsed += dt;
    const t = this._elapsed;

    if (this.level) {
      for (const up of this.level.updaters) up(t, dt);
    }

    // easing da câmera
    if (this._camGoal) {
      this.cameraTarget.lerp(this._camGoal, 1 - Math.pow(0.001, dt));
      if (this.cameraTarget.distanceTo(this._camGoal) < 0.05) this._camGoal = null;
      this._applyCamera();
    }
    if (this._zoomGoal != null) {
      this._zoom = this._zoom ?? 1;
      this._zoom += (this._zoomGoal - this._zoom) * (1 - Math.pow(0.001, dt));
      if (Math.abs(this._zoom - this._zoomGoal) < 0.02) {
        this._zoom = this._zoomGoal;
        this._zoomGoal = null;
      }
      this._resize();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
    if (this.level) this.level.dispose();
    this.renderer.dispose();
  }
}
