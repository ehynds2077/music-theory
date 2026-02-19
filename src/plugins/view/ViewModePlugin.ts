import { Plugin, PluginContext } from '../types';
import { ViewMode } from '../../scene/ViewManager';

export class ViewModePlugin implements Plugin {
  readonly id = 'view-mode';
  readonly name = 'View Mode';
  readonly tab = 'view' as const;
  readonly order = 10;

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label>View Mode</label>
      <div class="view-toggle">
        <button class="btn btn-active" data-view="spiral">Spiral</button>
        <button class="btn" data-view="concentric">Concentric</button>
        <button class="btn" data-view="fifths">Fifths</button>
      </div>
    `;

    const buttons = container.querySelectorAll('[data-view]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('btn-active'));
        btn.classList.add('btn-active');
        const mode = (btn as HTMLElement).dataset.view as ViewMode;
        ctx.eventBus.emit('view:toggle', mode);
      });
    });
  }
}
