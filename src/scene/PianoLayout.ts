import * as THREE from 'three';

export interface PianoKeyLayout {
  midi: number;
  isBlack: boolean;
  position: THREE.Vector3;
  size: THREE.Vector3; // width, height, depth
}

const WHITE_KEY_WIDTH = 0.8;
const WHITE_KEY_DEPTH = 3.5;
const WHITE_KEY_HEIGHT = 0.25;
const BLACK_KEY_WIDTH = 0.5;
const BLACK_KEY_DEPTH = 2.3;
const BLACK_KEY_HEIGHT = 0.45;
const GAP = 0.05;

const BLACK_INDICES = new Set([1, 3, 6, 8, 10]);

/**
 * Compute flat piano key positions for 88 keys (MIDI 21-108).
 * White keys are laid out linearly along X; black keys sit between them.
 * The piano is centered around the origin on the X axis, at Y=0.
 */
export function computePianoLayout(): PianoKeyLayout[] {
  const keys: PianoKeyLayout[] = [];

  const whiteKeyX: Map<number, number> = new Map();
  let whiteIndex = 0;
  for (let midi = 21; midi <= 108; midi++) {
    if (!BLACK_INDICES.has(midi % 12)) {
      whiteKeyX.set(midi, whiteIndex);
      whiteIndex++;
    }
  }

  const totalWhite = whiteIndex;
  const totalWidth = totalWhite * (WHITE_KEY_WIDTH + GAP) - GAP;
  const offsetX = -totalWidth / 2;

  for (let midi = 21; midi <= 108; midi++) {
    const chromaticIndex = midi % 12;
    const isBlack = BLACK_INDICES.has(chromaticIndex);

    if (!isBlack) {
      const wIdx = whiteKeyX.get(midi)!;
      const x = offsetX + wIdx * (WHITE_KEY_WIDTH + GAP) + WHITE_KEY_WIDTH / 2;
      keys.push({
        midi,
        isBlack: false,
        position: new THREE.Vector3(x, WHITE_KEY_HEIGHT / 2, 0),
        size: new THREE.Vector3(WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT, WHITE_KEY_DEPTH),
      });
    } else {
      const leftWhiteIdx = whiteKeyX.get(midi - 1);
      const rightWhiteIdx = whiteKeyX.get(midi + 1);

      let x: number;
      if (leftWhiteIdx !== undefined && rightWhiteIdx !== undefined) {
        const leftX = offsetX + leftWhiteIdx * (WHITE_KEY_WIDTH + GAP) + WHITE_KEY_WIDTH / 2;
        const rightX = offsetX + rightWhiteIdx * (WHITE_KEY_WIDTH + GAP) + WHITE_KEY_WIDTH / 2;
        x = (leftX + rightX) / 2;
      } else if (leftWhiteIdx !== undefined) {
        x = offsetX + leftWhiteIdx * (WHITE_KEY_WIDTH + GAP) + WHITE_KEY_WIDTH + GAP / 2;
      } else {
        x = offsetX;
      }

      keys.push({
        midi,
        isBlack: true,
        position: new THREE.Vector3(x, BLACK_KEY_HEIGHT / 2, -(WHITE_KEY_DEPTH - BLACK_KEY_DEPTH) / 2),
        size: new THREE.Vector3(BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT, BLACK_KEY_DEPTH),
      });
    }
  }

  return keys;
}
