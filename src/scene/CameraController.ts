import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { eventBus } from '../utils/eventBus';

export type CameraPreset = 'default' | 'top' | 'side' | 'concentric';

export class CameraController {
  readonly controls: OrbitControls;
  private camera: THREE.PerspectiveCamera;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 20, 0);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.update();

    eventBus.on('camera:preset', (preset: CameraPreset) => {
      this.goToPreset(preset);
    });
  }

  goToPreset(preset: CameraPreset): void {
    switch (preset) {
      case 'default':
        this.camera.position.set(14, 25, 14);
        this.controls.target.set(0, 20, 0);
        break;
      case 'top':
        this.camera.position.set(0, 55, 0.01);
        this.controls.target.set(0, 20, 0);
        break;
      case 'side':
        this.camera.position.set(25, 22, 0);
        this.controls.target.set(0, 22, 0);
        break;
      case 'concentric':
        this.camera.position.set(0, 45, 0.01);
        this.controls.target.set(0, 0, 0);
        break;
    }
    this.controls.update();
  }

  update(): void {
    this.controls.update();
  }
}
