import { Plugin, PluginContext } from '../types';
import { INTERVALS } from '../../data/intervals';

export class IntervalPlugin implements Plugin {
  readonly id = 'interval';
  readonly name = 'Interval Highlight';
  readonly tab = 'explore' as const;
  readonly order = 20;

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label for="interval-select">Interval Highlight</label>
      <select id="interval-select">
        <option value="">— None —</option>
        ${INTERVALS.map(
          (iv, i) =>
            `<option value="${i}">${iv.name} (${iv.shortName}) — ${iv.semitones} semitones</option>`
        ).join('')}
      </select>
    `;

    const select = container.querySelector('#interval-select') as HTMLSelectElement;
    select.addEventListener('change', () => {
      const val = select.value;
      if (val === '') {
        ctx.eventBus.emit('interval:select', null);
      } else {
        ctx.eventBus.emit('interval:select', INTERVALS[parseInt(val)]);
      }
    });
  }
}
