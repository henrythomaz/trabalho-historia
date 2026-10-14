// ============================================================
// levels.js — composição dos cenários da França (1789) e da
// Rússia (1917): terreno, construções, figuras e hotspots.
// ============================================================

import * as THREE from 'three';
import {
  mat,
  box,
  createFrenchHouse,
  createBakery,
  createAssemblyHall,
  createRoyalOffice,
  createBastille,
  createCart,
  createBarrel,
  createCrate,
  createLampPost,
  createRussianBlock,
  createRussianFactory,
  createRailcar,
  createGovBuilding,
  createSovietHall,
  createProtestBanner,
  createTree,
  createFigure,
  createSmoke,
  createHotspot,
  disposeObject
} from './buildings.js';

function ground(width, depth, color) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, depth), mat(color));
  g.position.y = -0.25;
  g.receiveShadow = true;
  return g;
}

// ruela de pedra: plano levemente acima do chão
function street(w, d, color, x, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat(color));
  m.position.set(x, 0.03, z);
  m.rotation.y = ry;
  m.receiveShadow = true;
  return m;
}

function place(group, obj, x, z, ry = 0) {
  obj.position.set(x, 0, z);
  obj.rotation.y = ry;
  group.add(obj);
  return obj;
}

// ============================================================
// FRANÇA — 1789
// ============================================================
export function buildFrance() {
  const group = new THREE.Group();
  const updaters = [];
  const hotspots = {};

  // terreno: grama seca + praça de pedra
  group.add(ground(30, 22, 0x7d8a5a));
  group.add(street(12, 10, 0x9a8f7c, 0, 0));            // praça central
  group.add(street(26, 3, 0x8f8471, 0, 0));              // rua horizontal
  group.add(street(3, 20, 0x8f8471, 0, 0));              // rua vertical

  // --- construções ---
  place(group, createRoyalOffice(), -9.5, -5.5, Math.PI / 2.6);   // administração real
  place(group, createAssemblyHall(), 0, -8, 0);                   // assembleia
  const bakery = place(group, createBakery(), 8.5, 3.5, -Math.PI / 2.2);

  const houseSpots = [
    { x: -8.5, z: 2.5, ry: Math.PI / 2.3, cfg: { wallColor: 0xd9c9a8, roofColor: 0x5a6478, floors: 2 } },
    { x: -6.5, z: 6.5, ry: Math.PI / 3.2, cfg: { wallColor: 0xcdbb96, roofColor: 0x6e5a4e, floors: 3 } },
    { x: 7.5, z: -4.5, ry: -Math.PI / 1.9, cfg: { wallColor: 0xd3c2a0, roofColor: 0x556080, floors: 2 } },
    { x: 10.5, z: -1.5, ry: -Math.PI / 2, cfg: { wallColor: 0xc9b48c, roofColor: 0x5f4a44, floors: 3 } },
    { x: -2.5, z: 7.5, ry: Math.PI, cfg: { wallColor: 0xe0d2b0, roofColor: 0x525c74, floors: 2 } }
  ];
  for (const h of houseSpots) {
    place(group, createFrenchHouse(h.cfg), h.x, h.z, h.ry);
  }

  // Bastilha ao fundo, na extremidade leste
  place(group, createBastille(), 12.5, -8.5, Math.PI / 5);

  // --- adereços ---
  place(group, createCart(), 4.2, 1.8, 0.5);
  place(group, createCart(), -4.8, -1.4, -0.9);
  const props = [
    [createBarrel(), 3.2, 3.4], [createBarrel(), 3.7, 3.0],
    [createCrate(0.5), -3.4, 2.8], [createCrate(0.42), -3.0, 3.3],
    [createBarrel(0x6b4f36), 9.9, 5.2], [createCrate(0.45), 9.4, 5.5]
  ];
  for (const [obj, x, z] of props) place(group, obj, x, z);

  place(group, createTree(), -11, 6.5);
  place(group, createTree(), 5.5, 7.5);
  place(group, createTree(), -5.5, -7.8);
  place(group, createLampPost(), 3.4, -3.4);
  place(group, createLampPost(), -3.4, 3.4);

  // fumaça leve na padaria
  const smoke = createSmoke(4, 0xd8d2c4);
  smoke.position.set(9.2, 3.4, 2.6);
  group.add(smoke);
  updaters.push((t) => smoke.userData.update(t));

  // estandartes na praça
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), mat(0x6b5a3a));
  bannerPole.position.set(-1.8, 1.6, -4.6);
  const bannerFlag = box(0.9, 0.6, 0.04, 0x3d5a80, -1.3, 2.7, -4.6);
  group.add(bannerPole, bannerFlag);
  updaters.push((t) => { bannerFlag.rotation.y = Math.sin(t * 1.2) * 0.12; });

  // --- figuras ---
  const figures = [];
  const figSpots = [
    [2.2, 0.8, 0x6b5340], [2.8, 1.4, 0x54503f], [-1.5, 1.8, 0x704838],
    [-2.2, 1.2, 0x4a5568], [6.8, 1.6, 0x6b5340], [-5.8, 0.4, 0x7a6248],
    [0.8, -2.6, 0x5f4a44], [-0.6, -3.2, 0x54503f]
  ];
  for (const [x, z, c] of figSpots) {
    const f = createFigure(c);
    f.position.set(x, 0, z);
    f.rotation.y = Math.random() * Math.PI * 2;
    group.add(f);
    figures.push(f);
  }
  updaters.push((t) => {
    figures.forEach((f, i) => {
      f.position.y = Math.abs(Math.sin(t * 1.4 + i * 1.7)) * 0.03;
    });
  });

  // --- hotspots ---
  const hsRoyal = createHotspot();
  hsRoyal.position.set(-7.2, 0, -3.4);
  group.add(hsRoyal);
  hotspots['fr-crise-fiscal'] = hsRoyal;

  const hsBakery = createHotspot();
  hsBakery.position.set(6.6, 0, 5.4);
  group.add(hsBakery);
  hotspots['fr-pao'] = hsBakery;

  // animação dos hotspots
  updaters.push((t) => {
    for (const hs of Object.values(hotspots)) {
      const { ring, ring2, marker, active } = hs.userData;
      const s = active ? 1 : 0.55;
      ring.scale.setScalar(s + Math.sin(t * 2.4) * 0.07);
      ring2.scale.setScalar(s + Math.sin(t * 2.4 + 1.5) * 0.09);
      marker.position.y = 2.0 + Math.sin(t * 1.8) * 0.18;
      marker.rotation.y = t * 1.1;
      const op = active ? 0.85 : 0.25;
      ring.material.opacity = op * (0.85 + Math.sin(t * 2.4) * 0.15);
      ring2.material.opacity = op * 0.6;
      marker.material.emissiveIntensity = active ? 0.85 + Math.sin(t * 3) * 0.25 : 0.15;
    }
  });

  return {
    id: 'france',
    group,
    hotspots,
    updaters,
    fog: new THREE.Fog(0xd8c9a8, 26, 60),
    skyColor: 0xd8c9a8,
    ambient: { color: 0xfff1d6, intensity: 0.85 },
    sun: { color: 0xffe6b3, intensity: 1.6, position: [12, 18, 8] },
    cameraTarget: new THREE.Vector3(0, 0.5, -0.5),
    dispose() { disposeObject(group); }
  };
}

// ============================================================
// RÚSSIA — 1917
// ============================================================
export function buildRussia() {
  const group = new THREE.Group();
  const updaters = [];
  const hotspots = {};

  // terreno nevado + praça e rua
  group.add(ground(30, 22, 0xcdd8e2));
  group.add(street(12, 9, 0x9aa5b0, 0, 0));
  group.add(street(26, 3, 0x8d98a4, 0, 0));
  group.add(street(3, 20, 0x8d98a4, 0, 0));

  // --- construções ---
  const factory = place(group, createRussianFactory(), -8.5, -6.5, Math.PI / 8);
  for (const s of factory.userData.smokes) updaters.push((t) => s.userData.update(t));

  place(group, createGovBuilding(), 8.8, -5.5, -Math.PI / 2.4);   // Governo Provisório
  place(group, createSovietHall(), -8.8, 5.0, Math.PI / 1.85);    // soviete

  place(group, createRailcar(), 4.5, 6.8, 0);

  const blocks = [
    { x: -1.5, z: -8.2, ry: 0, cfg: { wallColor: 0x8e99a8, floors: 3 } },
    { x: 3.2, z: -7.6, ry: 0.15, cfg: { wallColor: 0x7f8b9c, floors: 4 } },
    { x: 11.5, z: 1.5, ry: -Math.PI / 2, cfg: { wallColor: 0x99a3ae, floors: 3 } },
    { x: -3.5, z: 7.8, ry: Math.PI, cfg: { wallColor: 0x8a94a0, floors: 2 } }
  ];
  for (const b of blocks) place(group, createRussianBlock(b.cfg), b.x, b.z, b.ry);

  // --- adereços ---
  place(group, createProtestBanner(3.2), 0.5, -2.2, 0.12);
  place(group, createProtestBanner(2.4, 0x7a2e3a), -2.6, 1.6, -0.4);
  const props = [
    [createCrate(0.5, 0x6b625a), 2.6, 3.2], [createCrate(0.42, 0x6b625a), 3.1, 3.0],
    [createBarrel(0x5a5248), -6.0, -1.8], [createCrate(0.48, 0x5c564e), -5.5, -1.4]
  ];
  for (const [obj, x, z] of props) place(group, obj, x, z);

  place(group, createTree(true), 6.5, 8.2);
  place(group, createTree(true), -11.5, 1.0);
  place(group, createLampPost(0x3a414c, 0xd8e6f0), 3.4, -3.4);
  place(group, createLampPost(0x3a414c, 0xd8e6f0), -3.4, 3.6);

  // --- figuras: operários, soldados, manifestantes ---
  const figures = [];
  const figSpots = [
    [1.4, -0.6, 0x4a4038], [2.0, 0.2, 0x54586b], [0.6, 0.9, 0x6b5a48],
    [-1.6, -1.2, 0x4a5568], [-2.4, 0.4, 0x5c564e], [1.8, 2.2, 0x4a4038],
    [-6.8, 3.4, 0x54586b], [5.6, -2.8, 0x6b5a48], [7.0, 4.4, 0x4a5568]
  ];
  for (const [x, z, c] of figSpots) {
    const f = createFigure(c, 0xd8c0a8);
    f.position.set(x, 0, z);
    f.rotation.y = Math.random() * Math.PI * 2;
    group.add(f);
    figures.push(f);
  }
  updaters.push((t) => {
    figures.forEach((f, i) => {
      f.position.y = Math.abs(Math.sin(t * 1.3 + i * 2.1)) * 0.03;
    });
  });

  // neve caindo — poucos pontos, barato
  const snowCount = 90;
  const snowGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 28;
    pos[i * 3 + 1] = Math.random() * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.8, sizeAttenuation: true })
  );
  group.add(snow);
  updaters.push((t, dt) => {
    const arr = snow.geometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
      arr[i * 3 + 1] -= dt * 0.9;
      arr[i * 3] += Math.sin(t + i) * dt * 0.15;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 10;
    }
    snow.geometry.attributes.position.needsUpdate = true;
  });

  // --- hotspots ---
  const hsFactory = createHotspot();
  hsFactory.position.set(-5.6, 0, -3.2);
  group.add(hsFactory);
  hotspots['ru-guerra'] = hsFactory;

  const hsSoviet = createHotspot();
  hsSoviet.position.set(-6.4, 0, 3.2);
  group.add(hsSoviet);
  hotspots['ru-poder'] = hsSoviet;

  updaters.push((t) => {
    for (const hs of Object.values(hotspots)) {
      const { ring, ring2, marker, active } = hs.userData;
      const s = active ? 1 : 0.55;
      ring.scale.setScalar(s + Math.sin(t * 2.4) * 0.07);
      ring2.scale.setScalar(s + Math.sin(t * 2.4 + 1.5) * 0.09);
      marker.position.y = 2.0 + Math.sin(t * 1.8) * 0.18;
      marker.rotation.y = t * 1.1;
      const op = active ? 0.85 : 0.25;
      ring.material.opacity = op * (0.85 + Math.sin(t * 2.4) * 0.15);
      ring2.material.opacity = op * 0.6;
      marker.material.emissiveIntensity = active ? 0.85 + Math.sin(t * 3) * 0.25 : 0.15;
    }
  });

  return {
    id: 'russia',
    group,
    hotspots,
    updaters,
    fog: new THREE.Fog(0xb8c6d4, 26, 58),
    skyColor: 0xb8c6d4,
    ambient: { color: 0xdfe8f0, intensity: 0.8 },
    sun: { color: 0xf0e8d8, intensity: 1.1, position: [-10, 16, 6] },
    cameraTarget: new THREE.Vector3(0, 0.5, -0.5),
    dispose() { disposeObject(group); }
  };
}

export function buildLevel(id) {
  return id === 'france' ? buildFrance() : buildRussia();
}
