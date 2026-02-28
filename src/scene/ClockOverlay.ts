import * as THREE from 'three';
import { EventBus } from '../utils/eventBus';
import { ViewMode } from './ViewManager';

const CLOCK_RADIUS = 26; // just outside outermost octave ring

export class ClockOverlay {
  private scene: THREE.Scene;
  private sprites: THREE.Sprite[] = [];
  private visible = false;
  private currentMode: ViewMode = 'spiral';

  constructor(scene: THREE.Scene, bus: EventBus) {
    this.scene = scene;
    this.createSprites();
    this.updateVisibility();

    bus.on('clock:toggle', () => {
      this.visible = !this.visible;
      this.updateVisibility();
    });

    bus.on('view:toggle', (mode: ViewMode) => {
      this.currentMode = mode;
      this.updateVisibility();
    });
  }

  private createSprites(): void {
    for (let i = 0; i < 12; i++) {
      const sprite = this.createNumberSprite(String(i));
      // Fixed positions — does NOT rotate with root changes
      const angle = -((i * Math.PI * 2) / 12);
      sprite.position.set(
        Math.sin(angle) * CLOCK_RADIUS,
        0.1,
        Math.cos(angle) * CLOCK_RADIUS
      );
      this.scene.add(sprite);
      this.sprites.push(sprite);
    }
  }

  private createNumberSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#000000';
    ctx.fillText(text, 33, 33);
    ctx.fillStyle = '#a0a0c0';
    ctx.fillText(text, 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 1.5, 1);
    return sprite;
  }

  private updateVisibility(): void {
    // Auto-hide in spiral mode; only show in concentric when toggled on
    const show = this.visible && this.currentMode === 'concentric';
    for (const sprite of this.sprites) {
      sprite.visible = show;
    }
  }
}
