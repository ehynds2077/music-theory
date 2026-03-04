import * as THREE from 'three';
import { NoteNode, PITCH_COLORS } from './NoteNode';
import { NoteInfo } from '../data/noteData';
import { CHORDS } from '../data/chords';
import { EventBus } from '../utils/eventBus';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class LiveChordVisualizer {
  private scene: THREE.Scene;
  private bus: EventBus;
  private nodesByMidi: Map<number, NoteNode>;
  private activeNotes = new Set<number>();
  private selectedNotes = new Set<number>();
  private lineObj: THREE.Line | null = null;
  private fillMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, nodes: NoteNode[], bus: EventBus) {
    this.scene = scene;
    this.bus = bus;
    this.nodesByMidi = new Map(nodes.map((n) => [n.noteInfo.midiNumber, n]));

    bus.on('note:on', (info: NoteInfo) => {
      this.activeNotes.add(info.midiNumber);
      this.rebuild();
    });

    bus.on('note:off', (info: NoteInfo) => {
      this.activeNotes.delete(info.midiNumber);
      this.rebuild();
    });

    bus.on('selection:changed', (notes: NoteInfo[]) => {
      this.selectedNotes.clear();
      for (const note of notes) {
        this.selectedNotes.add(note.midiNumber);
      }
      this.rebuild();
    });

    bus.on('view:positionsUpdated', () => {
      if (this.activeNotes.size + this.selectedNotes.size >= 2) {
        this.rebuild();
      }
    });
  }

  private clear(): void {
    if (this.lineObj) {
      this.scene.remove(this.lineObj);
      this.lineObj.geometry.dispose();
      (this.lineObj.material as THREE.Material).dispose();
      this.lineObj = null;
    }
    if (this.fillMesh) {
      this.scene.remove(this.fillMesh);
      this.fillMesh.geometry.dispose();
      (this.fillMesh.material as THREE.Material).dispose();
      this.fillMesh = null;
    }
  }

  private combinedNotes(): Set<number> {
    const combined = new Set(this.activeNotes);
    for (const midi of this.selectedNotes) {
      combined.add(midi);
    }
    return combined;
  }

  private rebuild(): void {
    this.clear();

    // Detect chord regardless of note count
    const chord = this.detectChord();
    this.bus.emit('chord:detected', chord);

    const sorted = [...this.combinedNotes()].sort((a, b) => a - b);
    if (sorted.length < 2) return;

    // Gather positions and colors for selected notes only
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    for (const midi of sorted) {
      const node = this.nodesByMidi.get(midi);
      if (!node) continue;
      const p = node.group.position;
      linePositions.push(p.x, p.y, p.z);
      const c = PITCH_COLORS[node.noteInfo.chromaticIndex];
      lineColors.push(c.r, c.g, c.b);
    }

    if (linePositions.length < 6) return;

    // Collect valid positions and nodes for fill
    const positions: THREE.Vector3[] = [];
    const nodes: NoteNode[] = [];
    for (const midi of sorted) {
      const node = this.nodesByMidi.get(midi);
      if (!node) continue;
      positions.push(node.group.position);
      nodes.push(node);
    }

    if (positions.length < 2) return;

    // Lines connecting consecutive selected notes (open, no loop-back)
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    this.lineObj = new THREE.Line(lineGeo, lineMat);
    this.scene.add(this.lineObj);

    // Fill: triangle fan from centroid, colored by each note's pitch
    if (positions.length >= 3) {
      const centroid = new THREE.Vector3();
      for (const p of positions) centroid.add(p);
      centroid.divideScalar(positions.length);

      const verts: number[] = [];
      const fillColors: number[] = [];
      for (let i = 0; i < positions.length - 1; i++) {
        const a = positions[i];
        const b = positions[i + 1];
        const cA = PITCH_COLORS[nodes[i].noteInfo.chromaticIndex];
        const cB = PITCH_COLORS[nodes[i + 1].noteInfo.chromaticIndex];

        // Centroid vertex — dimmed blend of the two edge colors
        verts.push(centroid.x, centroid.y, centroid.z);
        fillColors.push((cA.r + cB.r) * 0.25, (cA.g + cB.g) * 0.25, (cA.b + cB.b) * 0.25);

        verts.push(a.x, a.y, a.z);
        fillColors.push(cA.r, cA.g, cA.b);

        verts.push(b.x, b.y, b.z);
        fillColors.push(cB.r, cB.g, cB.b);
      }

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      fillGeo.setAttribute('color', new THREE.Float32BufferAttribute(fillColors, 3));
      fillGeo.computeVertexNormals();

      const fillMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.fillMesh = new THREE.Mesh(fillGeo, fillMat);
      this.scene.add(this.fillMesh);
    }
  }

  private detectChord(): { name: string; root: string } | null {
    const combined = this.combinedNotes();
    if (combined.size < 2) return null;

    // Get unique pitch classes
    const pitchClasses = new Set<number>();
    for (const midi of combined) {
      pitchClasses.add(midi % 12);
    }

    const pcs = [...pitchClasses].sort((a, b) => a - b);
    if (pcs.length < 2) return null;

    // Try each pitch class as candidate root
    for (const root of pcs) {
      const intervals = pcs.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b);

      for (const chord of CHORDS) {
        if (chord.intervals.length !== intervals.length) continue;
        if (chord.intervals.every((v, i) => v === intervals[i])) {
          return { name: chord.name, root: NOTE_NAMES[root] };
        }
      }
    }

    return null;
  }
}
