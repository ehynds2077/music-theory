import * as THREE from 'three';
import { NoteNode } from './NoteNode';
import { HELIX_RADIUS } from '../data/noteData';
import { eventBus } from '../utils/eventBus';

export type ViewMode = 'spiral' | 'concentric' | 'fifths';

const CONCENTRIC_BASE_RADIUS = 3;
const CONCENTRIC_RING_SPACING = 3;
const TRANSITION_DURATION = 1000; // ms

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class ViewManager {
  private scene: THREE.Scene;
  private nodes: NoteNode[];
  private mode: ViewMode = 'spiral';
  private octaveRings: THREE.LineLoop[] = [];
  private rootOffset = 0; // radians

  // Animation state
  private animating = false;
  private animStartTime = 0;
  private startPositions: THREE.Vector3[] = [];
  private targetPositions: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene, nodes: NoteNode[]) {
    this.scene = scene;
    this.nodes = nodes;

    this.buildOctaveRings();

    eventBus.on('view:toggle', (mode: ViewMode) => {
      if (mode !== this.mode) {
        const prevMode = this.mode;
        this.mode = mode;
        eventBus.emit('view:modeChanged', { prevMode, newMode: mode });
        eventBus.emit('camera:preset', mode === 'concentric' ? 'concentric' : 'default');
        this.transitionTo();
      }
    });

    eventBus.on('root:changed', (rootIndex: number) => {
      this.rootOffset = (rootIndex * Math.PI * 2) / 12;
      this.transitionTo();
    });
  }

  getSpiralPosition(node: NoteNode): THREE.Vector3 {
    const info = node.noteInfo;
    const angle = info.spiralAngle - this.rootOffset;
    const x = Math.sin(angle) * HELIX_RADIUS;
    const z = Math.cos(angle) * HELIX_RADIUS;
    return new THREE.Vector3(x, info.spiralY, z);
  }

  getConcentricPosition(node: NoteNode): THREE.Vector3 {
    const info = node.noteInfo;
    const octaveIndex = info.octave - 1;
    const radius = CONCENTRIC_BASE_RADIUS + octaveIndex * CONCENTRIC_RING_SPACING;
    const angle = info.spiralAngle - this.rootOffset;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    return new THREE.Vector3(x, 0, z);
  }

  getPositionForNode(node: NoteNode): THREE.Vector3 {
    if (this.mode === 'concentric') return this.getConcentricPosition(node);
    return this.getSpiralPosition(node);
  }

  getMode(): ViewMode {
    return this.mode;
  }

  getRootOffset(): number {
    return this.rootOffset;
  }

  private transitionTo(): void {
    this.startPositions = this.nodes.map((n) => n.group.position.clone());
    this.targetPositions = this.nodes.map((n) => this.getPositionForNode(n));

    this.animating = true;
    this.animStartTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - this.animStartTime;
      const t = Math.min(elapsed / TRANSITION_DURATION, 1);
      const eased = easeInOutCubic(t);

      for (let i = 0; i < this.nodes.length; i++) {
        this.nodes[i].group.position.lerpVectors(
          this.startPositions[i],
          this.targetPositions[i],
          eased
        );
      }

      eventBus.emit('view:positionsUpdated');

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        this.animating = false;
        this.buildOctaveRings();
      }
    };

    this.removeOctaveRings();
    requestAnimationFrame(tick);
  }

  private removeOctaveRings(): void {
    for (const ring of this.octaveRings) {
      this.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    }
    this.octaveRings = [];
  }

  private buildOctaveRings(): void {
    this.removeOctaveRings();

    // Find unique octaves from our nodes
    const octaves = new Set(this.nodes.map((n) => n.noteInfo.octave));
    const segments = 64;

    for (const oct of octaves) {
      const points: THREE.Vector3[] = [];

      if (this.mode === 'spiral' || this.mode === 'fifths') {
        // Horizontal ring at the Y height of C in this octave
        const cNode = this.nodes.find(
          (n) => n.noteInfo.octave === oct && n.noteInfo.chromaticIndex === 0
        );
        const y = cNode ? cNode.group.position.y : 0;

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(
            new THREE.Vector3(
              Math.sin(angle) * HELIX_RADIUS,
              y,
              Math.cos(angle) * HELIX_RADIUS
            )
          );
        }
      } else {
        // Flat ring on y=0 at octave radius
        const octaveIndex = oct - 1;
        const radius = CONCENTRIC_BASE_RADIUS + octaveIndex * CONCENTRIC_RING_SPACING;

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(
            new THREE.Vector3(
              Math.sin(angle) * radius,
              0,
              Math.cos(angle) * radius
            )
          );
        }
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x6666aa,
        transparent: true,
        opacity: 0.25,
      });
      const ring = new THREE.LineLoop(geo, mat);
      this.scene.add(ring);
      this.octaveRings.push(ring);
    }
  }

  update(): void {
    // Called each frame; currently only needed during animation
    // Animation is handled via rAF in transitionTo
  }
}
