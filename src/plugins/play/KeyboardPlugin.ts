import { Plugin, PluginContext } from '../types';

const LAYOUT = {
  blackRow: [
    { key: 'W', note: 'C#' },
    { key: 'E', note: 'D#' },
    { key: '', note: '' },
    { key: 'T', note: 'F#' },
    { key: 'Y', note: 'G#' },
    { key: 'U', note: 'A#' },
    { key: '', note: '' },
    { key: 'O', note: 'C#' },
    { key: 'P', note: 'D#' },
  ],
  whiteRow: [
    { key: 'A', note: 'C' },
    { key: 'S', note: 'D' },
    { key: 'D', note: 'E' },
    { key: 'F', note: 'F' },
    { key: 'G', note: 'G' },
    { key: 'H', note: 'A' },
    { key: 'J', note: 'B' },
    { key: 'K', note: 'C' },
    { key: 'L', note: 'D' },
    { key: ';', note: 'E' },
  ],
};

export class KeyboardPlugin implements Plugin {
  readonly id = 'keyboard';
  readonly name = 'Keyboard';
  readonly tab = 'play' as const;
  readonly order = 5;

  private octaveLabel!: HTMLElement;
  private chordLabel!: HTMLElement;
  private keyElements = new Map<string, HTMLElement>();

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label>Computer Keyboard</label>
      <div class="keyboard-layout">
        <div class="keyboard-row keyboard-row-black">
          ${LAYOUT.blackRow.map((k) =>
            k.key
              ? `<span class="kb-key kb-black" data-key="${k.key.toLowerCase()}">${k.key}<small>${k.note}</small></span>`
              : `<span class="kb-spacer"></span>`
          ).join('')}
        </div>
        <div class="keyboard-row keyboard-row-white">
          ${LAYOUT.whiteRow.map((k) =>
            `<span class="kb-key kb-white" data-key="${k.key.toLowerCase()}">${k.key}<small>${k.note}</small></span>`
          ).join('')}
        </div>
      </div>
      <div class="chord-label" id="chord-label"></div>
      <div class="keyboard-octave">
        <button class="btn kb-oct-btn" id="kb-oct-down">Z: Oct-</button>
        <span class="kb-octave-label">Octave: <strong id="kb-octave-val">4</strong></span>
        <button class="btn kb-oct-btn" id="kb-oct-up">X: Oct+</button>
      </div>
    `;

    this.octaveLabel = container.querySelector('#kb-octave-val')!;
    this.chordLabel = container.querySelector('#chord-label')!;

    // Build key element map
    container.querySelectorAll<HTMLElement>('.kb-key').forEach((el) => {
      const key = el.dataset.key!;
      this.keyElements.set(key, el);
    });

    // Octave buttons
    container.querySelector('#kb-oct-down')!.addEventListener('click', () => {
      ctx.eventBus.emit('keyboard:shiftOctave', -1);
    });
    container.querySelector('#kb-oct-up')!.addEventListener('click', () => {
      ctx.eventBus.emit('keyboard:shiftOctave', 1);
    });

    // Listen for keyboard events to update UI
    ctx.eventBus.on('keyboard:noteOn', ({ key }: { key: string }) => {
      this.keyElements.get(key)?.classList.add('kb-active');
    });

    ctx.eventBus.on('keyboard:noteOff', ({ key }: { key: string }) => {
      this.keyElements.get(key)?.classList.remove('kb-active');
    });

    ctx.eventBus.on('keyboard:octaveChanged', (octave: number) => {
      this.octaveLabel.textContent = String(octave);
    });

    ctx.eventBus.on('chord:detected', (chord: { name: string; root: string } | null) => {
      if (chord) {
        this.chordLabel.textContent = `${chord.root} ${chord.name}`;
      } else {
        this.chordLabel.textContent = '';
      }
    });
  }
}
