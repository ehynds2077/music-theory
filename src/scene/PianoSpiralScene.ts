import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { computePianoLayout, PianoKeyLayout } from './PianoLayout';
import { PITCH_COLORS } from './NoteNode';
import { getNoteByMidi } from '../data/noteData';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---- Concentric view constants (must match ViewManager) ----
const CONCENTRIC_BASE_RADIUS = 3;
const CONCENTRIC_RING_SPACING = 3;

// ---- Flat spiral ----
const SPIRAL_INNER_R = 0.3;
const SPIRAL_OUTER_R = 24;

// ---- Timing ----
const KEY_ROLL_MS = 2000;
const KEY_STAGGER_MS = 22;
const PHASE2_MS = 2500;

// ---- Types ----

interface KeyData {
  group: THREE.Group;
  box: THREE.Mesh;
  sphere: THREE.Mesh;
  boxMat: THREE.MeshStandardMaterial;
  sphereMat: THREE.MeshStandardMaterial;
  pianoPos: THREE.Vector3;

  // Polar coords relative to anchor (for winding interpolation)
  r_piano: number;
  theta_piano: number;
  r_spiral: number;
  theta_spiral: number;

  flatSpiralPos: THREE.Vector3;
  concentricPos: THREE.Vector3;
  midi: number;
  keyIndex: number;
  labelSprite: THREE.Sprite;
  labelMat: THREE.SpriteMaterial;
}

// ===========================================================================

export class PianoSpiralScene {
  private sceneManager: SceneManager;
  private controls: OrbitControls;
  private keys: KeyData[] = [];
  private animId = 0;
  private progress = 0;
  private playing = false;
  private startTime = 0;
  private disposed = false;

  // The low-end key is the anchor; the spiral forms around it.
  private anchorX = 0;
  private anchorZ = 0;

  // Connecting line between all keys
  private line!: THREE.Line;
  private linePositions!: Float32Array;
  private lineMat!: THREE.LineBasicMaterial;

  private phase1Ms = 0;
  private totalMs = 0;

  // Camera keyframes:
  //   cam0 = initial top-down over the piano
  //   cam1 = top-down centered on the spiral (at anchor)
  //   cam2 = top-down centered on concentric view (at origin)
  private cam0Pos = new THREE.Vector3();
  private cam0Target = new THREE.Vector3();
  private cam1Pos = new THREE.Vector3();
  private cam1Target = new THREE.Vector3();
  private cam2Pos = new THREE.Vector3(0, 45, 0.01);
  private cam2Target = new THREE.Vector3(0, 0, 0);

  onProgressChange?: (p: number) => void;
  onPlayStateChange?: (p: boolean) => void;

  constructor(container: HTMLElement) {
    this.sceneManager = new SceneManager(container);
    this.controls = new OrbitControls(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement,
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;

    this.buildScene();

    this.phase1Ms = (this.keys.length - 1) * KEY_STAGGER_MS + KEY_ROLL_MS;
    this.totalMs = this.phase1Ms + PHASE2_MS;

    // Camera: start top-down, centered on the piano (origin)
    this.cam0Pos.set(0, 28, 0.01);
    this.cam0Target.set(0, 0, 0);
    // Phase 1 end: top-down, centered on the spiral anchor
    this.cam1Pos.set(this.anchorX, 35, 0.01);
    this.cam1Target.set(this.anchorX, 0, 0);

    this.applyProgress(0);
    this.startRenderLoop();
  }

  // ---- Build ----

  private buildScene() {
    const layout = computePianoLayout();

    // Anchor at the first (lowest) key's piano position
    this.anchorX = layout[0].position.x;
    this.anchorZ = layout[0].position.z;

    for (let i = 0; i < layout.length; i++) {
      this.addKey(layout[i], i);
    }

    // Build connecting line through all keys
    this.buildLine();
  }

  private buildLine() {
    const count = this.keys.length;
    this.linePositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const k = this.keys[i];
      // Initial positions (piano)
      this.linePositions[i * 3] = k.pianoPos.x;
      this.linePositions[i * 3 + 1] = k.pianoPos.y;
      this.linePositions[i * 3 + 2] = k.pianoPos.z;
      // Per-vertex color from pitch class
      const color = PITCH_COLORS[k.midi % 12];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      linewidth: 1,
    });

    this.line = new THREE.Line(geo, this.lineMat);
    this.sceneManager.scene.add(this.line);
  }

  private createLabel(text: string): { sprite: THREE.Sprite; mat: THREE.SpriteMaterial } {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#000000';
    ctx.fillText(text, 65, 33);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 64, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.6, 1);
    return { sprite, mat };
  }

  private addKey(key: PianoKeyLayout, keyIndex: number) {
    const chromaticIndex = key.midi % 12;
    const pitchColor = PITCH_COLORS[chromaticIndex].clone();
    const darkPitchColor = pitchColor.clone().multiplyScalar(key.isBlack ? 0.6 : 1.0);

    const group = new THREE.Group();

    // --- Box (piano key) ---
    const boxGeo = new THREE.BoxGeometry(key.size.x, key.size.y, key.size.z);
    const boxMat = new THREE.MeshStandardMaterial({
      color: darkPitchColor,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 1,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // --- Sphere (concentric-view node, hidden initially) ---
    const sphereRadius = key.isBlack ? 0.25 : 0.35;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 16, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: pitchColor,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.visible = false;
    group.add(sphere);

    // --- Label ---
    const noteName = getNoteByMidi(key.midi)?.fullName ?? '';
    const { sprite: labelSprite, mat: labelMat } = this.createLabel(noteName);
    labelSprite.position.y = key.size.y / 2 + 0.5;
    group.add(labelSprite);

    // --- Positions ---

    // 1. Piano position
    const pianoPos = key.position.clone();

    // 2. Polar coordinates of the piano position relative to the anchor.
    //    The piano extends along +X from the anchor, so most keys have
    //    theta ≈ 0 and r = distance from the anchor.
    const dx = pianoPos.x - this.anchorX;
    const dz = pianoPos.z - this.anchorZ;
    const r_piano = Math.sqrt(dx * dx + dz * dz);
    const theta_piano = Math.atan2(dz, dx);

    // 3. Flat spiral polar coordinates.
    //    12 keys per revolution so same-pitch-class notes align radially.
    //    Starting direction is +X (matching the piano strip direction).
    const theta_spiral = keyIndex * (Math.PI * 2 / 12);
    const r_spiral = SPIRAL_INNER_R + (SPIRAL_OUTER_R - SPIRAL_INNER_R) * (keyIndex / 87);

    // Pre-compute the final flat-spiral cartesian position (for phase 2 lerp)
    const flatSpiralPos = new THREE.Vector3(
      this.anchorX + r_spiral * Math.cos(theta_spiral),
      0,
      this.anchorZ + r_spiral * Math.sin(theta_spiral),
    );

    // 4. Concentric position (centered at origin, matches ViewManager)
    const octave = Math.floor(key.midi / 12) - 1;
    const octaveIndex = octave - 1;
    const concentricR = CONCENTRIC_BASE_RADIUS + octaveIndex * CONCENTRIC_RING_SPACING;
    const concentricAngle = -((chromaticIndex * Math.PI * 2) / 12);
    const concentricPos = new THREE.Vector3(
      Math.sin(concentricAngle) * concentricR,
      0,
      Math.cos(concentricAngle) * concentricR,
    );

    group.position.copy(pianoPos);
    this.sceneManager.scene.add(group);

    this.keys.push({
      group, box, sphere, boxMat, sphereMat,
      pianoPos,
      r_piano, theta_piano, r_spiral, theta_spiral,
      flatSpiralPos, concentricPos,
      midi: key.midi, keyIndex,
      labelSprite, labelMat,
    });
  }

  // ---- Animation ----

  private applyProgress(p: number) {
    this.progress = p;
    const tMs = p * this.totalMs;

    if (tMs <= this.phase1Ms) {
      // === Phase 1: Piano → Flat Spiral ===
      // Polar interpolation gives the winding / rolling-up motion.
      // Key 0 (the anchor) barely moves; higher keys sweep through
      // increasingly many revolutions as they coil around it.

      for (const k of this.keys) {
        const delay = k.keyIndex * KEY_STAGGER_MS;
        const raw = Math.max(0, Math.min(1, (tMs - delay) / KEY_ROLL_MS));
        const e = easeInOutCubic(raw);

        // Polar lerp: theta and r each blend independently
        const theta = k.theta_piano * (1 - e) + k.theta_spiral * e;
        const r = k.r_piano * (1 - e) + k.r_spiral * e;

        k.group.position.x = this.anchorX + r * Math.cos(theta);
        k.group.position.z = this.anchorZ + r * Math.sin(theta);
        k.group.position.y = k.pianoPos.y * (1 - e); // flatten to y=0

        // Rotate to follow the winding direction
        k.group.rotation.y = -(theta - k.theta_piano);

        // Scale: compress slightly as keys compact into the spiral
        k.group.scale.setScalar(1.0 - e * 0.3);

        // Boxes visible, spheres hidden
        k.boxMat.opacity = 1;
        k.box.visible = true;
        k.sphereMat.opacity = 0;
        k.sphere.visible = false;

        // Labels stay visible
        k.labelMat.opacity = 0.85;
        k.labelSprite.visible = true;
      }

      // Update connecting line positions
      this.updateLinePositions();
      this.lineMat.opacity = 1;
      this.line.visible = true;

      // Camera: pan from piano overview → spiral overview
      const camT = easeInOutCubic(tMs / this.phase1Ms);
      this.sceneManager.camera.position.lerpVectors(this.cam0Pos, this.cam1Pos, camT);
      this.controls.target.lerpVectors(this.cam0Target, this.cam1Target, camT);
    } else {
      // === Phase 2: Flat Spiral → Concentric (with crossfade) ===
      const phase2T = Math.min(1, (tMs - this.phase1Ms) / PHASE2_MS);
      const e2 = easeInOutCubic(phase2T);

      for (const k of this.keys) {
        // Position: flat spiral (at anchor) → concentric (at origin)
        k.group.position.lerpVectors(k.flatSpiralPos, k.concentricPos, e2);

        // Rotation eases to 0
        k.group.rotation.y = -(k.theta_spiral - k.theta_piano) * (1 - e2);

        // Scale back up
        k.group.scale.setScalar(0.7 + e2 * 0.3);

        // Crossfade: boxes out, spheres in
        const boxOpacity = Math.max(0, 1 - e2 * 1.8);
        const sphereOpacity = Math.max(0, Math.min(1, (e2 - 0.2) / 0.6));

        k.boxMat.opacity = boxOpacity;
        k.box.visible = boxOpacity > 0.01;
        k.sphereMat.opacity = sphereOpacity;
        k.sphere.visible = sphereOpacity > 0.01;

        // Labels fade out with boxes
        const labelOpacity = boxOpacity * 0.85;
        k.labelMat.opacity = labelOpacity;
        k.labelSprite.visible = labelOpacity > 0.01;
      }

      // Update connecting line positions and fade out
      this.updateLinePositions();
      this.lineMat.opacity = Math.max(0, 1 - e2 * 2);
      this.line.visible = this.lineMat.opacity > 0.01;

      // Camera: pan from spiral anchor → origin (concentric center)
      const camT = easeInOutCubic(phase2T);
      this.sceneManager.camera.position.lerpVectors(this.cam1Pos, this.cam2Pos, camT);
      this.controls.target.lerpVectors(this.cam1Target, this.cam2Target, camT);
    }

    this.controls.update();
    this.onProgressChange?.(p);
  }

  private updateLinePositions() {
    for (let i = 0; i < this.keys.length; i++) {
      const pos = this.keys[i].group.position;
      this.linePositions[i * 3] = pos.x;
      this.linePositions[i * 3 + 1] = pos.y;
      this.linePositions[i * 3 + 2] = pos.z;
    }
    (this.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private startRenderLoop() {
    const render = () => {
      if (this.disposed) return;
      requestAnimationFrame(render);
      this.controls.update();
      this.sceneManager.render();
    };
    render();
  }

  // ---- Playback controls ----

  play() {
    if (this.playing) return;
    this.playing = true;
    this.onPlayStateChange?.(true);

    if (this.progress >= 1) this.progress = 0;

    this.startTime = performance.now() - this.progress * this.totalMs;
    this.animId++;
    const id = this.animId;

    const tick = () => {
      if (id !== this.animId || !this.playing || this.disposed) return;
      const elapsed = performance.now() - this.startTime;
      const p = Math.min(elapsed / this.totalMs, 1);
      this.applyProgress(p);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        this.playing = false;
        this.onPlayStateChange?.(false);
      }
    };
    requestAnimationFrame(tick);
  }

  pause() {
    this.playing = false;
    this.animId++;
    this.onPlayStateChange?.(false);
  }

  reset() {
    this.pause();
    this.applyProgress(0);
  }

  setProgress(p: number) {
    this.pause();
    this.applyProgress(Math.max(0, Math.min(1, p)));
  }

  getProgress() { return this.progress; }
  isPlaying() { return this.playing; }

  dispose() {
    this.disposed = true;
    this.playing = false;
    this.animId++;
    for (const k of this.keys) {
      (k.labelMat.map as THREE.CanvasTexture)?.dispose();
      k.labelMat.dispose();
    }
    this.line.geometry.dispose();
    this.lineMat.dispose();
    this.controls.dispose();
    this.sceneManager.dispose();
  }
}
