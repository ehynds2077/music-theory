import * as THREE from 'three';
import { NoteNode, PITCH_COLORS } from './NoteNode';
import { EventBus } from '../utils/eventBus';

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
  private shellGroup: THREE.Group | null = null;
  private currentShape: ShapePayload | null = null;

  constructor(scene: THREE.Scene, nodes: NoteNode[], bus: EventBus) {
    this.scene = scene;
    this.nodes = nodes;
    this.nodesByMidi = new Map(nodes.map((n) => [n.noteInfo.midiNumber, n]));

    bus.on('shape:show', (payload: ShapePayload) => {
      this.currentShape = payload;
      this.rebuild();
    });

    bus.on('shape:clear', () => {
      this.currentShape = null;
      this.clear();
      this.clearHighlights();
    });

    bus.on('view:positionsUpdated', () => {
      if (this.currentShape) {
        this.rebuild();
      }
    });

    bus.on('root:changed', () => {
      if (this.currentShape) {
        this.rebuild();
      }
    });
  }

  private clear(): void {
    if (this.shellGroup) {
      this.scene.remove(this.shellGroup);
      this.shellGroup.traverse((child) => {
        const obj = child as THREE.Mesh | THREE.Line;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) (obj.material as THREE.Material).dispose();
      });
      this.shellGroup = null;
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
    const baseMidi = (REF_OCTAVE + 1) * 12 + root;
    const midiNumbers = intervals.map((i) => baseMidi + i);

    // Gather 3D positions from actual nodes
    const shapeNodes: { pos: THREE.Vector3; pc: number; midi: number }[] = [];
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (node) {
        shapeNodes.push({
          pos: node.group.position.clone(),
          pc: node.noteInfo.chromaticIndex,
          midi: node.noteInfo.midiNumber,
        });
      }
    }

    if (shapeNodes.length < 2) return;

    this.buildShell(shapeNodes);
  }

  private buildShell(
    shapeNodes: { pos: THREE.Vector3; pc: number; midi: number }[],
  ): void {
    this.shellGroup = new THREE.Group();

    const firstMidi = shapeNodes[0].midi;
    const lastMidi = shapeNodes[shapeNodes.length - 1].midi;

    // Collect ALL chromatic node positions between first and last selected note
    // to form a smooth spiral arc (uses actual node positions so it works in any view)
    const arcNodes: { pos: THREE.Vector3; pc: number }[] = [];
    for (let m = firstMidi; m <= lastMidi; m++) {
      const node = this.nodesByMidi.get(m);
      if (node) {
        arcNodes.push({
          pos: node.group.position.clone(),
          pc: node.noteInfo.chromaticIndex,
        });
      }
    }

    if (arcNodes.length < 2) return;

    // ── 1. Outer spiral curve ──
    const curvePositions: number[] = [];
    const curveColors: number[] = [];
    for (const an of arcNodes) {
      curvePositions.push(an.pos.x, an.pos.y, an.pos.z);
      const c = PITCH_COLORS[an.pc];
      curveColors.push(c.r, c.g, c.b);
    }

    const curveGeo = new THREE.BufferGeometry();
    curveGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(curvePositions, 3),
    );
    curveGeo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(curveColors, 3),
    );
    const curveMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    this.shellGroup.add(new THREE.Line(curveGeo, curveMat));

    // ── 2. Chamber walls (radial lines from center axis to each selected note) ──
    // Opacity fades from bottom (first note) to top (last note)
    for (let i = 0; i < shapeNodes.length; i++) {
      const sn = shapeNodes[i];
      const t = shapeNodes.length > 1 ? i / (shapeNodes.length - 1) : 0;
      const wallOpacity = 0.8 - t * 0.5; // 0.8 at bottom → 0.3 at top

      const wallPositions = [0, sn.pos.y, 0, sn.pos.x, sn.pos.y, sn.pos.z];
      const wc = PITCH_COLORS[sn.pc];
      const wallColors = [
        wc.r * 0.3, wc.g * 0.3, wc.b * 0.3,
        wc.r, wc.g, wc.b,
      ];

      const wallGeo = new THREE.BufferGeometry();
      wallGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(wallPositions, 3),
      );
      wallGeo.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(wallColors, 3),
      );
      const wallMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: wallOpacity,
      });
      this.shellGroup.add(new THREE.Line(wallGeo, wallMat));
    }

    // ── 3. Fill chambers with color gradient and fading opacity ──
    const totalChambers = shapeNodes.length - 1;
    for (let i = 0; i < totalChambers; i++) {
      const sn1 = shapeNodes[i];
      const sn2 = shapeNodes[i + 1];

      // Opacity fades from bottom to top
      const chamberT = totalChambers > 1 ? i / (totalChambers - 1) : 0;
      const chamberOpacity = 0.55 - chamberT * 0.3; // 0.55 at bottom → 0.25 at top

      // Collect arc points between these two selected notes (with pitch class)
      const segArc: { pos: THREE.Vector3; pc: number }[] = [];
      for (let m = sn1.midi; m <= sn2.midi; m++) {
        const node = this.nodesByMidi.get(m);
        if (node) {
          segArc.push({
            pos: node.group.position.clone(),
            pc: node.noteInfo.chromaticIndex,
          });
        }
      }

      if (segArc.length < 2) continue;

      // Triangle fan from center axis through arc points
      // Each vertex uses the actual pitch color of the note at that position
      const verts: number[] = [];
      const colors: number[] = [];
      for (let j = 0; j < segArc.length - 1; j++) {
        const cy = (segArc[j].pos.y + segArc[j + 1].pos.y) / 2;
        const col1 = PITCH_COLORS[segArc[j].pc];
        const col2 = PITCH_COLORS[segArc[j + 1].pc];

        // Center vertex — dimmed blend of the two adjacent note colors
        verts.push(0, cy, 0);
        colors.push(
          (col1.r + col2.r) * 0.25,
          (col1.g + col2.g) * 0.25,
          (col1.b + col2.b) * 0.25,
        );

        // Arc edge vertices — actual pitch color of each note
        verts.push(segArc[j].pos.x, segArc[j].pos.y, segArc[j].pos.z);
        colors.push(col1.r, col1.g, col1.b);

        verts.push(segArc[j + 1].pos.x, segArc[j + 1].pos.y, segArc[j + 1].pos.z);
        colors.push(col2.r, col2.g, col2.b);
      }

      if (verts.length === 0) continue;

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(verts, 3),
      );
      fillGeo.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3),
      );
      fillGeo.computeVertexNormals();

      const fillMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: chamberOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.shellGroup.add(new THREE.Mesh(fillGeo, fillMat));
    }

    this.scene.add(this.shellGroup);
  }
}
