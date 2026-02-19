import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { NoteInfo } from '../data/noteData';
import { eventBus } from '../utils/eventBus';

export class SheetMusicRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    eventBus.on('selection:changed', (notes: NoteInfo[]) => {
      this.render(notes);
    });

    // Initial empty state
    this.renderEmpty();
  }

  private renderEmpty(): void {
    this.container.innerHTML =
      '<p style="color:#999;font-size:0.85rem;text-align:center;padding:20px;">Select notes to see notation</p>';
  }

  render(notes: NoteInfo[]): void {
    if (notes.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = '';

    const width = this.container.clientWidth || 280;
    const renderer = new Renderer(this.container, Renderer.Backends.SVG);
    renderer.resize(width, 160);
    const context = renderer.getContext();

    // Split notes into treble (midi >= 60) and bass (midi < 60)
    const trebleNotes = notes.filter((n) => n.midiNumber >= 60);
    const bassNotes = notes.filter((n) => n.midiNumber < 60);

    let yOffset = 10;

    if (trebleNotes.length > 0) {
      const stave = new Stave(10, yOffset, width - 30);
      stave.addClef('treble');
      stave.setContext(context).draw();

      const vfNote = this.createStaveNote(trebleNotes, 'treble');
      const voice = new Voice({ numBeats: 1, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickable(vfNote);
      new Formatter().joinVoices([voice]).format([voice], width - 90);
      voice.draw(context, stave);

      yOffset += 80;
    }

    if (bassNotes.length > 0) {
      if (trebleNotes.length > 0) {
        renderer.resize(width, 240);
      }
      const stave = new Stave(10, yOffset, width - 30);
      stave.addClef('bass');
      stave.setContext(context).draw();

      const vfNote = this.createStaveNote(bassNotes, 'bass');
      const voice = new Voice({ numBeats: 1, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickable(vfNote);
      new Formatter().joinVoices([voice]).format([voice], width - 90);
      voice.draw(context, stave);
    }
  }

  private createStaveNote(notes: NoteInfo[], clef: string): StaveNote {
    const keys = notes.map((n) => this.toVexFlowKey(n));
    const staveNote = new StaveNote({
      keys,
      duration: 'w',
      clef,
    });

    // Add accidentals
    notes.forEach((n, i) => {
      if (n.name.includes('#')) {
        staveNote.addModifier(new Accidental('#'), i);
      }
    });

    return staveNote;
  }

  private toVexFlowKey(note: NoteInfo): string {
    // VexFlow format: "c#/4", "d/3"
    const name = note.name.toLowerCase();
    return `${name}/${note.octave}`;
  }
}
