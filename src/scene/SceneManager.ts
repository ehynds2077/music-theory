import * as THREE from 'three';

export interface SceneManagerOptions {
  pixelRatio?: number;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  private container: HTMLElement;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, options?: SceneManagerOptions) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d1a);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
    this.camera.position.set(14, 25, 14);
    this.camera.lookAt(0, 20, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    const pr = options?.pixelRatio ?? Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 30, 10);
    this.scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0x8888ff, 0.3);
    dir2.position.set(-10, 10, -10);
    this.scene.add(dir2);

    // Resize via ResizeObserver (works for embedded containers)
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
