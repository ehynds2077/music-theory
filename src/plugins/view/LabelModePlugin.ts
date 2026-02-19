import { Plugin, PluginContext } from '../types';
import { LabelMode } from '../../scene/NoteNode';

export class LabelModePlugin implements Plugin {
  readonly id = 'label-mode';
  readonly name = 'Note Labels';
  readonly tab = 'view' as const;
  readonly order = 40;

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label>Note Labels</label>
      <div class="view-toggle">
        <button class="btn btn-active" data-label="letters">Letters</button>
        <button class="btn" data-label="numbers">Numbers</button>
      </div>
    `;

    const buttons = container.querySelectorAll('[data-label]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('btn-active'));
        btn.classList.add('btn-active');
        const mode = (btn as HTMLElement).dataset.label as LabelMode;
        ctx.eventBus.emit('labels:mode', mode);
      });
    });
  }
}
