import * as THREE from 'three';
import { NoteNode, PITCH_COLORS } from './NoteNode';
import { eventBus } from '../utils/eventBus';

// Reference octave for shape visualization — places shapes in the middle of the helix
const REF_OCTAVE = 4;

interface ShapePayload {
  root: number;
  intervals: number[];
  type: 'scale' | 'chord';
}

export class ShapeVisualizer {
  private scene: THREE.Scene;
  private nodes: NoteNode[];
  private nodesByMidi: Map<number, NoteNode>;
  private fillMesh: THREE.Mesh | null = null;
  private outlineLine: THREE.Line | THREE.LineLoop | null = null;
  private currentShape: ShapePayload | null = null;

  constructor(scene: THREE.Scene, nodes: NoteNode[]) {
    this.scene = scene;
    this.nodes = nodes;
    this.nodesByMidi = new Map(nodes.map((n) => [n.noteInfo.midiNumber, n]));

    eventBus.on('shape:show', (payload: ShapePayload) => {
      this.currentShape = payload;
      this.rebuild();
    });

    eventBus.on('shape:clear', () => {
      this.currentShape = null;
      this.clear();
      this.clearHighlights();
    });

    eventBus.on('view:positionsUpdated', () => {
      if (this.currentShape) {
        this.rebuild();
      }
    });

    eventBus.on('root:changed', () => {
      if (this.currentShape) {
        this.rebuild();
      }
    });
  }

  private clear(): void {
    if (this.fillMesh) {
      this.scene.remove(this.fillMesh);
      this.fillMesh.geometry.dispose();
      (this.fillMesh.material as THREE.Material).dispose();
      this.fillMesh = null;
    }
    if (this.outlineLine) {
      this.scene.remove(this.outlineLine);
      this.outlineLine.geometry.dispose();
      (this.outlineLine.material as THREE.Material).dispose();
      this.outlineLine = null;
    }
  }

  private clearHighlights(): void {
    for (const node of this.nodes) {
      node.highlighted = false;
    }
  }

  private rebuild(): void {
    this.clear();

    if (!this.currentShape) return;

    const { root, intervals } = this.currentShape;

    // Compute pitch classes in this shape
    const pitchClasses = intervals.map((i) => (root + i) % 12);

    // Highlight matching nodes across all octaves
    for (const node of this.nodes) {
      node.highlighted = pitchClasses.includes(node.noteInfo.chromaticIndex);
    }

    if (intervals.length < 2) return;

    // Compute MIDI numbers anchored at the reference octave
    const baseMidi = (REF_OCTAVE + 1) * 12 + root; // e.g. C4 = 60
    const midiNumbers = intervals.map((i) => baseMidi + i);

    // Gather 3D positions from actual helix nodes, sorted ascending by MIDI
    const shapeNodes: { pos: THREE.Vector3; pc: number }[] = [];
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (node) {
        shapeNodes.push({
          pos: node.group.position.clone(),
          pc: node.noteInfo.chromaticIndex,
        });
      }
    }

    if (shapeNodes.length < 2) return;

    if (shapeNodes.length === 2) {
      // Single line between two nodes
      const positions: number[] = [];
      const colors: number[] = [];
      for (const sn of shapeNodes) {
        positions.push(sn.pos.x, sn.pos.y, sn.pos.z);
        const c = PITCH_COLORS[sn.pc];
        colors.push(c.r, c.g, c.b);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
      });
      this.outlineLine = new THREE.Line(geo, mat);
      this.scene.add(this.outlineLine);
    } else {
      // LineLoop outline with per-vertex pitch colors
      const positions: number[] = [];
      const colors: number[] = [];
      for (const sn of shapeNodes) {
        positions.push(sn.pos.x, sn.pos.y, sn.pos.z);
        const c = PITCH_COLORS[sn.pc];
        colors.push(c.r, c.g, c.b);
      }

      const outlineGeo = new THREE.BufferGeometry();
      outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      outlineGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const outlineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        linewidth: 2,
      });
      this.outlineLine = new THREE.LineLoop(outlineGeo, outlineMat);
      this.scene.add(this.outlineLine);

      // Fill mesh — triangle fan from centroid
      const centroid = new THREE.Vector3();
      for (const sn of shapeNodes) centroid.add(sn.pos);
      centroid.divideScalar(shapeNodes.length);

      const verts: number[] = [];
      for (let i = 0; i < shapeNodes.length; i++) {
        const a = shapeNodes[i].pos;
        const b = shapeNodes[(i + 1) % shapeNodes.length].pos;
        verts.push(centroid.x, centroid.y, centroid.z);
        verts.push(a.x, a.y, a.z);
        verts.push(b.x, b.y, b.z);
      }

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      fillGeo.computeVertexNormals();

      const fillMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.fillMesh = new THREE.Mesh(fillGeo, fillMat);
      this.scene.add(this.fillMesh);
    }
  }
}
