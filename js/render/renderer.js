import { distributeCharactersAcrossTopics } from '../systems/character-distribution.js';

function seededNoise(x, y) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// O cenário já possui uma pixelização discreta; o valor um pouco maior reforça o efeito sem exagerar.
const PIXEL_SIZE = 4.5;
const NPC_PIXELATION = 3;
const PLAYER_PIXELATION = 4;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Coloca cada NPC ao lado do primeiro tópico de seu bloco. A mesma função de
 * distribuição é usada pelo diálogo, evitando que cenário e fala discordem.
 */
export function npcPlacementsForScene(scene, characters) {
  const assignments = distributeCharactersAcrossTopics(scene?.poi || [], characters || []);
  const placements = [];
  const occupied = [];
  const sideOffsets = [-112, 112];
  const verticalOffsets = [0, -42, 42, -84, 84, -126, 126];
  const world = scene?.world || { width: 1040, height: 3220 };
  const obstacles = scene?.obstacles || [];

  const overlapsObstacle = (x, y, radius = 24) => obstacles.some((obstacle) => {
    const dx = Math.max(obstacle.x - x, 0, x - (obstacle.x + obstacle.w));
    const dy = Math.max(obstacle.y - y, 0, y - (obstacle.y + obstacle.h));
    return Math.hypot(dx, dy) < radius;
  });

  for (const assignment of assignments) {
    if (!assignment.isAnchorTopic) continue;
    const { topic, characterIndex, character } = assignment;
    const preferredSides = characterIndex % 2 === 0 ? [0, 1] : [1, 0];
    let position = null;

    for (const sideIndex of preferredSides) {
      const x = topic.x + sideOffsets[sideIndex];
      for (const offsetY of verticalOffsets) {
        const y = clamp(topic.y + offsetY, 36, world.height - 36);
        const isOccupied = occupied.some(point => Math.hypot(point.x - x, point.y - y) < 78);
        if (x >= 36 && x <= world.width - 36 && !isOccupied && !overlapsObstacle(x, y)) {
          position = { x, y };
          break;
        }
      }
      if (position) break;
    }

    // Em mapas muito compactos pode não existir uma posição livre perfeita;
    // ainda assim, mantém o NPC próximo ao tópico em vez de removê-lo.
    if (!position) {
      const side = preferredSides[0];
      position = {
        x: clamp(topic.x + sideOffsets[side], 36, world.width - 36),
        y: clamp(topic.y, 36, world.height - 36)
      };
    }

    occupied.push(position);
    placements.push({ person: character, character, topic, characterIndex, position });
  }

  return placements;
}

export class Renderer {
  constructor(canvas, labelLayer = null) {
    this.canvas = canvas;
    this.labelLayer = labelLayer;
    this.poiLabelNodes = new Map();
    this.labelSceneId = null;
    this.cameraX = 0;
    this.cameraY = 0;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.cacheCanvas = document.createElement('canvas');
    this.cacheCtx = this.cacheCanvas.getContext('2d');
    this.frameCanvas = document.createElement('canvas');
    this.frameCtx = this.frameCanvas.getContext('2d');
    // Canvas auxiliar reutilizado para aplicar uma redução mínima na resolução dos sprites.
    this.spriteCanvas = document.createElement('canvas');
    this.spriteCtx = this.spriteCanvas.getContext('2d');
    this.cachedScene = null;
    this.canvas.style.imageRendering = 'auto';
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

    // O canvas principal trabalha na resolução real do dispositivo. O cenário
    // usa seu framebuffer próprio; NPCs e player recebem apenas uma redução
    // mínima individual, preservando a ordenação por Y.
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.frameCanvas.width = Math.max(1, Math.ceil(this.width / PIXEL_SIZE));
    this.frameCanvas.height = Math.max(1, Math.ceil(this.height / PIXEL_SIZE));
    this.ctx.imageSmoothingEnabled = false;
    this.frameCtx.imageSmoothingEnabled = false;
  }

  render({ scene, player, npcManager, playerSprites, phase, completed, nearby, delta }) {
    const ctx = this.ctx;
    const frameCtx = this.frameCtx;
    this.time += delta;
    const scale = 1 / PIXEL_SIZE;
    const w = this.width, h = this.height;
    const cameraX = Math.round(clamp(player.x - w / 2, 0, scene.world.width - w) / PIXEL_SIZE) * PIXEL_SIZE;
    const cameraY = Math.round(clamp(player.y - h / 2, 0, scene.world.height - h) / PIXEL_SIZE) * PIXEL_SIZE;
    this.cameraX = cameraX;
    this.cameraY = cameraY;
    this._updatePoiLabels(scene, completed, nearby, cameraX, cameraY);

    if (this.cachedScene !== scene.id) {
      this.cacheCanvas.width = Math.ceil(scene.world.width / PIXEL_SIZE);
      this.cacheCanvas.height = Math.ceil(scene.world.height / PIXEL_SIZE);
      this.cacheCtx.imageSmoothingEnabled = false;
      this.cacheCtx.setTransform(1 / PIXEL_SIZE, 0, 0, 1 / PIXEL_SIZE, 0, 0);
      this._drawWorld(this.cacheCtx, scene, phase);
      this.cachedScene = scene.id;
    }

    // Camada de cenário: segue em pixel art 16-bit.
    frameCtx.setTransform(scale, 0, 0, scale, 0, 0);
    frameCtx.imageSmoothingEnabled = false;
    frameCtx.fillStyle = phase === 'france' ? '#b69d78' : '#747e7b';
    frameCtx.fillRect(0, 0, w, h);
    frameCtx.save();
    frameCtx.translate(-cameraX, -cameraY);
    frameCtx.drawImage(this.cacheCanvas, 0, 0, scene.world.width, scene.world.height);
    this._drawPoi(frameCtx, scene, completed, nearby);
    frameCtx.restore();

    // Amplia apenas o cenário com vizinho mais próximo. Os títulos HTML e os
    // personagens continuam em camadas próprias, fora deste framebuffer.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.frameCanvas, 0, 0, this.frameCanvas.width, this.frameCanvas.height, 0, 0, w, h);

    // NPCs e player compartilham a mesma ordenação de profundidade: quem está
    // mais abaixo na tela aparece na frente. Cada sprite recebe pixelização sutil.
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(-cameraX, -cameraY);
    ctx.imageSmoothingEnabled = true;
    this._drawActors(ctx, player, phase, npcManager, playerSprites, scene);
    ctx.restore();
  }

  _drawWorld(ctx, scene, phase) {
    const french = phase === 'france';
    const c = french ? {
      ground: '#b9a47d', groundAlt: '#c7b48d', groundDark: '#a58e69',
      road: '#77746b', roadAlt: '#858177', roadEdge: '#4d514d', roadLine: '#c0ad88',
      plaza: '#d0bd94', plazaAlt: '#c5b187', building: '#cdb995',
      wall: '#a98f6b', roof: '#754c43', roofLight: '#986454', trim: '#e0cba2',
      window: '#43545a', accent: '#a84437', metal: '#45494a'
    } : {
      ground: '#858e89', groundAlt: '#929a92', groundDark: '#697773',
      road: '#4d585a', roadAlt: '#596365', roadEdge: '#303d40', roadLine: '#9da49a',
      plaza: '#aeb4a8', plazaAlt: '#9fa79d', building: '#969d96',
      wall: '#747d79', roof: '#424e53', roofLight: '#5b6768', trim: '#c2c3b3',
      window: '#293d46', accent: '#a53d35', metal: '#394448'
    };

    ctx.fillStyle = c.ground;
    ctx.fillRect(0, 0, scene.world.width, scene.world.height);

    // Old European street ground: broad stone slabs with irregular pixel chips.
    for (let y = 0; y < scene.world.height; y += 42) {
      for (let x = 0; x < scene.world.width; x += 42) {
        const n = seededNoise(x, y);
        ctx.fillStyle = n > .64 ? c.groundAlt : (n < .16 ? c.groundDark : c.ground);
        ctx.fillRect(x + 3, y + 3, 36, 36);
        if (n > .76) {
          ctx.fillStyle = french ? '#d5c397' : '#aab0a5';
          ctx.fillRect(x + 9, y + 9, 6, 3);
          ctx.fillRect(x + 27, y + 27, 3, 6);
        } else if (n < .1) {
          ctx.fillStyle = '#303a3830';
          ctx.fillRect(x + 15, y + 18, 9, 3);
        }
      }
    }

    // Main avenue and cross streets stay on the original gameplay coordinates.
    ctx.fillStyle = c.roadEdge;
    ctx.fillRect(357, 0, 326, scene.world.height);
    ctx.fillStyle = c.road;
    ctx.fillRect(365, 0, 310, scene.world.height);
    const crossStreets = scene.poi.map(p => p.y);
    crossStreets.forEach(y => {
      ctx.fillStyle = c.roadEdge;
      ctx.fillRect(0, y - 63, scene.world.width, 126);
      ctx.fillStyle = c.road;
      ctx.fillRect(0, y - 57, scene.world.width, 114);
    });

    // Staggered cobblestones on roads, like a 16-bit RPG map.
    for (let y = 0; y < scene.world.height; y += 24) {
      const offset = (Math.floor(y / 24) % 2) * 15;
      for (let x = 370 + offset; x < 672; x += 30) {
        const n = seededNoise(x, y + 7);
        ctx.fillStyle = n > .55 ? c.roadAlt : (n < .2 ? '#343e3d' : c.road);
        ctx.fillRect(x, y + 3, 24, 15);
        ctx.fillStyle = '#d7c8a01c';
        ctx.fillRect(x + 3, y + 3, 15, 3);
      }
    }
    for (const y of crossStreets) {
      for (let x = 0; x < scene.world.width; x += 30) {
        const n = seededNoise(x + 11, y);
        ctx.fillStyle = n > .58 ? c.roadAlt : c.road;
        ctx.fillRect(x + 3, y - 42, 24, 15);
        ctx.fillRect(x + 3, y + 21, 24, 15);
      }
    }

    // Painted curbs, sidewalks and square-paved event plazas.
    ctx.fillStyle = c.roadLine;
    ctx.fillRect(365, 0, 6, scene.world.height);
    ctx.fillRect(669, 0, 6, scene.world.height);
    for (const y of crossStreets) {
      ctx.fillRect(0, y - 57, scene.world.width, 6);
      ctx.fillRect(0, y + 51, scene.world.width, 6);
    }
    scene.poi.forEach((p, i) => {
      ctx.fillStyle = '#313b3855';
      ctx.fillRect(p.x - 132 + 6, p.y - 78 + 9, 264, 156);
      ctx.fillStyle = c.plazaAlt;
      ctx.fillRect(p.x - 132, p.y - 81, 264, 156);
      ctx.fillStyle = c.plaza;
      ctx.fillRect(p.x - 126, p.y - 75, 252, 144);
      ctx.fillStyle = c.roadLine;
      ctx.fillRect(p.x - 126, p.y - 75, 252, 3);
      ctx.fillRect(p.x - 126, p.y + 66, 252, 3);
      // Small paving slabs, kept away from the walkable landmark center.
      for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) {
        const tx = p.x - 114 + col * 30 + (row % 2) * 3;
        const ty = p.y - 57 + row * 27;
        if (Math.abs(tx + 12 - p.x) < 45 && Math.abs(ty + 10 - p.y) < 39) continue;
        ctx.fillStyle = ((row + col + i) % 3 === 0) ? '#e0cfaa' : '#b9a77f';
        ctx.fillRect(tx, ty, 24, 18);
        ctx.fillStyle = '#6a62501c';
        ctx.fillRect(tx, ty + 15, 24, 3);
      }
    });

    // The Russian map keeps its railway motif; it is rendered as chunky rails.
    if (!french) this._drawRailway(ctx, c);

    // Buildings use the exact same obstacle rectangles used by collision code.
    scene.obstacles.forEach((b, index) => this._drawBuilding(ctx, b, index, c, french));
    this._drawStreetProps(ctx, scene, c, french);
    for (let y = 205; y < scene.world.height - 80; y += 330) {
      this._drawLamp(ctx, 350, y, french);
      this._drawLamp(ctx, 690, y + 100, french);
    }
    if (french) this._drawFrenchDetails(ctx, c, scene);
    else this._drawRussianDetails(ctx, c, scene);

    // A tiled stone boundary finishes the explorable map.
    ctx.fillStyle = '#2d3433';
    ctx.fillRect(0, 0, scene.world.width, 9);
    ctx.fillRect(0, scene.world.height - 9, scene.world.width, 9);
    ctx.fillRect(0, 0, 9, scene.world.height);
    ctx.fillRect(scene.world.width - 9, 0, 9, scene.world.height);
    ctx.fillStyle = french ? '#d5bd8c' : '#a9afa4';
    for (let x = 12; x < scene.world.width - 12; x += 24) {
      ctx.fillRect(x, 3, 12, 3);
      ctx.fillRect(x, scene.world.height - 6, 12, 3);
    }
  }

  _drawBuilding(ctx, b, index, c, french) {
    const x = b.x, y = b.y, w = b.w, h = b.h;
    // Foundation and side wall create the compact top-down RPG building profile.
    ctx.fillStyle = '#17201f99';
    ctx.fillRect(x + 9, y + 12, w, h);
    ctx.fillStyle = c.wall;
    ctx.fillRect(x, y + 8, w, h - 8);
    ctx.fillStyle = c.building;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 12);
    ctx.fillStyle = c.trim;
    ctx.fillRect(x, y, w, 9);
    ctx.fillRect(x, y, 6, h);
    ctx.fillStyle = c.roof;
    ctx.fillRect(x + 9, y + 12, w - 18, h - 27);
    ctx.fillStyle = c.roofLight;
    ctx.fillRect(x + 12, y + 15, w - 24, 6);

    if (french) {
      // Mansard roofs, copper ridges, dormers and cream stone chimneys.
      for (let ty = y + 27; ty < y + h - 30; ty += 21) {
        const shift = (Math.floor((ty - y) / 21) % 2) * 9;
        for (let tx = x + 15 + shift; tx < x + w - 18; tx += 27) {
          ctx.fillStyle = ((Math.floor(tx / 27) + Math.floor(ty / 21) + index) % 3 === 0) ? '#a16e58' : c.roofLight;
          ctx.fillRect(tx, ty, 18, 12);
          ctx.fillStyle = '#392f2b55';
          ctx.fillRect(tx, ty + 9, 18, 3);
        }
      }
      ctx.fillStyle = '#d0ac78';
      ctx.fillRect(x + 12, y + 22, w - 24, 6);
      for (let dx = x + 27; dx < x + w - 24; dx += 63) {
        ctx.fillStyle = '#d3c19b'; ctx.fillRect(dx, y + 36, 18, 15);
        ctx.fillStyle = '#4d5553'; ctx.fillRect(dx + 3, y + 39, 12, 9);
        ctx.fillStyle = '#b58b61'; ctx.fillRect(dx - 3, y + 33, 24, 3);
      }
      ctx.fillStyle = '#ded0ac';
      ctx.fillRect(x + w - 33, y + 33, 15, 21);
      ctx.fillStyle = '#6b6253'; ctx.fillRect(x + w - 30, y + 36, 9, 15);
    } else {
      // Petrograd roof seams, patches of old snow, vents and factory fittings.
      for (let tx = x + 18; tx < x + w - 18; tx += 24) {
        ctx.fillStyle = '#303e42'; ctx.fillRect(tx, y + 24, 3, h - 57);
      }
      for (let ty = y + 30; ty < y + h - 30; ty += 36) {
        ctx.fillStyle = '#7e8982'; ctx.fillRect(x + 18, ty, w - 36, 3);
        if (seededNoise(index + 4, ty) > .45) {
          ctx.fillStyle = '#c4c9bb'; ctx.fillRect(x + 24, ty + 6, 21, 6);
        }
      }
      ctx.fillStyle = '#a7ada2'; ctx.fillRect(x + 24, y + 30, 30, 15);
      ctx.fillStyle = '#3b484b'; ctx.fillRect(x + 30, y + 33, 18, 9);
      ctx.fillStyle = '#353f42'; ctx.fillRect(x + w - 45, y + h - 60, 24, 24);
      ctx.fillStyle = '#737e78'; ctx.fillRect(x + w - 42, y + h - 57, 18, 18);
    }

    // Street-facing facade, windows and doorway remain visual only.
    ctx.fillStyle = c.wall;
    ctx.fillRect(x + 9, y + h - 18, w - 18, 12);
    const windows = Math.max(2, Math.floor(w / 70));
    for (let i = 0; i < windows; i++) {
      const wx = x + 21 + i * ((w - 48) / windows);
      ctx.fillStyle = '#28383d'; ctx.fillRect(wx, y + h - 18, 18, 12);
      ctx.fillStyle = '#9b9c8c'; ctx.fillRect(wx + 6, y + h - 18, 3, 12);
    }
    ctx.fillStyle = '#dfc79a';
    ctx.fillRect(x + w * .46, y + h - 24, 24, 18);
    ctx.fillStyle = '#51483d';
    ctx.fillRect(x + w * .46 + 6, y + h - 18, 12, 12);
    ctx.fillStyle = '#252d2e';
    ctx.fillRect(x + 3, y + h - 3, w - 6, 3);
  }

  _drawRailway(ctx, c) {
    ctx.fillStyle = '#303b3e';
    ctx.fillRect(393, 0, 12, 1510);
    ctx.fillRect(635, 0, 12, 1510);
    ctx.fillStyle = '#b0b1a2';
    ctx.fillRect(396, 0, 5, 1510);
    ctx.fillRect(638, 0, 5, 1510);
    for (let y = 0; y < 1510; y += 30) {
      ctx.fillStyle = '#584f48';
      ctx.fillRect(384, y, 270, 9);
      ctx.fillStyle = '#b0a58e';
      ctx.fillRect(384, y, 270, 3);
    }
  }

  _drawStreetProps(ctx, scene, c, french) {
    // Crates, barrels and planters are deliberately kept clear of the POI centres.
    for (let i = 0; i < scene.poi.length; i++) {
      const p = scene.poi[i];
      const side = i % 2 ? 1 : -1;
      const x = p.x + side * 112;
      const y = p.y + (i % 3 - 1) * 44;
      this._drawCrate(ctx, x, y, french);
      if (i % 2 === 0) this._drawBarrel(ctx, x - side * 18, y + 30, french);
    }
  }

  _drawCrate(ctx, x, y, french) {
    ctx.fillStyle = '#332f2a'; ctx.fillRect(x - 12, y - 9, 27, 24);
    ctx.fillStyle = french ? '#9b7047' : '#81694b'; ctx.fillRect(x - 9, y - 12, 24, 21);
    ctx.fillStyle = french ? '#c0935e' : '#a28a65';
    ctx.fillRect(x - 6, y - 9, 18, 3); ctx.fillRect(x - 6, y + 3, 18, 3);
    ctx.fillStyle = '#4a3e30'; ctx.fillRect(x + 1, y - 9, 3, 18);
  }

  _drawBarrel(ctx, x, y, french) {
    ctx.fillStyle = '#2e3432'; ctx.fillRect(x - 9, y - 12, 21, 27);
    ctx.fillStyle = french ? '#80543a' : '#69513e'; ctx.fillRect(x - 6, y - 12, 15, 24);
    ctx.fillStyle = '#b18b59'; ctx.fillRect(x - 6, y - 9, 15, 3); ctx.fillRect(x - 6, y + 3, 15, 3);
    ctx.fillStyle = '#353b3a'; ctx.fillRect(x - 3, y - 12, 3, 24);
  }

  _drawLamp(ctx, x, y, french) {
    ctx.fillStyle = '#283230'; ctx.fillRect(x - 6, y + 12, 15, 6);
    ctx.fillStyle = '#444b47'; ctx.fillRect(x - 3, y - 15, 9, 30);
    ctx.fillStyle = '#222c2d'; ctx.fillRect(x - 9, y - 21, 21, 6);
    ctx.fillStyle = french ? '#e5bd73' : '#d4d4b5';
    ctx.fillRect(x - 6, y - 30, 15, 12);
    ctx.fillStyle = '#fff0bf'; ctx.fillRect(x - 3, y - 27, 9, 6);
    ctx.fillStyle = french ? '#b68a4e' : '#8e9690';
    ctx.fillRect(x - 9, y - 33, 21, 3);
  }

  _drawFrenchDetails(ctx, c, scene) {
    // Parisian market stalls in tricolour cloth, handcarts and barricades.
    for (let i = 0; i < 8; i++) {
      const x = 414 + (i % 2) * 222;
      const y = 350 + i * 115;
      this._drawMarketStall(ctx, x, y, i % 2 === 0);
    }
    this._drawCrowd(ctx, 420, 570, '#536b78', true);
    this._drawCrowd(ctx, 620, 875, '#934b3e', true);
    this._drawFlag(ctx, 382, 177, ['#315c82', '#f0e6ce', '#a84236']);
    this._drawFlag(ctx, 652, 1200, ['#315c82', '#f0e6ce', '#a84236']);
    this._drawCart(ctx, 708, 1080, true);
    this._drawBarricade(ctx, 390, 1515, true);
    this._drawSign(ctx, 382, 120, 276, 27, '#e2d1a9', '#72543d', 'PARIS  •  1789');
  }

  _drawRussianDetails(ctx, c, scene) {
    // Factory-era Petrograd: iron lamp posts, red worker banners and supplies.
    for (let i = 0; i < 10; i++) {
      const x = 420 + (i % 3) * 82;
      const y = 375 + i * 92;
      this._drawBanner(ctx, x, y, i % 2 === 0);
    }
    this._drawFactoryStack(ctx, 72, 370);
    this._drawFactoryStack(ctx, 870, 1175);
    this._drawCrowd(ctx, 425, 560, '#475e69', false);
    this._drawCrowd(ctx, 625, 865, '#93443c', false);
    this._drawCart(ctx, 710, 1080, false);
    this._drawBarricade(ctx, 390, 1515, false);
    this._drawFlag(ctx, 382, 177, ['#a83e35', '#a83e35', '#a83e35']);
    this._drawSign(ctx, 382, 120, 276, 27, '#c7c6b5', '#554d45', 'PETROGRAD  •  1917');
  }

  _drawMarketStall(ctx, x, y, blue) {
    ctx.fillStyle = '#333936'; ctx.fillRect(x - 27, y + 18, 57, 9);
    ctx.fillStyle = '#8a5b3e'; ctx.fillRect(x - 24, y - 3, 51, 24);
    ctx.fillStyle = '#e0c89d'; ctx.fillRect(x - 30, y - 12, 63, 12);
    ctx.fillStyle = blue ? '#395d7a' : '#a84538';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 27 + i * 12, y - 12, 6, 12);
    ctx.fillStyle = '#3a4545'; ctx.fillRect(x - 27, y - 15, 57, 3);
    ctx.fillStyle = '#c9ab76'; ctx.fillRect(x - 18, y + 3, 12, 9); ctx.fillRect(x + 6, y + 3, 12, 9);
  }

  _drawBanner(ctx, x, y, red) {
    ctx.fillStyle = '#303c3d'; ctx.fillRect(x - 3, y - 25, 6, 61);
    ctx.fillStyle = red ? '#a63e36' : '#4b6270'; ctx.fillRect(x + 3, y - 21, 36, 24);
    ctx.fillStyle = '#e3d7bd'; ctx.fillRect(x + 9, y - 15, 24, 3);
    ctx.fillRect(x + 9, y - 6, 18, 3);
    ctx.fillStyle = '#363b3a'; ctx.fillRect(x - 9, y + 33, 18, 6);
  }

  _drawFactoryStack(ctx, x, y) {
    ctx.fillStyle = '#313b3d'; ctx.fillRect(x, y + 30, 45, 15);
    ctx.fillStyle = '#704d43'; ctx.fillRect(x + 6, y + 6, 24, 36);
    ctx.fillStyle = '#a24a3d'; ctx.fillRect(x + 3, y, 30, 9);
    ctx.fillStyle = '#c1b8a2'; ctx.fillRect(x + 9, y + 12, 6, 6); ctx.fillRect(x + 21, y + 27, 6, 6);
    ctx.fillStyle = '#7f8981'; ctx.fillRect(x + 9, y - 15, 18, 9);
    ctx.fillStyle = '#aab0a7'; ctx.fillRect(x + 15, y - 24, 9, 6);
  }

  _drawCart(ctx, x, y, french) {
    ctx.fillStyle = '#302e2a'; ctx.fillRect(x - 21, y + 12, 51, 6);
    ctx.fillStyle = french ? '#986a43' : '#74634d'; ctx.fillRect(x - 18, y - 3, 39, 15);
    ctx.fillStyle = '#bd9a69'; ctx.fillRect(x - 15, y - 9, 33, 9);
    ctx.fillStyle = '#252d2d'; ctx.fillRect(x - 15, y + 15, 12, 9); ctx.fillRect(x + 9, y + 15, 12, 9);
    ctx.fillStyle = '#a6a08b'; ctx.fillRect(x - 12, y + 18, 6, 3); ctx.fillRect(x + 12, y + 18, 6, 3);
  }

  _drawBarricade(ctx, x, y, french) {
    ctx.fillStyle = '#4b4135'; ctx.fillRect(x - 27, y + 12, 63, 9);
    ctx.fillStyle = french ? '#9a7249' : '#77634b';
    ctx.fillRect(x - 24, y - 6, 9, 27); ctx.fillRect(x + 12, y - 6, 9, 27);
    ctx.fillRect(x - 27, y - 3, 63, 9);
    ctx.fillStyle = '#c29a63'; ctx.fillRect(x - 21, y, 51, 3);
  }

  _drawFlag(ctx, x, y, stripes) {
    ctx.fillStyle = '#363d3a'; ctx.fillRect(x, y, 6, 60);
    ctx.fillStyle = '#c4b08b'; ctx.fillRect(x - 3, y - 3, 12, 6);
    stripes.forEach((color, index) => {
      ctx.fillStyle = color; ctx.fillRect(x + 6, y + index * 9, 33, 9);
    });
    ctx.fillStyle = '#3c4542'; ctx.fillRect(x + 36, y + 3, 3, 3);
  }

  _drawSign(ctx, x, y, w, h, bg, fg, label) {
    ctx.fillStyle = '#34332d'; ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fg; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.fillStyle = '#574d40'; ctx.fillRect(x + 9, y + h, 6, 12); ctx.fillRect(x + w - 15, y + h, 6, 12);
  }

  _drawCrowd(ctx, x, y, color, french) {
    const clothes = french ? [color, '#a9473b', '#4f6472', '#c0a477'] : [color, '#a64239', '#64716c', '#424f58'];
    for (let i = 0; i < 7; i++) {
      const px = x + (i % 4) * 15 - 22;
      const py = y + Math.floor(i / 4) * 18;
      ctx.fillStyle = '#292f30'; ctx.fillRect(px - 6, py + 13, 15, 5);
      ctx.fillStyle = clothes[i % clothes.length]; ctx.fillRect(px - 6, py + 1, 12, 15);
      ctx.fillStyle = '#d0aa7c'; ctx.fillRect(px - 4, py - 8, 9, 9);
      ctx.fillStyle = french ? '#493d36' : '#343b3c'; ctx.fillRect(px - 6, py - 10, 12, 4);
      ctx.fillStyle = '#303638'; ctx.fillRect(px - 6, py + 12, 5, 6); ctx.fillRect(px + 2, py + 12, 5, 6);
    }
  }

  _drawPoi(ctx, scene, completed, nearby) {
    for (const poi of scene.poi) {
      const done = completed.has(poi.id);
      const pulse = Math.round(Math.sin(this.time * 3.3 + poi.x) * 3);
      ctx.save();
      ctx.fillStyle = '#17201f66'; ctx.fillRect(poi.x - 30, poi.y + 27, 63, 9);
      this._drawLandmark(ctx, poi, scene.palette);

      // Four-corner focus frame replaces the old smooth circular marker.
      const size = 39 + (done ? 0 : pulse);
      const left = Math.round(poi.x - size), top = Math.round(poi.y - size);
      const frameColor = done ? '#b4c99c' : (nearby?.id === poi.id ? '#ffe7a0' : '#f2d28d');
      ctx.fillStyle = frameColor;
      const t = nearby?.id === poi.id ? 6 : 4;
      ctx.fillRect(left, top, 15, t); ctx.fillRect(left, top, t, 15);
      ctx.fillRect(poi.x + size - 15, top, 15, t); ctx.fillRect(poi.x + size - t, top, t, 15);
      ctx.fillRect(left, poi.y + size - t, 15, t); ctx.fillRect(left, poi.y + size - 15, t, 15);
      ctx.fillRect(poi.x + size - 15, poi.y + size - t, 15, t); ctx.fillRect(poi.x + size - t, poi.y + size - 15, t, 15);

      ctx.fillStyle = done ? '#66886b' : '#d09b4f';
      ctx.fillRect(poi.x + 27, poi.y - 33, 21, 21);
      ctx.fillStyle = '#222b2a'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(done ? '✓' : '!', poi.x + 37, poi.y - 22);

      ctx.restore();
    }
  }

  _updatePoiLabels(scene, completed, nearby, cameraX, cameraY) {
    if (!this.labelLayer) return;
    if (this.labelSceneId !== scene.id) {
      this.labelLayer.replaceChildren();
      this.poiLabelNodes.clear();
      for (const poi of scene.poi) {
        const label = document.createElement('div');
        label.className = 'poi-label';
        label.textContent = poi.short;
        this.labelLayer.appendChild(label);
        this.poiLabelNodes.set(poi.id, label);
      }
      this.labelSceneId = scene.id;
    }

    for (const poi of scene.poi) {
      const label = this.poiLabelNodes.get(poi.id);
      if (!label) continue;
      const left = poi.x - cameraX;
      const top = poi.y - cameraY + 54;
      label.style.left = `${left}px`;
      label.style.top = `${top}px`;
      label.hidden = left < -150 || left > this.width + 150 || top < -30 || top > this.height + 10;
      label.dataset.state = completed.has(poi.id) ? 'completed' : (nearby?.id === poi.id ? 'nearby' : 'available');
    }
  }

  _drawLandmark(ctx, poi, palette) {
    const russian = palette === 'russia';
    const stone = russian ? '#7b8580' : '#a88b68';
    const roof = russian ? '#515e60' : '#80584a';
    const x = Math.round(poi.x), y = Math.round(poi.y);
    ctx.save();
    // Every landmark is built from square tiles: no vector circles or soft gradients.
    if (poi.id === 'estates-general' || poi.id === 'provisional') {
      // Assembly hall: broad roof, central pediment and a line of columns.
      ctx.fillStyle = '#292f2d'; ctx.fillRect(x - 51, y + 15, 102, 12);
      ctx.fillStyle = stone; ctx.fillRect(x - 45, y - 15, 90, 33);
      ctx.fillStyle = roof; ctx.fillRect(x - 51, y - 24, 102, 9);
      ctx.fillStyle = '#d8c49e'; ctx.fillRect(x - 48, y - 30, 96, 6);
      ctx.fillStyle = stone; ctx.fillRect(x - 12, y - 39, 24, 9);
      for (let dx = -33; dx <= 33; dx += 22) {
        ctx.fillStyle = '#e0cfaa'; ctx.fillRect(x + dx - 5, y - 9, 10, 27);
        ctx.fillStyle = '#655e50'; ctx.fillRect(x + dx - 2, y - 6, 4, 21);
      }
      ctx.fillStyle = '#a64337'; ctx.fillRect(x - 6, y - 54, 12, 18);
      ctx.fillRect(x + 6, y - 51, 21, 9);
    } else if (poi.id === 'great-fear') {
      // Rural farmhouse and hay stacks recall the peasant uprisings.
      ctx.fillStyle = '#2d3531'; ctx.fillRect(x - 45, y + 12, 90, 12);
      ctx.fillStyle = '#b18b58'; ctx.fillRect(x - 33, y - 9, 66, 27);
      ctx.fillStyle = '#754e3a'; ctx.fillRect(x - 39, y - 18, 78, 12);
      ctx.fillStyle = '#d3b77e'; ctx.fillRect(x - 30, y - 27, 60, 9);
      ctx.fillStyle = '#39423d'; ctx.fillRect(x - 9, y + 3, 18, 15);
      ctx.fillStyle = '#e0c98f'; ctx.fillRect(x + 36, y + 3, 18, 18);
      ctx.fillRect(x + 39, y, 12, 3);
    } else if (poi.id === 'rights') {
      // A stone plinth and a large parchment tablet represent the declaration.
      ctx.fillStyle = '#303735'; ctx.fillRect(x - 42, y + 18, 84, 12);
      ctx.fillStyle = stone; ctx.fillRect(x - 36, y + 9, 72, 9);
      ctx.fillStyle = '#d8c69f'; ctx.fillRect(x - 24, y - 39, 48, 48);
      ctx.fillStyle = '#8b6e4e'; ctx.fillRect(x - 30, y - 45, 60, 9);
      ctx.fillRect(x - 30, y - 39, 6, 48); ctx.fillRect(x + 24, y - 39, 6, 48);
      ctx.fillStyle = '#79634a';
      for (let yy = y - 27; yy < y - 3; yy += 9) ctx.fillRect(x - 15, yy, 30, 3);
      ctx.fillStyle = '#a84437'; ctx.fillRect(x - 3, y - 54, 6, 12);
    } else if (poi.id === 'constitutional') {
      ctx.fillStyle = '#2d3431'; ctx.fillRect(x - 48, y + 15, 96, 12);
      ctx.fillStyle = '#c7b18b'; ctx.fillRect(x - 42, y - 18, 84, 33);
      ctx.fillStyle = '#80594a'; ctx.fillRect(x - 48, y - 27, 96, 9);
      for (let dx = -30; dx <= 30; dx += 20) {
        ctx.fillStyle = '#e0cfaa'; ctx.fillRect(x + dx - 5, y - 12, 10, 27);
      }
      ctx.fillStyle = '#a84437'; ctx.fillRect(x - 3, y - 45, 6, 18);
      ctx.fillStyle = '#315c82'; ctx.fillRect(x + 3, y - 42, 21, 9);
    } else if (poi.id === 'republic') {
      // Liberty column and a raised tricolour banner.
      ctx.fillStyle = '#333a37'; ctx.fillRect(x - 36, y + 18, 72, 12);
      ctx.fillStyle = '#b9a27a'; ctx.fillRect(x - 27, y + 9, 54, 9);
      ctx.fillStyle = '#d8c49d'; ctx.fillRect(x - 15, y - 30, 30, 39);
      ctx.fillStyle = '#8c7050'; ctx.fillRect(x - 21, y - 36, 42, 9);
      ctx.fillStyle = '#d8c49d'; ctx.fillRect(x - 9, y - 45, 18, 15);
      ctx.fillStyle = '#a84437'; ctx.fillRect(x + 18, y - 39, 6, 39);
      ctx.fillStyle = '#315c82'; ctx.fillRect(x + 24, y - 36, 24, 9);
      ctx.fillStyle = '#f0e6ce'; ctx.fillRect(x + 24, y - 27, 24, 9);
      ctx.fillStyle = '#a84437'; ctx.fillRect(x + 24, y - 18, 24, 9);
    } else if (poi.id === 'king-execution') {
      // The guillotine is a recognizable pixel-art silhouette.
      ctx.fillStyle = '#343a37'; ctx.fillRect(x - 45, y + 18, 90, 9);
      ctx.fillStyle = '#76513e'; ctx.fillRect(x - 36, y - 39, 9, 60);
      ctx.fillRect(x + 27, y - 39, 9, 60);
      ctx.fillStyle = '#986e4b'; ctx.fillRect(x - 36, y - 39, 72, 9);
      ctx.fillStyle = '#aab0a4'; ctx.fillRect(x - 6, y - 30, 12, 30);
      ctx.fillStyle = '#363b38'; ctx.fillRect(x - 30, y + 3, 60, 9);
      ctx.fillStyle = '#c3a47a'; ctx.fillRect(x - 9, y + 6, 18, 6);
    } else if (poi.id === 'bloody-sunday') {
      // Winter street memorial with a small crowd and a red warning banner.
      ctx.fillStyle = '#333b3d'; ctx.fillRect(x - 48, y + 15, 96, 12);
      ctx.fillStyle = '#9da49a'; ctx.fillRect(x - 36, y - 18, 72, 33);
      ctx.fillStyle = '#566266'; ctx.fillRect(x - 42, y - 27, 84, 9);
      ctx.fillStyle = '#bcb8a5'; ctx.fillRect(x - 12, y - 39, 24, 12);
      ctx.fillStyle = '#a33e36'; ctx.fillRect(x + 27, y - 45, 6, 27);
      ctx.fillRect(x + 33, y - 42, 24, 12);
      for (let dx = -24; dx <= 24; dx += 24) {
        ctx.fillStyle = '#3a484c'; ctx.fillRect(x + dx - 6, y - 9, 12, 24);
        ctx.fillStyle = '#c0a27f'; ctx.fillRect(x + dx - 6, y - 15, 12, 9);
      }
    } else if (poi.id === 'february') {
      // Worker barricade with a red cloth flag.
      ctx.fillStyle = '#343b39'; ctx.fillRect(x - 48, y + 15, 96, 12);
      ctx.fillStyle = '#7b654c'; ctx.fillRect(x - 42, y - 12, 84, 27);
      ctx.fillStyle = '#a18a65'; ctx.fillRect(x - 39, y - 18, 78, 9);
      ctx.fillStyle = '#a43e36'; ctx.fillRect(x + 21, y - 48, 6, 30);
      ctx.fillRect(x + 27, y - 45, 30, 15);
      ctx.fillStyle = '#d7c6a1'; ctx.fillRect(x - 9, y - 3, 18, 18);
    } else if (poi.id === 'bastille') {
      ctx.fillStyle = '#292f2d'; ctx.fillRect(x - 42, y - 14, 84, 54);
      ctx.fillStyle = stone; ctx.fillRect(x - 39, y - 24, 78, 54);
      ctx.fillStyle = roof; ctx.fillRect(x - 45, y - 33, 90, 15);
      for (const dx of [-30, 0, 30]) {
        ctx.fillStyle = roof; ctx.fillRect(x + dx - 12, y - 48, 24, 30);
        ctx.fillStyle = '#bba17a'; ctx.fillRect(x + dx - 6, y - 42, 12, 9);
        ctx.fillStyle = '#343d3e'; ctx.fillRect(x + dx - 6, y - 21, 12, 9);
      }
      ctx.fillStyle = '#d4c09b'; ctx.fillRect(x - 18, y - 6, 36, 33);
      ctx.fillStyle = '#454846'; ctx.fillRect(x - 9, y + 3, 18, 24);
      ctx.fillStyle = '#ead9b8'; ctx.fillRect(x - 3, y + 6, 3, 15);
    } else if (poi.id === 'assembly' || poi.id === 'soviet') {
      ctx.fillStyle = '#252c2c'; ctx.fillRect(x - 48, y + 18, 96, 12);
      ctx.fillStyle = stone; ctx.fillRect(x - 45, y - 15, 90, 39);
      ctx.fillStyle = roof; ctx.fillRect(x - 51, y - 24, 102, 9);
      for (let dx = -33; dx <= 33; dx += 22) {
        ctx.fillStyle = russian ? '#a64138' : '#d8c69d'; ctx.fillRect(x + dx - 5, y - 6, 10, 30);
        ctx.fillStyle = '#d0bd9c'; ctx.fillRect(x + dx - 8, y - 9, 16, 5);
      }
      ctx.fillStyle = stone; ctx.fillRect(x - 9, y - 36, 18, 12);
      ctx.fillRect(x - 54, y - 24, 108, 6);
    } else if (poi.id === 'terror') {
      ctx.fillStyle = '#393b37'; ctx.fillRect(x - 45, y + 12, 90, 12);
      ctx.fillStyle = '#765845'; ctx.fillRect(x - 33, y - 27, 66, 39);
      ctx.fillStyle = '#d0b98f'; ctx.fillRect(x - 36, y - 33, 72, 9);
      ctx.fillStyle = '#2b3030'; ctx.fillRect(x - 24, y - 21, 48, 9);
      ctx.fillStyle = '#b88d5d'; ctx.fillRect(x - 3, y - 18, 6, 30);
      ctx.fillStyle = '#3c2d29'; ctx.fillRect(x - 30, y + 24, 60, 6);
    } else if (poi.id === 'tsar') {
      ctx.fillStyle = '#303b3c'; ctx.fillRect(x - 48, y + 12, 96, 15);
      ctx.fillStyle = stone; ctx.fillRect(x - 42, y - 18, 84, 36);
      ctx.fillStyle = roof; ctx.fillRect(x - 51, y - 30, 102, 12);
      ctx.fillStyle = '#c8b998'; ctx.fillRect(x - 42, y - 36, 84, 6);
      for (let dx = -30; dx <= 30; dx += 20) {
        ctx.fillStyle = '#303d40'; ctx.fillRect(x + dx - 4, y - 9, 8, 18);
        ctx.fillStyle = '#c6b895'; ctx.fillRect(x + dx - 7, y - 12, 14, 4);
      }
      ctx.fillStyle = '#a74138'; ctx.fillRect(x - 6, y - 48, 12, 18);
      ctx.fillStyle = '#e0bd75'; ctx.fillRect(x - 3, y - 54, 6, 6);
    } else if (poi.id === 'war' || poi.id === 'world-war' || poi.id === 'civil-war') {
      ctx.fillStyle = '#303b3e'; ctx.fillRect(x - 45, y + 12, 90, 12);
      ctx.fillStyle = '#526369'; ctx.fillRect(x - 39, y - 18, 78, 33);
      ctx.fillStyle = '#a74439'; ctx.fillRect(x - 42, y - 27, 84, 9);
      ctx.fillStyle = '#d1c4a6'; ctx.fillRect(x - 27, y - 9, 54, 6);
      ctx.fillRect(x - 6, y - 21, 12, 36);
      ctx.fillStyle = '#303b3e'; ctx.fillRect(x - 18, y + 15, 12, 9); ctx.fillRect(x + 6, y + 15, 12, 9);
    } else if (poi.id === 'october') {
      ctx.fillStyle = '#303a3d'; ctx.fillRect(x - 54, y + 15, 108, 12);
      ctx.fillStyle = '#879189'; ctx.fillRect(x - 48, y - 24, 96, 42);
      ctx.fillStyle = '#a53e35'; ctx.fillRect(x - 54, y - 33, 108, 12);
      ctx.fillStyle = '#d9c69e'; ctx.fillRect(x - 9, y - 45, 18, 12);
      ctx.fillStyle = '#303a3d'; ctx.fillRect(x - 12, y - 9, 24, 27);
      ctx.fillStyle = '#b8ad91'; ctx.fillRect(x - 6, y - 6, 12, 21);
      ctx.fillStyle = '#a53e35'; ctx.fillRect(x + 24, y - 54, 6, 30);
      ctx.fillRect(x + 30, y - 54, 24, 15);
    } else {
      ctx.fillStyle = '#303a3d'; ctx.fillRect(x - 42, y + 15, 84, 12);
      ctx.fillStyle = stone; ctx.fillRect(x - 36, y - 21, 72, 39);
      ctx.fillStyle = roof; ctx.fillRect(x - 42, y - 30, 84, 9);
      ctx.fillStyle = '#d0bd9c'; ctx.fillRect(x - 12, y - 9, 24, 27);
    }
    ctx.restore();
  }

  _drawActors(ctx, player, phase, npcManager, playerSprites, scene) {
    const people = npcManager.characters[phase] || [];
    const placements = npcPlacementsForScene(scene, people);
    const actors = placements.map(({ person, position }) => ({
      type: 'npc', person, position, depth: position.y
    }));
    actors.push({ type: 'player', position: player, depth: player.y });
    actors.sort((a, b) => a.depth - b.depth);

    for (const actor of actors) {
      if (actor.type === 'player') this._drawPlayer(ctx, player, playerSprites);
      else this._drawAmbientNpc(ctx, actor.person, actor.position, player, phase, npcManager);
    }
  }

  _drawAmbientNpc(ctx, person, position, player, phase, npcManager) {
    const poseIndex = npcManager.getPoseIndex(person, player, position);
    const isSpeaking = poseIndex === 2;
    // Pose 1: parado; pose 2: jogador por perto; pose 3: personagem falando.
    const image = npcManager.getPose(person, poseIndex);
    const baseY = position.y + 29;

    ctx.save();
    ctx.fillStyle = '#19212088';
    ctx.beginPath();
    ctx.ellipse(position.x, position.y + 27, 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (image) {
      const maxHeight = isSpeaking ? 60 : 56;
      const aspect = image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight : 0.62;
      const targetWidth = Math.min(68, maxHeight * aspect);
      const targetHeight = targetWidth / aspect;
      // Reduz a resolução em apenas 3% antes de ampliar novamente: o NPC
      // ganha textura pixelada quase imperceptível, sem mudar tamanho ou pose.
      const spriteX = Math.round(position.x - targetWidth / 2);
      const spriteY = Math.round(baseY - targetHeight);
      const spriteWidth = Math.round(targetWidth);
      const spriteHeight = Math.round(targetHeight);
      this._drawWithPixelation(ctx, {
        x: spriteX, y: spriteY, width: spriteWidth, height: spriteHeight
      }, NPC_PIXELATION, (spriteCtx) => {
        spriteCtx.drawImage(image, spriteX, spriteY, spriteWidth, spriteHeight);
      });
    } else {
      const bounds = { x: position.x - 20, y: position.y - 40, width: 40, height: 72 };
      this._drawWithPixelation(ctx, bounds, NPC_PIXELATION, (spriteCtx) => {
        spriteCtx.translate(position.x, position.y);
        spriteCtx.scale(1.55, 1.55);
        this._drawPixelPerson(spriteCtx, 0, 0, person.color, person.accent, phase === 'russia');
      });
    }
    ctx.restore();
  }

  _drawPixelPerson(ctx, x, y, coat, accent, russian = false) {
    ctx.fillStyle = '#293131'; ctx.fillRect(x - 9, y + 14, 8, 6); ctx.fillRect(x + 2, y + 14, 8, 6);
    ctx.fillStyle = '#344047'; ctx.fillRect(x - 12, y + 4, 24, 15);
    ctx.fillStyle = coat; ctx.fillRect(x - 10, y - 4, 20, 19);
    ctx.fillStyle = accent; ctx.fillRect(x - 12, y - 6, 24, 6);
    ctx.fillStyle = '#d5ad82'; ctx.fillRect(x - 7, y - 19, 15, 15);
    ctx.fillStyle = '#493b34'; ctx.fillRect(x - 9, y - 22, 18, 6);
    if (russian) { ctx.fillStyle = '#a83f37'; ctx.fillRect(x - 9, y - 25, 18, 4); }
  }

  _drawWithPixelation(ctx, bounds, percentage, draw) {
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const reduction = Math.max(0.5, 1 - percentage / 100);
    const lowWidth = Math.max(1, Math.round(width * reduction));
    const lowHeight = Math.max(1, Math.round(height * reduction));

    this.spriteCanvas.width = lowWidth;
    this.spriteCanvas.height = lowHeight;
    const spriteCtx = this.spriteCtx;
    spriteCtx.imageSmoothingEnabled = true;
    spriteCtx.clearRect(0, 0, lowWidth, lowHeight);
    spriteCtx.setTransform(
      lowWidth / width, 0, 0, lowHeight / height,
      -bounds.x * lowWidth / width, -bounds.y * lowHeight / height
    );
    draw(spriteCtx);

    // A ampliação por vizinho mais próximo evidencia somente a pequena
    // diferença de resolução definida para cada personagem.
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.spriteCanvas, 0, 0, lowWidth, lowHeight,
      bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  _drawPlayer(ctx, player, playerSprites) {
    const playerX = Math.round(player.x), playerY = Math.round(player.y);
    const image = playerSprites?.getSprite(player);

    if (image) {
      // Mantém a sombra do jogador no mesmo lugar e aplica o efeito somente à arte.
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.scale(1.22, 1.22);
      ctx.fillStyle = '#17201f99';

      ctx.beginPath();
      ctx.ellipse(0.5, 19, 19, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const imageWidth = image.naturalWidth || 1;
      const imageHeight = image.naturalHeight || 1;
      const fitScale = Math.min(34 / imageWidth, 54 / imageHeight);
      const targetWidth = imageWidth * fitScale;
      const targetHeight = imageHeight * fitScale;
      const bounds = {
        x: playerX - targetWidth / 2,
        y: playerY + 23 - targetHeight,
        width: targetWidth,
        height: targetHeight
      };
      this._drawWithPixelation(ctx, bounds, PLAYER_PIXELATION, (spriteCtx) => {
        spriteCtx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
      });
      return;
    }

    // Quando player/ não contém uma imagem utilizamos exatamente o personagem
    // procedural anterior, agora com uma redução de resolução de apenas 4%.
    const bounds = { x: playerX - 22, y: playerY - 40, width: 44, height: 68 };
    this._drawWithPixelation(ctx, bounds, PLAYER_PIXELATION, (spriteCtx) => {
      this._drawProceduralPlayer(spriteCtx, playerX, playerY);
    });
  }

  _drawProceduralPlayer(ctx, playerX, playerY) {
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.scale(1.22, 1.22);
    const x = 0, y = 0;
    ctx.fillStyle = '#17201f99'; ctx.fillRect(x - 15, y + 16, 33, 9);
    ctx.fillStyle = '#30383a'; ctx.fillRect(x - 12, y + 8, 9, 12); ctx.fillRect(x + 3, y + 8, 9, 12);
    ctx.fillStyle = '#6a4836'; ctx.fillRect(x - 12, y + 17, 9, 4); ctx.fillRect(x + 3, y + 17, 9, 4);
    ctx.fillStyle = '#263943'; ctx.fillRect(x - 15, y - 8, 30, 21);
    ctx.fillStyle = '#3c5964'; ctx.fillRect(x - 12, y - 12, 24, 18);
    ctx.fillStyle = '#d1a45f'; ctx.fillRect(x - 15, y - 5, 6, 15); ctx.fillRect(x + 9, y - 5, 6, 15);
    ctx.fillStyle = '#e2bd8d'; ctx.fillRect(x - 9, y - 27, 18, 18);
    ctx.fillStyle = '#514239'; ctx.fillRect(x - 12, y - 30, 24, 9);
    ctx.fillRect(x - 9, y - 21, 18, 3);
    ctx.fillStyle = '#29343a'; ctx.fillRect(x - 6, y - 18, 3, 3); ctx.fillRect(x + 3, y - 18, 3, 3);
    ctx.fillStyle = '#e7c79a'; ctx.fillRect(x - 3, y - 12, 6, 3);
    ctx.fillStyle = '#c49a58'; ctx.fillRect(x - 3, y - 3, 6, 12);
    ctx.restore();
  }
}
