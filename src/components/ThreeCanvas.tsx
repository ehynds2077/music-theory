import { useRef, useEffect } from 'react';
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
import { eventBus } from '../utils/eventBus';
import { LabelMode } from '../scene/NoteNode';

export function ThreeCanvas({ onAudioReady }: { onAudioReady?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sceneManager = new SceneManager(container);
    const spiral = new SpiralBuilder(sceneManager.scene);
    new SpiralConnections(sceneManager.scene, spiral.noteNodes);
    new IntervalVisualizer(sceneManager.scene, spiral.noteNodes);
    new ViewManager(sceneManager.scene, spiral.noteNodes);
    new ShapeVisualizer(sceneManager.scene, spiral.noteNodes);
    new LiveChordVisualizer(sceneManager.scene, spiral.noteNodes);
    new ClockOverlay(sceneManager.scene);
    const cameraCtrl = new CameraController(
      sceneManager.camera,
      sceneManager.renderer.domElement,
    );

    new RaycastPicker(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      spiral.getAllMeshes(),
    );
    new SelectionManager(spiral.noteNodes);
    new KeyboardInputManager(spiral.noteNodes);

    const audio = new AudioEngine();

    const handleLabelMode = (mode: LabelMode) => {
      for (const node of spiral.noteNodes) {
        node.setLabelMode(mode);
      }
    };
    eventBus.on('labels:mode', handleLabelMode);

    if (onAudioReady) {
      eventBus.on('audio:ready', onAudioReady);
    }

    let running = true;
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      cameraCtrl.update();
      sceneManager.render();
    }
    animate();

    return () => {
      running = false;
      eventBus.off('labels:mode', handleLabelMode);
      if (onAudioReady) {
        eventBus.off('audio:ready', onAudioReady);
      }
      audio.dispose();
      sceneManager.dispose();
    };
  }, []);

  return <div ref={containerRef} className="three-canvas" />;
}
