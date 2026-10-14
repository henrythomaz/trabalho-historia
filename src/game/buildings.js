// ============================================================
// buildings.js — fábricas de geometria low-poly reutilizáveis.
// Todos os materiais são compartilhados para economizar draw calls.
// ============================================================

import * as THREE from 'three';

// Cache de materiais por cor — poucos materiais para toda a cena.
const materialCache = new Map();
export function mat(color, opts = {}) {
  const key = `${color}|${opts.roughness ?? 0.9}|${opts.metalness ?? 0}|${opts.flat ?? 1}|${opts.emissive ?? 0}|${opts.transparent ?? 0}|${opts.opacity ?? 1}`;
  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.9,
        metalness: opts.metalness ?? 0,
        flatShading: opts.flat !== 0,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0.6,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1
      })
    );
  }
  return materialCache.get(key);
}

const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = `b${w},${h},${d}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
export function cylGeo(rt, rb, h, seg = 8) {
  const key = `c${rt},${rb},${h},${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
  return geoCache.get(key);
}
export function coneGeo(r, h, seg = 4) {
  const key = `k${r},${h},${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.ConeGeometry(r, h, seg));
  return geoCache.get(key);
}

export function box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat(color, opts));
  m.position.set(x, y + h / 2, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.rx) m.rotation.x = opts.rx;
  m.castShadow = !!opts.shadow;
  m.receiveShadow = true;
  return m;
}

// Telhado de duas águas (prisma triangular).
export function gableRoof(w, h, d, color, opts = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.castShadow = !!opts.shadow;
  return m;
}

// ---------- Figuras humanas estilizadas ----------
export function createFigure(color = 0x6b5340, skin = 0xd9b48f, scale = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(cylGeo(0.16, 0.22, 0.62, 6), mat(color));
  body.position.y = 0.31;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(skin));
  head.position.y = 0.75;
  g.add(body, head);
  g.scale.setScalar(scale);
  return g;
}

// ---------- Fumaça barata: poucos sprites de círculo ----------
let smokeTexture = null;
function getSmokeTexture() {
  if (smokeTexture) return smokeTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  smokeTexture = new THREE.CanvasTexture(c);
  return smokeTexture;
}

export function createSmoke(count = 5, tint = 0xcccccc) {
  const group = new THREE.Group();
  const puffs = [];
  const tex = getSmokeTexture();
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        color: tint,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
      })
    );
    sp.userData.phase = i / count;
    sp.scale.setScalar(0.7);
    group.add(sp);
    puffs.push(sp);
  }
  group.userData.update = (t) => {
    for (const sp of puffs) {
      const p = (t * 0.12 + sp.userData.phase) % 1;
      sp.position.set(Math.sin(p * 6.28) * 0.18, p * 2.4, 0);
      sp.material.opacity = 0.28 * (1 - p);
      sp.scale.setScalar(0.5 + p * 1.2);
    }
  };
  return group;
}

// ---------- Elementos franceses ----------

// Casa francesa: alvenaria clara, telhado inclinado ardósia, janelas e porta.
export function createFrenchHouse({
  w = 2.2,
  d = 2.0,
  floors = 2,
  wallColor = 0xd9c9a8,
  roofColor = 0x5a6478,
  shutters = 0x3d5a80
} = {}) {
  const g = new THREE.Group();
  const h = floors * 1.15;
  g.add(box(w, h, d, wallColor, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(w + 0.3, 0.8, d + 0.3, roofColor, { shadow: true });
  roof.position.y = h;
  g.add(roof);
  // cumeeira
  g.add(box(0.08, 0.08, d + 0.3, 0x3c4356, 0, h + 0.8, 0));
  // porta
  g.add(box(0.5, 0.85, 0.06, 0x4a3428, 0, 0, d / 2 + 0.02));
  // janelas com venezianas
  for (let f = 0; f < floors; f++) {
    const y = 0.45 + f * 1.15;
    for (const sx of [-0.65, 0.65]) {
      if (f === 0 && sx === 0) continue;
      g.add(box(0.34, 0.45, 0.05, 0x2a3140, sx, y, d / 2 + 0.02));
      g.add(box(0.1, 0.45, 0.05, shutters, sx - 0.24, y, d / 2 + 0.02));
      g.add(box(0.1, 0.45, 0.05, shutters, sx + 0.24, y, d / 2 + 0.02));
    }
  }
  // chaminé
  g.add(box(0.3, 0.7, 0.3, 0xa89880, w * 0.28, h + 0.5, -d * 0.2));
  return g;
}

// Padaria com toldo vinho e pães na entrada.
export function createBakery() {
  const g = new THREE.Group();
  g.add(box(2.6, 2.2, 2.2, 0xe3d3b3, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(2.9, 0.75, 2.5, 0x6e3b45, { shadow: true });
  roof.position.y = 2.2;
  g.add(roof);
  // toldo
  g.add(box(2.2, 0.08, 0.9, 0x7a2e3a, 0, 1.45, 1.35, { rx: -0.28 }));
  // porta e vitrine
  g.add(box(0.55, 0.95, 0.06, 0x4a3428, -0.7, 0, 1.12));
  g.add(box(1.1, 0.8, 0.06, 0x2a3140, 0.55, 0.25, 1.12));
  // balcão de pães
  g.add(box(1.2, 0.5, 0.5, 0x8a6a4a, 0.4, 0, 1.55));
  for (let i = 0; i < 4; i++) {
    const bread = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0xc8924e));
    bread.scale.set(1.6, 0.8, 0.9);
    bread.position.set(0.05 + i * 0.24, 0.58, 1.55);
    bread.castShadow = true;
    g.add(bread);
  }
  // placa
  g.add(box(1.5, 0.34, 0.06, 0xc9a227, 0, 1.8, 1.13, { emissive: 0x6b5212, emissiveIntensity: 0.35 }));
  return g;
}

// Edifício da Assembleia: fachada clássica com colunas e frontão.
export function createAssemblyHall() {
  const g = new THREE.Group();
  g.add(box(4.6, 2.6, 3.2, 0xded3bd, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(5.0, 1.1, 3.5, 0x54607a, { shadow: true });
  roof.position.y = 2.6;
  g.add(roof);
  // escadaria
  g.add(box(3.4, 0.18, 0.7, 0xb8ad94, 0, 0, 2.05));
  g.add(box(3.0, 0.18, 0.5, 0xc4b99f, 0, 0.18, 1.85));
  // colunas
  for (let i = 0; i < 4; i++) {
    const x = -1.5 + i * 1.0;
    const col = new THREE.Mesh(cylGeo(0.13, 0.15, 2.2, 8), mat(0xefe6d0));
    col.position.set(x, 1.45, 1.72);
    col.castShadow = true;
    g.add(col);
  }
  // frontão
  const ped = gableRoof(4.2, 0.7, 0.5, 0xded3bd);
  ped.position.set(0, 2.6, 1.55);
  g.add(ped);
  // portas
  g.add(box(0.9, 1.4, 0.08, 0x4a3428, 0, 0.36, 1.62));
  // estandarte
  g.add(box(0.5, 0.9, 0.04, 0x3d5a80, -2.0, 1.6, 1.7));
  g.add(box(0.5, 0.9, 0.04, 0xc9a227, 2.0, 1.6, 1.7, { emissive: 0x6b5212, emissiveIntensity: 0.3 }));
  return g;
}

// Administração monárquica: sobrado nobre com brasão dourado.
export function createRoyalOffice() {
  const g = new THREE.Group();
  g.add(box(3.6, 3.2, 2.8, 0xcbb894, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(4.0, 1.0, 3.1, 0x46506a, { shadow: true });
  roof.position.y = 3.2;
  g.add(roof);
  // janelas simétricas
  for (let f = 0; f < 3; f++) {
    for (const sx of [-1.1, 0, 1.1]) {
      g.add(box(0.42, 0.6, 0.06, 0x2a3140, sx, 0.4 + f * 1.05, 1.43));
    }
  }
  // porta dupla e brasão
  g.add(box(1.0, 1.3, 0.08, 0x3a2c20, 0, 0, 1.44));
  g.add(box(0.55, 0.55, 0.06, 0xc9a227, 0, 2.45, 1.44, { emissive: 0x6b5212, emissiveIntensity: 0.35 }));
  // bandeirola azul-real
  const pole = new THREE.Mesh(cylGeo(0.04, 0.04, 1.6, 6), mat(0x6b5a3a));
  pole.position.set(0, 3.2 + 0.8, 0);
  const flag = box(0.7, 0.42, 0.03, 0x3d5a80, 0.38, 3.9, 0);
  g.add(pole, flag);
  return g;
}

// Silhueta da Bastilha: torres cilíndricas com telhados cônicos.
export function createBastille() {
  const g = new THREE.Group();
  const stone = 0x8d8578;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * 2.2;
    const z = Math.sin(angle) * 1.6;
    const tower = new THREE.Mesh(cylGeo(0.75, 0.85, 4.2, 10), mat(stone));
    tower.position.set(x, 2.1, z);
    tower.castShadow = true;
    const cap = new THREE.Mesh(coneGeo(0.95, 1.1, 10), mat(0x4a5266));
    cap.position.set(x, 4.2 + 0.55, z);
    g.add(tower, cap);
  }
  // cortina (muralha central)
  g.add(box(3.6, 2.6, 2.4, stone, 0, 0, 0, { shadow: true }));
  g.add(box(3.9, 0.35, 2.7, 0x7c7468, 0, 2.6, 0));
  return g;
}

// Carroça simples.
export function createCart() {
  const g = new THREE.Group();
  g.add(box(1.3, 0.35, 0.8, 0x8a6a4a, 0, 0.35, 0));
  g.add(box(1.5, 0.08, 0.12, 0x6b5340, 0.95, 0.42, 0, { rz: -0.2 }));
  const wheelGeo = cylGeo(0.3, 0.3, 0.08, 10);
  for (const [x, z] of [[-0.45, 0.44], [0.45, 0.44], [-0.45, -0.44], [0.45, -0.44]]) {
    const w = new THREE.Mesh(wheelGeo, mat(0x5a4632));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.3, z);
    g.add(w);
  }
  return g;
}

// Barril / caixote.
export function createBarrel(color = 0x7a5c3e) {
  const m = new THREE.Mesh(cylGeo(0.28, 0.32, 0.6, 9), mat(color));
  m.position.y = 0.3;
  m.castShadow = true;
  return m;
}
export function createCrate(size = 0.5, color = 0x97795a) {
  const m = box(size, size, size, color, 0, 0, 0, { shadow: true });
  return m;
}

// Luminária de praça (lamparina a gás simples).
export function createLampPost(color = 0x2e3440, glow = 0xffd98a) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(cylGeo(0.045, 0.06, 2.1, 6), mat(color));
  pole.position.y = 1.05;
  const lamp = new THREE.Mesh(boxGeo(0.22, 0.3, 0.22), mat(glow, { emissive: glow, emissiveIntensity: 0.9 }));
  lamp.position.y = 2.25;
  const cap = new THREE.Mesh(coneGeo(0.2, 0.18, 4), mat(color));
  cap.position.y = 2.5;
  g.add(pole, lamp, cap);
  return g;
}

// ---------- Elementos russos ----------

// Prédio russo urbano: tons frios, muitas janelas, neve no telhado.
export function createRussianBlock({
  w = 2.6,
  d = 2.4,
  floors = 3,
  wallColor = 0x8e99a8,
  roofColor = 0x4a5568
} = {}) {
  const g = new THREE.Group();
  const h = floors * 1.05;
  g.add(box(w, h, d, wallColor, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(w + 0.2, 0.6, d + 0.2, roofColor, { shadow: true });
  roof.position.y = h;
  g.add(roof);
  // neve acumulada
  g.add(box(w * 0.7, 0.1, d * 0.7, 0xe8f0f5, 0, h + 0.6, 0));
  for (let f = 0; f < floors; f++) {
    const y = 0.35 + f * 1.05;
    const n = Math.max(2, Math.floor(w / 0.9));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.55 + i * ((w - 1.1) / Math.max(1, n - 1));
      g.add(box(0.34, 0.5, 0.05, f === 0 ? 0x3a4454 : 0x2a3140, x, y, d / 2 + 0.02));
    }
  }
  g.add(box(0.55, 0.9, 0.06, 0x37414f, 0, 0, d / 2 + 0.02));
  return g;
}

// Fábrica com chaminés altas.
export function createRussianFactory() {
  const g = new THREE.Group();
  g.add(box(5.0, 2.2, 3.0, 0x7d6d61, 0, 0, 0, { shadow: true }));
  // telhado serrilhado
  for (let i = 0; i < 3; i++) {
    const roof = gableRoof(1.7, 0.55, 3.0, 0x525c68);
    roof.position.set(-1.6 + i * 1.65, 2.2, 0);
    g.add(roof);
  }
  // fileira de janelas industriais
  for (let i = 0; i < 6; i++) {
    g.add(box(0.5, 0.7, 0.06, 0x39424e, -2.0 + i * 0.8, 0.9, 1.52));
  }
  // chaminés
  const smokes = [];
  for (const x of [-1.7, 1.7]) {
    const ch = new THREE.Mesh(cylGeo(0.28, 0.4, 3.4, 8), mat(0x6b4a3a));
    ch.position.set(x, 2.2 + 1.7, -0.8);
    ch.castShadow = true;
    g.add(ch);
    g.add(box(0.75, 0.2, 0.75, 0x553a2e, x, 5.5, -0.8));
    const smoke = createSmoke(5, 0xbfc8cf);
    smoke.position.set(x, 5.8, -0.8);
    g.add(smoke);
    smokes.push(smoke);
  }
  g.userData.smokes = smokes;
  return g;
}

// Vagão de trem estilizado sobre trilhos.
export function createRailcar() {
  const g = new THREE.Group();
  // trilhos
  for (const z of [-0.5, 0.5]) {
    g.add(box(6.5, 0.08, 0.12, 0x4a4f58, 0, 0.02, z));
  }
  for (let i = 0; i < 8; i++) {
    g.add(box(0.18, 0.05, 1.35, 0x5a4632, -2.8 + i * 0.8, 0, 0));
  }
  // vagão
  const car = new THREE.Group();
  car.add(box(2.6, 1.15, 1.15, 0x5c3a34, 0, 0.35, 0, { shadow: true }));
  car.add(box(2.7, 0.12, 1.25, 0x3d4754, 0, 1.5, 0));
  for (const x of [-0.8, 0, 0.8]) {
    car.add(box(0.4, 0.45, 0.05, 0x2a3140, x, 0.75, 0.6));
  }
  const wheelGeo = cylGeo(0.22, 0.22, 0.1, 10);
  for (const [x, z] of [[-0.85, 0.55], [0.85, 0.55], [-0.85, -0.55], [0.85, -0.55]]) {
    const w = new THREE.Mesh(wheelGeo, mat(0x2c313a));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.22, z);
    car.add(w);
  }
  car.position.y = 0.06;
  g.add(car);
  return g;
}

// Edifício do Governo Provisório: palácio administrativo frio.
export function createGovBuilding() {
  const g = new THREE.Group();
  g.add(box(4.4, 3.4, 3.0, 0xa7b2bd, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(4.8, 0.9, 3.3, 0x46536b, { shadow: true });
  roof.position.y = 3.4;
  g.add(roof);
  g.add(box(3.6, 0.12, 2.4, 0xe8f0f5, 0, 3.4 + 0.88, 0)); // neve
  // colunata central
  for (let i = 0; i < 4; i++) {
    const col = new THREE.Mesh(cylGeo(0.12, 0.14, 2.4, 8), mat(0xc4ccd4));
    col.position.set(-0.9 + i * 0.6, 1.2, 1.58);
    g.add(col);
  }
  const ped = gableRoof(2.8, 0.55, 0.5, 0xa7b2bd);
  ped.position.set(0, 3.4, 1.42);
  g.add(ped);
  for (let f = 0; f < 3; f++) {
    for (const sx of [-1.6, 1.6]) {
      g.add(box(0.4, 0.55, 0.06, 0x2a3140, sx, 0.35 + f * 1.1, 1.52));
    }
  }
  g.add(box(0.9, 1.3, 0.08, 0x37414f, 0, 0, 1.53));
  return g;
}

// Soviete / assembleia: salão modesto com bandeira vermelha discreta.
export function createSovietHall() {
  const g = new THREE.Group();
  g.add(box(3.4, 2.4, 2.6, 0x8a8178, 0, 0, 0, { shadow: true }));
  const roof = gableRoof(3.7, 0.8, 2.9, 0x4e5a48, { shadow: true });
  roof.position.y = 2.4;
  g.add(roof);
  g.add(box(3.0, 0.1, 2.2, 0xe8f0f5, 0, 3.15, 0)); // neve
  for (const sx of [-0.9, 0, 0.9]) {
    g.add(box(0.4, 0.6, 0.05, 0x2a3140, sx, 1.0, 1.32));
    g.add(box(0.4, 0.6, 0.05, 0x2a3140, sx, 1.75, 1.32));
  }
  g.add(box(0.85, 1.25, 0.08, 0x3a2c20, 0, 0, 1.33));
  // mastro com bandeira vermelha
  const pole = new THREE.Mesh(cylGeo(0.04, 0.05, 2.0, 6), mat(0x4a4f58));
  pole.position.set(1.6, 1.0, 1.5);
  const flag = box(0.75, 0.45, 0.03, 0x9e2b25, 2.0, 2.35, 1.5, { emissive: 0x5a100c, emissiveIntensity: 0.4 });
  g.add(pole, flag);
  return g;
}

// Banner de manifestação entre dois postes.
export function createProtestBanner(width = 2.6, color = 0x9e2b25) {
  const g = new THREE.Group();
  for (const x of [-width / 2, width / 2]) {
    const pole = new THREE.Mesh(cylGeo(0.04, 0.05, 2.3, 6), mat(0x4a4f58));
    pole.position.set(x, 1.15, 0);
    g.add(pole);
  }
  const banner = box(width, 0.55, 0.04, color, 0, 1.7, 0, { emissive: 0x3d0d0a, emissiveIntensity: 0.4 });
  g.add(banner);
  return g;
}

// Árvore (francesa: verde; russa: seca de inverno).
export function createTree(winter = false) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(cylGeo(0.08, 0.12, 0.7, 6), mat(0x5a4632));
  trunk.position.y = 0.35;
  g.add(trunk);
  if (winter) {
    for (const [rz, y] of [[0.5, 0.85], [-0.5, 0.95], [0.2, 1.1]]) {
      const branch = new THREE.Mesh(cylGeo(0.02, 0.05, 0.7, 5), mat(0x4a3a2c));
      branch.position.set(Math.sin(rz) * 0.2, y, 0);
      branch.rotation.z = rz;
      g.add(branch);
    }
  } else {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mat(0x5d7a4a));
    crown.position.y = 1.05;
    crown.castShadow = true;
    g.add(crown);
  }
  return g;
}

// ---------- Hotspot ----------
export function createHotspot(color = 0xc9a227) {
  const g = new THREE.Group();

  // anel no chão
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.15, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.65, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.06;
  g.add(ring2);

  // marcador flutuante (losango dourado)
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.85,
      roughness: 0.4,
      flatShading: true
    })
  );
  marker.position.y = 2.0;
  g.add(marker);

  // mastro de apoio visual
  const beam = new THREE.Mesh(
    cylGeo(0.02, 0.02, 1.6, 5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  beam.position.y = 0.9;
  g.add(beam);

  // hitbox invisível generosa
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 3.2, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = 1.6;
  g.add(hit);

  g.userData = { ring, ring2, marker, hit, active: true, baseY: 0 };
  return g;
}

export function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry && ![...geoCache.values()].includes(obj.geometry)) {
      obj.geometry.dispose();
    }
    // materiais e texturas compartilhados são mantidos propositalmente
  });
}
