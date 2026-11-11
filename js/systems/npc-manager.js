import { CHARACTERS } from '../data/characters.js';

/**
 * Fontes por contexto:
 * - cenario/: sprites próprios para aparecer no mapa.
 * - dialogo/: retratos próprios para os quadros de conversa.
 *
 * Compatibilidade: se a nova imagem ainda não existir, tenta os caminhos antigos
 * (personagens/<id>/poseN.png e subpastas pose N/). Assim o jogo continua abrindo
 * enquanto o usuário substitui gradualmente os arquivos antigos.
 */
export function poseSources(folder, poseNumber, context = 'cenario') {
  const compact = `pose${poseNumber}`;
  const spaced = `pose ${poseNumber}`;
  const contextFolder = context === 'dialogo' || context === 'dialogue' ? 'dialogo' : 'cenario';
  const root = `personagens/${folder}`;
  const paths = [
    `${root}/${contextFolder}/${compact}.png`,
    `${root}/${contextFolder}/${spaced}.png`,
    `${root}/${contextFolder}/${compact}/imagem.png`,
    `${root}/${contextFolder}/${spaced}/imagem.png`,
    `${root}/${contextFolder}/${compact}/image.png`,
    `${root}/${contextFolder}/${spaced}/image.png`,
    `${root}/${contextFolder}/${compact}/sprite.png`,
    `${root}/${contextFolder}/${spaced}/sprite.png`,
    `${root}/${contextFolder}/imagem${poseNumber}.png`
  ];

  // Compatibilidade com a organização anterior, em que havia só uma pose por número.
  paths.push(`${root}/${compact}.png`);
  for (const directory of [compact, spaced]) {
    for (const filename of [`${compact}.png`, 'imagem.png', 'image.png', 'sprite.png']) {
      paths.push(`${root}/${directory}/${filename}`);
    }
  }
  return [...new Set(paths)];
}

export class NpcManager {
  constructor() {
    this.characters = { france: [], russia: [] };
    this.bags = { france: [], russia: [] };
    this.lastPicked = { france: null, russia: null };
    this.activeCharacterId = null;
    this._loadAll();
  }

  _loadPose(folder, poseNumber, context = 'cenario') {
    const image = new Image();
    const sources = poseSources(folder, poseNumber, context);
    let sourceIndex = 0;

    image.onload = () => {
      if (image.dataset) {
        image.dataset.loaded = 'true';
        image.dataset.context = context;
        image.dataset.pose = String(poseNumber);
      }
    };
    image.onerror = () => {
      sourceIndex += 1;
      if (sourceIndex < sources.length) {
        image.src = sources[sourceIndex];
      } else if (image.dataset) {
        image.dataset.missing = 'true';
      }
    };

    image.src = sources[sourceIndex];
    return image;
  }

  _loadAll() {
    for (const [phase, list] of Object.entries(CHARACTERS)) {
      this.characters[phase] = list.map((character, characterIndex) => {
        const scenePoses = [];
        const dialoguePoses = [];
        for (let pose = 1; pose <= 3; pose += 1) {
          scenePoses.push(this._loadPose(character.folder, pose, 'cenario'));
          dialoguePoses.push(this._loadPose(character.folder, pose, 'dialogo'));
        }
        return {
          ...character,
          characterIndex,
          scenePoses,
          dialoguePoses,
          // Alias legado para integrações/testes anteriores: representa o sprite do mapa.
          poses: scenePoses
        };
      });
    }
  }

  _refill(phase) {
    const bag = [...this.characters[phase]];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[bag.length - 1]?.id === this.lastPicked[phase]) {
      [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    this.bags[phase] = bag;
  }

  pick(phase) {
    if (!this.bags[phase].length) this._refill(phase);
    const character = this.bags[phase].pop();
    this.lastPicked[phase] = character.id;
    this.activeCharacterId = character.id;
    return character;
  }

  getPose(character, preferredIndex = 0, context = 'cenario') {
    const poseSet = (context === 'dialogo' || context === 'dialogue')
      ? character.dialoguePoses
      : (character.scenePoses || character.poses);
    if (!poseSet) return null;
    const preferred = poseSet[preferredIndex];
    if (preferred?.complete && preferred.naturalWidth > 0) return preferred;
    return poseSet.find(image => image.complete && image.naturalWidth > 0) || null;
  }

  getPoseIndex(character, player, position) {
    if (this.activeCharacterId === character.id) return 2;
    return Math.hypot(player.x - position.x, player.y - position.y) <= 132 ? 1 : 0;
  }

  clearActive() { this.activeCharacterId = null; }

  reset(phase) {
    this.bags[phase] = [];
    this.lastPicked[phase] = null;
    this.clearActive();
  }
}
