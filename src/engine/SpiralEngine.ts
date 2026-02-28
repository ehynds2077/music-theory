import { EventBus } from '../utils/eventBus';
import { SceneManager } from '../scene/SceneManager';
import { SpiralBuilder } from '../scene/SpiralBuilder';
import { SpiralConnections } from '../scene/SpiralConnections';
import { IntervalVisualizer } from '../scene/IntervalVisualizer';
import { ViewManager } from '../scene/ViewManager';
import { ShapeVisualizer } from '../scene/ShapeVisualizer';
import { LiveChordVisualizer } from '../scene/LiveChordVisualizer';
import { ClockOverlay } from '../scene/ClockOverlay';
import { CameraController } from '../scene/CameraController';
import { RaycastPicker } from '../interaction/RaycastPicker';
import { SelectionManager } from '../interaction/SelectionManager';
import { KeyboardInputManager } from '../interaction/KeyboardInputManager';
import { AudioEngine } from '../audio/AudioEngine';
import { LabelMode } from '../scene/NoteNode';

export interface SpiralEngineOptions {
  container: HTMLElement;
  interactive?: boolean;
  enableAudio?: boolean;
  showLabels?: boolean;
  pixelRatio?: number;
}

export class SpiralEngine {
  readonly bus: EventBus;
  readonly sceneManager: SceneManager;
  readonly spiral: SpiralBuilder;

  private cameraCtrl: CameraController;
  private keyboardInput: KeyboardInputManager | null = null;
  private audio: AudioEngine | null = null;
  private running = false;
  private animFrameId = 0;

  constructor(options: SpiralEngineOptions) {
    const {
      container,
      interactive = true,
      enableAudio = true,
      showLabels = true,
      pixelRatio,
    } = options;

    this.bus = new EventBus();

    this.sceneManager = new SceneManager(container, { pixelRatio });
    this.spiral = new SpiralBuilder(this.sceneManager.scene);

    new SpiralConnections(this.sceneManager.scene, this.spiral.noteNodes, this.bus);
    new IntervalVisualizer(this.sceneManager.scene, this.spiral.noteNodes, this.bus);
    new ViewManager(this.sceneManager.scene, this.spiral.noteNodes, this.bus);
    new ShapeVisualizer(this.sceneManager.scene, this.spiral.noteNodes, this.bus);
    new LiveChordVisualizer(this.sceneManager.scene, this.spiral.noteNodes, this.bus);
    new ClockOverlay(this.sceneManager.scene, this.bus);

    this.cameraCtrl = new CameraController(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
      this.bus,
    );

    if (interactive) {
      new RaycastPicker(
        this.sceneManager.camera,
        this.sceneManager.renderer.domElement,
        this.spiral.getAllMeshes(),
        this.bus,
      );
      new SelectionManager(this.spiral.noteNodes, this.bus);
      this.keyboardInput = new KeyboardInputManager(this.spiral.noteNodes, this.bus);
    }

    if (enableAudio) {
      this.audio = new AudioEngine(this.bus);
    }

    if (!showLabels) {
      for (const node of this.spiral.noteNodes) {
        node.labelSprite.visible = false;
      }
    }

    // Handle label mode changes
    this.bus.on('labels:mode', (mode: LabelMode) => {
      for (const node of this.spiral.noteNodes) {
        node.setLabelMode(mode);
      }
    });

    if (!interactive) {
      this.cameraCtrl.controls.enabled = false;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const animate = () => {
      if (!this.running) return;
      this.animFrameId = requestAnimationFrame(animate);
      this.cameraCtrl.update();
      this.sceneManager.render();
    };
    animate();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
  }

  dispose(): void {
    this.stop();
    this.keyboardInput?.destroy();
    this.audio?.dispose();
    this.sceneManager.dispose();
  }
}
