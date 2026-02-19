import * as THREE from 'three';
import { NoteNode } from '../scene/NoteNode';
import { eventBus } from '../utils/eventBus';

const DRAG_THRESHOLD = 5; // pixels

export class RaycastPicker {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private meshes: THREE.Mesh[];
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private mouseDownPos = { x: 0, y: 0 };

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    meshes: THREE.Mesh[]
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.meshes = meshes;

    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('pointermove', this.onPointerMove);
  }

  updateMeshes(meshes: THREE.Mesh[]): void {
    this.meshes = meshes;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.mouseDownPos.x = e.clientX;
    this.mouseDownPos.y = e.clientY;
  };

  private onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.mouseDownPos.x;
    const dy = e.clientY - this.mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return; // was a drag

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);

    if (hits.length > 0) {
      const node = (hits[0].object as any).noteNode as NoteNode;
      if (node) {
        eventBus.emit('note:click', node);
      }
    }
  };

  private currentHover: NoteNode | null = null;

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);

    let newHover: NoteNode | null = null;
    if (hits.length > 0) {
      newHover = (hits[0].object as any).noteNode as NoteNode ?? null;
    }

    if (newHover !== this.currentHover) {
      if (this.currentHover) {
        this.currentHover.hovered = false;
        eventBus.emit('note:hoverEnd', this.currentHover);
      }
      this.currentHover = newHover;
      if (this.currentHover) {
        this.currentHover.hovered = true;
        eventBus.emit('note:hover', this.currentHover);
      }
    }

    this.domElement.style.cursor = newHover ? 'pointer' : '';
  };
}
