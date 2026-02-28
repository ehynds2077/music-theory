import * as THREE from 'three';
import { NoteInfo, HELIX_RADIUS } from '../data/noteData';

// One distinct color per pitch class (C=0 through B=11)
export const PITCH_COLORS: THREE.Color[] = [
  new THREE.Color(0x4488ff), // C  - blue
  new THREE.Color(0x6644ee), // C# - indigo
  new THREE.Color(0xaa44dd), // D  - purple
  new THREE.Color(0xdd44aa), // D# - magenta
  new THREE.Color(0xff4466), // E  - red
  new THREE.Color(0xff8833), // F  - orange
  new THREE.Color(0xffcc22), // F# - yellow
  new THREE.Color(0x88dd22), // G  - lime
  new THREE.Color(0x22cc66), // G# - green
  new THREE.Color(0x22ddaa), // A  - teal
  new THREE.Color(0x22ccdd), // A# - cyan
  new THREE.Color(0x2288ee), // B  - sky blue
];

const PLAYING_EMISSIVE = new THREE.Color(0xffcc00);
const SELECTED_EMISSIVE = new THREE.Color(0xffffff);
const HOVER_EMISSIVE = new THREE.Color(0x444444);
const HIGHLIGHT_EMISSIVE = new THREE.Color(0x888888);

export type LabelMode = 'letters' | 'numbers';

export class NoteNode {
  readonly noteInfo: NoteInfo;
  readonly mesh: THREE.Mesh;
  readonly group: THREE.Group;

  private material: THREE.MeshStandardMaterial;
  private _playing = false;
  private _selected = false;
  private _hovered = false;
  private _highlighted = false;
  private baseScale: number;
  labelSprite: THREE.Sprite;
  private labelMode: LabelMode = 'letters';

  constructor(noteInfo: NoteInfo) {
    this.noteInfo = noteInfo;
    this.group = new THREE.Group();

    // Sphere
    const radius = noteInfo.isBlack ? 0.25 : 0.35;
    this.baseScale = 1;
    const geo = new THREE.SphereGeometry(radius, 16, 12);
    this.material = new THREE.MeshStandardMaterial({
      color: PITCH_COLORS[noteInfo.chromaticIndex],
      roughness: 0.3,
      metalness: 0.2,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.group.add(this.mesh);

    // Label sprite
    this.labelSprite = this.createLabel(noteInfo.fullName);
    this.labelSprite.position.set(0, radius + 0.4, 0);
    this.group.add(this.labelSprite);

    // Position on helix
    const x = Math.sin(noteInfo.spiralAngle) * HELIX_RADIUS;
    const z = Math.cos(noteInfo.spiralAngle) * HELIX_RADIUS;
    this.group.position.set(x, noteInfo.spiralY, z);

    // Store reference for raycasting
    (this.mesh as any).noteNode = this;
  }

  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Slight shadow for readability
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 65, 33);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 64, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.6, 1);
    return sprite;
  }

  private getLabelText(): string {
    if (this.labelMode === 'numbers') {
      return String(this.noteInfo.chromaticIndex);
    }
    return this.noteInfo.fullName;
  }

  setLabelMode(mode: LabelMode): void {
    if (mode === this.labelMode) return;
    this.labelMode = mode;

    // Dispose old sprite
    const oldPos = this.labelSprite.position.clone();
    this.group.remove(this.labelSprite);
    (this.labelSprite.material as THREE.SpriteMaterial).map?.dispose();
    (this.labelSprite.material as THREE.SpriteMaterial).dispose();

    // Create new sprite
    this.labelSprite = this.createLabel(this.getLabelText());
    this.labelSprite.position.copy(oldPos);
    this.group.add(this.labelSprite);
  }

  get playing(): boolean {
    return this._playing;
  }

  set playing(val: boolean) {
    this._playing = val;
    this.updateVisual();
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(val: boolean) {
    this._selected = val;
    this.updateVisual();
  }

  get hovered(): boolean {
    return this._hovered;
  }

  set hovered(val: boolean) {
    this._hovered = val;
    this.updateVisual();
  }

  get highlighted(): boolean {
    return this._highlighted;
  }

  set highlighted(val: boolean) {
    this._highlighted = val;
    this.updateVisual();
  }

  private updateVisual(): void {
    if (this._playing) {
      this.material.emissive.copy(PLAYING_EMISSIVE);
      this.material.emissiveIntensity = 1.2;
      this.group.scale.setScalar(1.35);
    } else if (this._selected) {
      this.material.emissive.copy(SELECTED_EMISSIVE);
      this.material.emissiveIntensity = 1.0;
      this.group.scale.setScalar(1.3);
    } else if (this._hovered) {
      this.material.emissive.copy(HOVER_EMISSIVE);
      this.material.emissiveIntensity = 0.5;
      this.group.scale.setScalar(1.1);
    } else if (this._highlighted) {
      this.material.emissive.copy(HIGHLIGHT_EMISSIVE);
      this.material.emissiveIntensity = 0.3;
      this.group.scale.setScalar(1.15);
    } else {
      this.material.emissive.set(0x000000);
      this.material.emissiveIntensity = 0;
      this.group.scale.setScalar(1.0);
    }
  }
}
