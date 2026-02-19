import { Plugin, PluginContext } from '../types';
import { NoteInfo } from '../../data/noteData';

export class SelectionControlsPlugin implements Plugin {
  readonly id = 'selection-controls';
  readonly name = 'Selection Controls';
  readonly tab = 'play' as const;
  readonly order = 10;

  private selectedNotes: NoteInfo[] = [];

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <div class="btn-row">
        <button class="btn" id="btn-clear">Clear Selection</button>
        <button class="btn btn-primary" id="btn-chord">Play Chord</button>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-scale">Play as Scale</button>
      </div>
    `;

    container.querySelector('#btn-clear')!.addEventListener('click', () => {
      ctx.eventBus.emit('selection:clear');
    });

    container.querySelector('#btn-chord')!.addEventListener('click', () => {
      ctx.eventBus.emit('audio:playChord', this.selectedNotes);
    });

    container.querySelector('#btn-scale')!.addEventListener('click', () => {
      ctx.eventBus.emit('audio:playScale', this.selectedNotes);
    });

    ctx.eventBus.on('selection:changed', (notes: NoteInfo[]) => {
      this.selectedNotes = notes;
    });
  }
}
