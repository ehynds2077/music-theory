import { NoteInfo } from '../data/noteData';
import { eventBus } from '../utils/eventBus';

export class InfoPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    eventBus.on('selection:changed', (notes: NoteInfo[]) => {
      this.update(notes);
    });

    eventBus.on('note:hover', (node: { noteInfo: NoteInfo }) => {
      this.showHoverInfo(node.noteInfo);
    });

    eventBus.on('note:hoverEnd', () => {
      // Could revert to selection info
    });

    this.update([]);
  }

  private update(notes: NoteInfo[]): void {
    if (notes.length === 0) {
      this.container.innerHTML =
        '<p style="color:#666;font-size:0.85rem;">Click notes on the spiral to select them.</p>';
      return;
    }

    const html = notes
      .map(
        (n) => `
        <div class="note-info">
          <strong>${n.fullName}</strong> —
          MIDI ${n.midiNumber} —
          ${n.frequency.toFixed(1)} Hz
          ${n.isBlack ? ' (♯/♭)' : ''}
        </div>`
      )
      .join('');

    this.container.innerHTML = `
      <p style="color:#a0a0c0;font-size:0.8rem;margin-bottom:6px;">
        ${notes.length} note${notes.length !== 1 ? 's' : ''} selected
      </p>
      ${html}
    `;
  }

  private showHoverInfo(note: NoteInfo): void {
    // Could show a tooltip or update panel temporarily
  }
}
