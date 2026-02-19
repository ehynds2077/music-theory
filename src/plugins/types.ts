import * as THREE from 'three';
import { NoteNode } from '../scene/NoteNode';
import { EventBus } from '../utils/eventBus';

export type TabId = 'explore' | 'view' | 'play' | 'export';

export interface PluginContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  noteNodes: NoteNode[];
  eventBus: EventBus;
}

export interface Plugin {
  readonly id: string;
  readonly name: string;
  readonly tab: TabId;
  readonly order?: number;
  init(container: HTMLElement, ctx: PluginContext): void;
  activate?(): void;
  deactivate?(): void;
  destroy?(): void;
}
