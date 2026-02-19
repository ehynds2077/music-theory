import { Plugin, PluginContext } from '../types';
import { CameraPreset } from '../../scene/CameraController';

export class CameraPlugin implements Plugin {
  readonly id = 'camera';
  readonly name = 'Camera';
  readonly tab = 'view' as const;
  readonly order = 20;

  init(container: HTMLElement, ctx: PluginContext): void {
    container.innerHTML = `
      <label>Camera View</label>
      <div class="camera-presets">
        <button class="btn" data-preset="default">Default</button>
        <button class="btn" data-preset="top">Top Down</button>
        <button class="btn" data-preset="side">Side</button>
      </div>
    `;

    container.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn as HTMLElement).dataset.preset as CameraPreset;
        ctx.eventBus.emit('camera:preset', preset);
      });
    });
  }
}
