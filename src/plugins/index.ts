import { PluginManager } from './PluginManager';
import { RootAndShapePlugin } from './explore/RootAndShapePlugin';
import { IntervalPlugin } from './explore/IntervalPlugin';
import { ViewModePlugin } from './view/ViewModePlugin';
import { CameraPlugin } from './view/CameraPlugin';
import { ClockOverlayPlugin } from './view/ClockOverlayPlugin';
import { LabelModePlugin } from './view/LabelModePlugin';
import { SelectionControlsPlugin } from './play/SelectionControlsPlugin';
import { KeyboardPlugin } from './play/KeyboardPlugin';

export function registerAllPlugins(manager: PluginManager): void {
  // Explore tab
  manager.register(new RootAndShapePlugin());
  manager.register(new IntervalPlugin());

  // View tab
  manager.register(new ViewModePlugin());
  manager.register(new CameraPlugin());
  manager.register(new ClockOverlayPlugin());
  manager.register(new LabelModePlugin());

  // Play tab
  manager.register(new KeyboardPlugin());
  manager.register(new SelectionControlsPlugin());
}

export { PluginManager } from './PluginManager';
export type { Plugin, PluginContext, TabId } from './types';
