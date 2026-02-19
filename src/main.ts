import { SceneManager } from './scene/SceneManager';
import { SpiralBuilder } from './scene/SpiralBuilder';
import { SpiralConnections } from './scene/SpiralConnections';
import { IntervalVisualizer } from './scene/IntervalVisualizer';
import { ViewManager } from './scene/ViewManager';
import { ShapeVisualizer } from './scene/ShapeVisualizer';
import { LiveChordVisualizer } from './scene/LiveChordVisualizer';
import { ClockOverlay } from './scene/ClockOverlay';
import { CameraController } from './scene/CameraController';
import { RaycastPicker } from './interaction/RaycastPicker';
import { SelectionManager } from './interaction/SelectionManager';
import { KeyboardInputManager } from './interaction/KeyboardInputManager';
import { AudioEngine } from './audio/AudioEngine';
import { SheetMusicRenderer } from './notation/SheetMusicRenderer';
import { PluginManager, registerAllPlugins } from './plugins';
import { InfoPanel } from './ui/InfoPanel';
import { eventBus } from './utils/eventBus';
import { LabelMode } from './scene/NoteNode';

// DOM elements
const canvasContainer = document.getElementById('canvas-container')!;
const controlsEl = document.getElementById('controls')!;
const infoPanelEl = document.getElementById('info-panel')!;
const sheetMusicEl = document.getElementById('sheet-music')!;
const loadingOverlay = document.getElementById('loading-overlay')!;

// Scene
const sceneManager = new SceneManager(canvasContainer);
const spiral = new SpiralBuilder(sceneManager.scene);
new SpiralConnections(sceneManager.scene, spiral.noteNodes);
new IntervalVisualizer(sceneManager.scene, spiral.noteNodes);
new ViewManager(sceneManager.scene, spiral.noteNodes);
new ShapeVisualizer(sceneManager.scene, spiral.noteNodes);
new LiveChordVisualizer(sceneManager.scene, spiral.noteNodes);
new ClockOverlay(sceneManager.scene);
const cameraCtrl = new CameraController(
  sceneManager.camera,
  sceneManager.renderer.domElement
);

// Interaction
new RaycastPicker(
  sceneManager.camera,
  sceneManager.renderer.domElement,
  spiral.getAllMeshes()
);
new SelectionManager();
new KeyboardInputManager(spiral.noteNodes);

// Audio
const audio = new AudioEngine();

// UI — plugin-based tabs
const pluginManager = new PluginManager(controlsEl, {
  scene: sceneManager.scene,
  camera: sceneManager.camera,
  renderer: sceneManager.renderer,
  noteNodes: spiral.noteNodes,
  eventBus,
});
registerAllPlugins(pluginManager);
pluginManager.init();

new InfoPanel(infoPanelEl);
new SheetMusicRenderer(sheetMusicEl);

// Label mode switching
eventBus.on('labels:mode', (mode: LabelMode) => {
  for (const node of spiral.noteNodes) {
    node.setLabelMode(mode);
  }
});

// Hide loading overlay when audio is ready (or after timeout)
const hideLoading = () => {
  loadingOverlay.classList.add('hidden');
};
eventBus.on('audio:ready', hideLoading);
setTimeout(hideLoading, 8000); // fallback

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  cameraCtrl.update();
  sceneManager.render();
}
animate();
