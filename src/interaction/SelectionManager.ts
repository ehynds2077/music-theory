import { NoteNode } from '../scene/NoteNode';
import { NoteInfo } from '../data/noteData';
import { eventBus } from '../utils/eventBus';

export class SelectionManager {
  private selectedNodes = new Set<NoteNode>();
  private nodesByMidi: Map<number, NoteNode>;

  constructor(noteNodes: NoteNode[]) {
    this.nodesByMidi = new Map(noteNodes.map((n) => [n.noteInfo.midiNumber, n]));

    eventBus.on('note:click', (node: NoteNode) => {
      this.toggle(node);
    });

    eventBus.on('selection:clear', () => {
      this.clearAll();
    });

    eventBus.on('selection:add', (midiNumbers: number[], opts?: { silent?: boolean }) => {
      this.addByMidi(midiNumbers, opts?.silent);
    });

    eventBus.on('selection:set', (midiNumbers: number[]) => {
      this.setByMidi(midiNumbers);
    });

    eventBus.on('selection:remove', (midiNumbers: number[]) => {
      this.removeByMidi(midiNumbers);
    });
  }

  toggle(node: NoteNode): void {
    if (this.selectedNodes.has(node)) {
      this.selectedNodes.delete(node);
      node.selected = false;
      eventBus.emit('note:deselect', node.noteInfo);
    } else {
      this.selectedNodes.add(node);
      node.selected = true;
      eventBus.emit('note:select', node.noteInfo);
    }
    eventBus.emit('selection:changed', this.getSelectedNotes());
  }

  addByMidi(midiNumbers: number[], silent = false): void {
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (!node || this.selectedNodes.has(node)) continue;
      this.selectedNodes.add(node);
      node.selected = true;
      if (!silent) {
        eventBus.emit('note:select', node.noteInfo);
      }
    }
    eventBus.emit('selection:changed', this.getSelectedNotes());
  }

  setByMidi(midiNumbers: number[]): void {
    // Clear existing selection
    for (const node of this.selectedNodes) {
      node.selected = false;
    }
    this.selectedNodes.clear();

    // Set new selection
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (!node) continue;
      this.selectedNodes.add(node);
      node.selected = true;
    }
    eventBus.emit('selection:changed', this.getSelectedNotes());
  }

  removeByMidi(midiNumbers: number[]): void {
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (!node || !this.selectedNodes.has(node)) continue;
      this.selectedNodes.delete(node);
      node.selected = false;
    }
    eventBus.emit('selection:changed', this.getSelectedNotes());
  }

  clearAll(): void {
    for (const node of this.selectedNodes) {
      node.selected = false;
    }
    this.selectedNodes.clear();
    eventBus.emit('selection:changed', []);
  }

  getSelectedNotes(): NoteInfo[] {
    return Array.from(this.selectedNodes)
      .map((n) => n.noteInfo)
      .sort((a, b) => a.midiNumber - b.midiNumber);
  }
}
