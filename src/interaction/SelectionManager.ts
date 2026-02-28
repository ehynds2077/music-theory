import { NoteNode } from '../scene/NoteNode';
import { NoteInfo } from '../data/noteData';
import { EventBus } from '../utils/eventBus';

export class SelectionManager {
  private selectedNodes = new Set<NoteNode>();
  private nodesByMidi: Map<number, NoteNode>;
  private bus: EventBus;

  constructor(noteNodes: NoteNode[], bus: EventBus) {
    this.nodesByMidi = new Map(noteNodes.map((n) => [n.noteInfo.midiNumber, n]));
    this.bus = bus;

    bus.on('note:click', (node: NoteNode) => {
      this.toggle(node);
    });

    bus.on('selection:clear', () => {
      this.clearAll();
    });

    bus.on('selection:add', (midiNumbers: number[], opts?: { silent?: boolean }) => {
      this.addByMidi(midiNumbers, opts?.silent);
    });

    bus.on('selection:set', (midiNumbers: number[]) => {
      this.setByMidi(midiNumbers);
    });

    bus.on('selection:remove', (midiNumbers: number[]) => {
      this.removeByMidi(midiNumbers);
    });
  }

  toggle(node: NoteNode): void {
    if (this.selectedNodes.has(node)) {
      this.selectedNodes.delete(node);
      node.selected = false;
      this.bus.emit('note:deselect', node.noteInfo);
    } else {
      this.selectedNodes.add(node);
      node.selected = true;
      this.bus.emit('note:select', node.noteInfo);
    }
    this.bus.emit('selection:changed', this.getSelectedNotes());
  }

  addByMidi(midiNumbers: number[], silent = false): void {
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (!node || this.selectedNodes.has(node)) continue;
      this.selectedNodes.add(node);
      node.selected = true;
      if (!silent) {
        this.bus.emit('note:select', node.noteInfo);
      }
    }
    this.bus.emit('selection:changed', this.getSelectedNotes());
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
    this.bus.emit('selection:changed', this.getSelectedNotes());
  }

  removeByMidi(midiNumbers: number[]): void {
    for (const midi of midiNumbers) {
      const node = this.nodesByMidi.get(midi);
      if (!node || !this.selectedNodes.has(node)) continue;
      this.selectedNodes.delete(node);
      node.selected = false;
    }
    this.bus.emit('selection:changed', this.getSelectedNotes());
  }

  clearAll(): void {
    for (const node of this.selectedNodes) {
      node.selected = false;
    }
    this.selectedNodes.clear();
    this.bus.emit('selection:changed', []);
  }

  getSelectedNotes(): NoteInfo[] {
    return Array.from(this.selectedNodes)
      .map((n) => n.noteInfo)
      .sort((a, b) => a.midiNumber - b.midiNumber);
  }
}
