import * as THREE from 'three';
import { NoteNode } from './NoteNode';
import { NoteInfo } from '../data/noteData';
import { CHORDS } from '../data/chords';
import { eventBus } from '../utils/eventBus';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const LINE_COLOR = 0xffcc00;
const FILL_COLOR = 0xffcc00;
const FILL_OPACITY = 0.15;

export class LiveChordVisualizer {
  private scene: THREE.Scene;
  private nodesByMidi: Map<number, NoteNode>;
  private activeNotes = new Set<number>();
  private selectedNotes = new Set<number>();
  private lineObj: THREE.Line | THREE.LineLoop | null = null;
  private fillMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, nodes: NoteNode[]) {
    this.scene = scene;
    this.nodesByMidi = new Map(nodes.map((n) => [n.noteInfo.midiNumber, n]));

    eventBus.on('note:on', (info: NoteInfo) => {
      this.activeNotes.add(info.midiNumber);
      this.rebuild();
    });

    eventBus.on('note:off', (info: NoteInfo) => {
      this.activeNotes.delete(info.midiNumber);
      this.rebuild();
    });

    eventBus.on('selection:changed', (notes: NoteInfo[]) => {
      this.selectedNotes.clear();
      for (const note of notes) {
        this.selectedNotes.add(note.midiNumber);
      }
      this.rebuild();
    });

    eventBus.on('view:positionsUpdated', () => {
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
    eventBus.emit('chord:detected', chord);

    const sorted = [...this.combinedNotes()].sort((a, b) => a - b);
    if (sorted.length < 2) return;

    // Gather 3D positions from actual helix nodes
    const positions: THREE.Vector3[] = [];
    for (const midi of sorted) {
      const node = this.nodesByMidi.get(midi);
      if (node) {
        positions.push(node.group.position.clone());
      }
    }

    if (positions.length < 2) return;

    if (positions.length === 2) {
      // Single line between two notes
      const geo = new THREE.BufferGeometry().setFromPoints(positions);
      const mat = new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.7,
      });
      this.lineObj = new THREE.Line(geo, mat);
      this.scene.add(this.lineObj);
    } else {
      // LineLoop outline
      const geo = new THREE.BufferGeometry().setFromPoints(positions);
      const mat = new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.7,
      });
      this.lineObj = new THREE.LineLoop(geo, mat);
      this.scene.add(this.lineObj);

      // Fill mesh — triangle fan from centroid
      const centroid = new THREE.Vector3();
      for (const p of positions) centroid.add(p);
      centroid.divideScalar(positions.length);

      const verts: number[] = [];
      for (let i = 0; i < positions.length; i++) {
        const a = positions[i];
        const b = positions[(i + 1) % positions.length];
        verts.push(centroid.x, centroid.y, centroid.z);
        verts.push(a.x, a.y, a.z);
        verts.push(b.x, b.y, b.z);
      }

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      fillGeo.computeVertexNormals();

      const fillMat = new THREE.MeshBasicMaterial({
        color: FILL_COLOR,
        transparent: true,
        opacity: FILL_OPACITY,
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
