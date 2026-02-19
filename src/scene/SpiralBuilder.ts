import * as THREE from 'three';
import { ALL_NOTES } from '../data/noteData';
import { NoteNode } from './NoteNode';

export class SpiralBuilder {
  readonly noteNodes: NoteNode[] = [];

  constructor(scene: THREE.Scene) {
    for (const note of ALL_NOTES) {
      const node = new NoteNode(note);
      this.noteNodes.push(node);
      scene.add(node.group);
    }
  }

  getNoteNodeByMidi(midi: number): NoteNode | undefined {
    return this.noteNodes.find((n) => n.noteInfo.midiNumber === midi);
  }

  getAllMeshes(): THREE.Mesh[] {
    return this.noteNodes.map((n) => n.mesh);
  }
}
