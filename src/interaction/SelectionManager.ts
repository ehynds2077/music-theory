import { NoteNode } from '../scene/NoteNode';
import { NoteInfo } from '../data/noteData';
import { eventBus } from '../utils/eventBus';

export class SelectionManager {
  private selectedNodes = new Set<NoteNode>();

  constructor() {
    eventBus.on('note:click', (node: NoteNode) => {
      this.toggle(node);
    });

    eventBus.on('selection:clear', () => {
      this.clearAll();
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
