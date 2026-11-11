/**
 * Sprites opcionais do jogador.
 *
 * A pasta player/ pode conter apenas player.png (sprite estático), ou versões
 * direcionais/animações opcionais. A ausência dos arquivos não é um erro: o
 * Renderer continua usando o jogador procedural original.
 */
const DIRECTION_FILES = {
  up: ['back.png', 'up.png'],
  down: ['front.png', 'down.png'],
  left: ['left.png'],
  right: ['right.png']
};

export const PLAYER_SPRITE_FILES = Object.freeze({
  idle: ['player.png', 'idle.png', 'pose1.png', 'sprite.png'],
  up: DIRECTION_FILES.up,
  down: DIRECTION_FILES.down,
  left: DIRECTION_FILES.left,
  right: DIRECTION_FILES.right,
  walk1: ['walk1.png', 'pose2.png'],
  walk2: ['walk2.png', 'pose3.png'],
  upWalk1: ['back-walk1.png', 'up-walk1.png'],
  upWalk2: ['back-walk2.png', 'up-walk2.png'],
  downWalk1: ['front-walk1.png', 'down-walk1.png'],
  downWalk2: ['front-walk2.png', 'down-walk2.png'],
  leftWalk1: ['left-walk1.png'],
  leftWalk2: ['left-walk2.png'],
  rightWalk1: ['right-walk1.png'],
  rightWalk2: ['right-walk2.png']
});

export function playerSpritePaths(files = PLAYER_SPRITE_FILES) {
  return Object.fromEntries(Object.entries(files).map(([key, names]) => [
    key, names.map(name => `player/${name}`)
  ]));
}

export class PlayerSpriteManager {
  constructor() {
    this.images = {};
    const paths = playerSpritePaths();
    for (const [key, sources] of Object.entries(paths)) {
      this.images[key] = this._loadOptional(sources);
    }
  }

  _loadOptional(sources) {
    const image = new Image();
    let index = 0;
    image.onload = () => {
      if (image.dataset) image.dataset.loaded = 'true';
    };
    image.onerror = () => {
      index += 1;
      if (index < sources.length) image.src = sources[index];
      else if (image.dataset) image.dataset.missing = 'true';
    };
    image.src = sources[0];
    return image;
  }

  _loaded(key) {
    const image = this.images[key];
    return image?.complete && image.naturalWidth > 0 ? image : null;
  }

  getSprite(player = {}) {
    const facing = DIRECTION_FILES[player.facing] ? player.facing : 'down';
    if (player.moving) {
      const frame = Math.floor((player.animationTime || 0) * 7) % 2 + 1;
      const directionalWalk = this._loaded(`${facing}Walk${frame}`);
      if (directionalWalk) return directionalWalk;
      const walkFrame = this._loaded(`walk${frame}`);
      if (walkFrame) return walkFrame;
    }
    const directional = this._loaded(facing);
    return directional || this._loaded('idle');
  }
}
