import { Plugin, PluginContext } from '../types';

export class ClockOverlayPlugin implements Plugin {
  readonly id = 'clock-overlay';
  readonly name = 'Clock Overlay';
  readonly tab = 'view' as const;
  readonly order = 30;

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label class="checkbox-label">
        <input type="checkbox" id="clock-toggle"> Clock Overlay
      </label>
    `;

    container.querySelector('#clock-toggle')!.addEventListener('change', () => {
      ctx.eventBus.emit('clock:toggle');
    });
  }
}
