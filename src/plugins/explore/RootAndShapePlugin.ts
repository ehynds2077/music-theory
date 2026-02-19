import { Plugin, PluginContext } from '../types';
import { SCALES } from '../../data/scales';
import { CHORDS } from '../../data/chords';
import { NoteInfo, ALL_NOTES } from '../../data/noteData';
import { EventBus } from '../../utils/eventBus';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class RootAndShapePlugin implements Plugin {
  readonly id = 'root-and-shape';
  readonly name = 'Root & Shape';
  readonly tab = 'explore' as const;
  readonly order = 10;

  private currentRoot = 0;
  private currentShapeType: 'scale' | 'chord' | null = null;
  private scaleSelect!: HTMLSelectElement;
  private chordSelect!: HTMLSelectElement;
  private eventBus!: EventBus;

  init(container: HTMLElement, ctx: PluginContext): void {
    this.eventBus = ctx.eventBus;

    container.innerHTML = `
      <label>Root / Key</label>
      <div class="root-buttons">
        ${NOTE_NAMES.map(
          (name, i) =>
            `<button class="btn${i === 0 ? ' btn-active' : ''}" data-root="${i}">${name}</button>`
        ).join('')}
      </div>

      <label for="scale-select">Scale</label>
      <select id="scale-select">
        <option value="">— None —</option>
        ${SCALES.map(
          (s, i) => `<option value="${i}">${s.name}</option>`
        ).join('')}
      </select>

      <label for="chord-select">Chord</label>
      <select id="chord-select">
        <option value="">— None —</option>
        ${CHORDS.map(
          (c, i) => `<option value="${i}">${c.name}</option>`
        ).join('')}
      </select>

      <div class="btn-row">
        <button class="btn btn-primary" id="btn-play-shape">Play Shape</button>
      </div>
    `;

    // Root buttons
    const rootButtons = container.querySelectorAll('[data-root]');
    rootButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        rootButtons.forEach((b) => b.classList.remove('btn-active'));
        btn.classList.add('btn-active');
        this.currentRoot = parseInt((btn as HTMLElement).dataset.root!);
        this.eventBus.emit('root:changed', this.currentRoot);
        this.reemitShape();
      });
    });

    // Scale select
    this.scaleSelect = container.querySelector('#scale-select') as HTMLSelectElement;
    this.chordSelect = container.querySelector('#chord-select') as HTMLSelectElement;

    this.scaleSelect.addEventListener('change', () => {
      const val = this.scaleSelect.value;
      if (val === '') {
        this.currentShapeType = null;
        this.eventBus.emit('shape:clear');
      } else {
        this.chordSelect.value = '';
        this.currentShapeType = 'scale';
        const scale = SCALES[parseInt(val)];
        this.eventBus.emit('shape:show', {
          root: this.currentRoot,
          intervals: scale.intervals,
          type: 'scale' as const,
        });
      }
    });

    // Chord select
    this.chordSelect.addEventListener('change', () => {
      const val = this.chordSelect.value;
      if (val === '') {
        this.currentShapeType = null;
        this.eventBus.emit('shape:clear');
      } else {
        this.scaleSelect.value = '';
        this.currentShapeType = 'chord';
        const chord = CHORDS[parseInt(val)];
        this.eventBus.emit('shape:show', {
          root: this.currentRoot,
          intervals: chord.intervals,
          type: 'chord' as const,
        });
      }
    });

    // Play Shape
    container.querySelector('#btn-play-shape')!.addEventListener('click', () => {
      this.playCurrentShape();
    });
  }

  private reemitShape(): void {
    if (this.currentShapeType === 'scale' && this.scaleSelect.value !== '') {
      const scale = SCALES[parseInt(this.scaleSelect.value)];
      this.eventBus.emit('shape:show', {
        root: this.currentRoot,
        intervals: scale.intervals,
        type: 'scale' as const,
      });
    } else if (this.currentShapeType === 'chord' && this.chordSelect.value !== '') {
      const chord = CHORDS[parseInt(this.chordSelect.value)];
      this.eventBus.emit('shape:show', {
        root: this.currentRoot,
        intervals: chord.intervals,
        type: 'chord' as const,
      });
    }
  }

  private playCurrentShape(): void {
    let intervals: number[] | null = null;
    let type: 'scale' | 'chord' = 'chord';

    if (this.currentShapeType === 'scale' && this.scaleSelect.value !== '') {
      intervals = SCALES[parseInt(this.scaleSelect.value)].intervals;
      type = 'scale';
    } else if (this.currentShapeType === 'chord' && this.chordSelect.value !== '') {
      intervals = CHORDS[parseInt(this.chordSelect.value)].intervals;
      type = 'chord';
    }

    if (!intervals) return;

    const notes: NoteInfo[] = [];
    for (const offset of intervals) {
      const midi = 60 + this.currentRoot + offset;
      const note = ALL_NOTES.find((n: NoteInfo) => n.midiNumber === midi);
      if (note) notes.push(note);
    }

    if (notes.length === 0) return;

    if (type === 'scale') {
      this.eventBus.emit('audio:playScale', notes);
    } else {
      this.eventBus.emit('audio:playChord', notes);
    }
  }
}
