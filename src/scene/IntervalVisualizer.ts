import * as THREE from 'three';
import { NoteNode, PITCH_COLORS } from './NoteNode';
import { IntervalDef } from '../data/intervals';
import { eventBus } from '../utils/eventBus';

export class IntervalVisualizer {
  private scene: THREE.Scene;
  private nodes: NoteNode[];
  private lines: THREE.LineSegments | null = null;
  private currentInterval: IntervalDef | null = null;

  constructor(scene: THREE.Scene, nodes: NoteNode[]) {
    this.scene = scene;
    this.nodes = nodes;

    eventBus.on('interval:select', (interval: IntervalDef | null) => {
      this.showInterval(interval);
    });

    eventBus.on('view:positionsUpdated', () => {
      if (this.currentInterval) {
        this.showInterval(this.currentInterval);
      }
    });
  }

  showInterval(interval: IntervalDef | null): void {
    // Remove previous lines
    if (this.lines) {
      this.scene.remove(this.lines);
      this.lines.geometry.dispose();
      (this.lines.material as THREE.Material).dispose();
      this.lines = null;
    }

    this.currentInterval = interval;

    if (!interval) return;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.nodes.length; i++) {
      const target = i + interval.semitones;
      if (target >= this.nodes.length) break;

      const p1 = this.nodes[i].group.position;
      const p2 = this.nodes[target].group.position;

      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);

      const c1 = PITCH_COLORS[this.nodes[i].noteInfo.chromaticIndex];
      const c2 = PITCH_COLORS[this.nodes[target].noteInfo.chromaticIndex];

      colors.push(c1.r, c1.g, c1.b);
      colors.push(c2.r, c2.g, c2.b);
    }

    if (positions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    this.lines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.lines);
  }
}
