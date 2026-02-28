import * as THREE from 'three';
import { NoteNode, PITCH_COLORS } from './NoteNode';
import { ViewMode } from './ViewManager';
import { EventBus } from '../utils/eventBus';

// Chromatic indices reordered by circle of fifths: C→G→D→A→E→B→F#→C#→G#→D#→A#→F
const FIFTHS_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const TRANSITION_DURATION = 1000; // ms

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class SpiralConnections {
  private scene: THREE.Scene;
  private nodes: NoteNode[];
  private line: THREE.Line | null = null;
  private currentMode: ViewMode = 'spiral';

  // Line transition animation state
  private animating = false;
  private animStartTime = 0;
  private startPositions: number[] = [];
  private targetPositions: number[] = [];
  private startColors: number[] = [];
  private targetColors: number[] = [];

  constructor(scene: THREE.Scene, nodes: NoteNode[], bus: EventBus) {
    this.scene = scene;
    this.nodes = nodes;

    this.rebuild();

    bus.on('view:modeChanged', ({ prevMode, newMode }: { prevMode: ViewMode; newMode: ViewMode }) => {
      this.currentMode = newMode;
      const bothNonConcentric = prevMode !== 'concentric' && newMode !== 'concentric';
      if (bothNonConcentric) {
        this.animateTransition(prevMode, newMode);
      }
      // When concentric is involved, node positions animate via ViewManager
      // and view:positionsUpdated will rebuild the line each frame
    });

    bus.on('view:positionsUpdated', () => {
      if (!this.animating) {
        this.rebuild();
      }
    });
  }

  /** Returns nodes reordered by fifths within each octave */
  private getFifthsOrderedNodes(): NoteNode[] {
    // Build a rank map: chromaticIndex → position in fifths traversal
    const fifthsRank = new Map<number, number>();
    for (let i = 0; i < FIFTHS_ORDER.length; i++) {
      fifthsRank.set(FIFTHS_ORDER[i], i);
    }

    // Group nodes by octave
    const byOctave = new Map<number, NoteNode[]>();
    for (const node of this.nodes) {
      const oct = node.noteInfo.octave;
      if (!byOctave.has(oct)) byOctave.set(oct, []);
      byOctave.get(oct)!.push(node);
    }

    // Sort octaves ascending, sort nodes within each octave by fifths rank
    const sortedOctaves = [...byOctave.keys()].sort((a, b) => a - b);
    const ordered: NoteNode[] = [];
    for (const oct of sortedOctaves) {
      const octNodes = byOctave.get(oct)!;
      octNodes.sort((a, b) => {
        return fifthsRank.get(a.noteInfo.chromaticIndex)! - fifthsRank.get(b.noteInfo.chromaticIndex)!;
      });
      ordered.push(...octNodes);
    }
    return ordered;
  }

  /** Extracts flat position and color arrays from an ordered list of nodes */
  private getLineData(orderedNodes: NoteNode[]): { positions: number[]; colors: number[] } {
    const positions: number[] = [];
    const colors: number[] = [];
    for (const node of orderedNodes) {
      const p = node.group.position;
      positions.push(p.x, p.y, p.z);
      const c = PITCH_COLORS[node.noteInfo.chromaticIndex];
      colors.push(c.r, c.g, c.b);
    }
    return { positions, colors };
  }

  /** Animate the connection line morphing between two non-concentric orderings */
  private animateTransition(prevMode: ViewMode, newMode: ViewMode): void {
    // Compute start data (previous ordering, current positions)
    const startNodes = prevMode === 'fifths' ? this.getFifthsOrderedNodes() : [...this.nodes];
    const startData = this.getLineData(startNodes);

    // Compute target data (new ordering, same positions since nodes don't move for spiral↔fifths)
    const targetNodes = newMode === 'fifths' ? this.getFifthsOrderedNodes() : [...this.nodes];
    const targetData = this.getLineData(targetNodes);

    this.startPositions = startData.positions;
    this.targetPositions = targetData.positions;
    this.startColors = startData.colors;
    this.targetColors = targetData.colors;

    this.animating = true;
    this.animStartTime = performance.now();

    // Ensure the line exists with the right vertex count
    this.rebuildInterpolated(0);

    const tick = () => {
      const elapsed = performance.now() - this.animStartTime;
      const t = Math.min(elapsed / TRANSITION_DURATION, 1);
      const eased = easeInOutCubic(t);

      this.rebuildInterpolated(eased);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        this.animating = false;
        this.rebuild(); // Final clean rebuild with correct ordering
      }
    };

    requestAnimationFrame(tick);
  }

  /** Updates the line geometry by lerping between start and target vertex data */
  private rebuildInterpolated(t: number): void {
    const count = this.startPositions.length;
    const positions = new Float32Array(count);
    const colors = new Float32Array(this.startColors.length);

    for (let i = 0; i < count; i++) {
      positions[i] = this.startPositions[i] + (this.targetPositions[i] - this.startPositions[i]) * t;
    }
    for (let i = 0; i < colors.length; i++) {
      colors[i] = this.startColors[i] + (this.targetColors[i] - this.startColors[i]) * t;
    }

    if (this.line) {
      const posAttr = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.line.geometry.getAttribute('color') as THREE.BufferAttribute;

      if (posAttr.count === count / 3) {
        // Update in place
        posAttr.set(positions);
        posAttr.needsUpdate = true;
        colAttr.set(colors);
        colAttr.needsUpdate = true;
        return;
      }
    }

    // Vertex count changed or no line exists — full rebuild
    if (this.line) {
      this.scene.remove(this.line);
      this.line.geometry.dispose();
      (this.line.material as THREE.Material).dispose();
      this.line = null;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });

    this.line = new THREE.Line(geo, mat);
    this.scene.add(this.line);
  }

  rebuild(): void {
    // Dispose old
    if (this.line) {
      this.scene.remove(this.line);
      this.line.geometry.dispose();
      (this.line.material as THREE.Material).dispose();
      this.line = null;
    }

    const orderedNodes = this.currentMode === 'fifths'
      ? this.getFifthsOrderedNodes()
      : this.nodes;

    const { positions, colors } = this.getLineData(orderedNodes);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });

    this.line = new THREE.Line(geo, mat);
    this.scene.add(this.line);
  }
}
