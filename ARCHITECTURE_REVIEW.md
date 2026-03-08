# Architecture Review: music-theory

## Overview

React + Three.js web application that visualizes music theory concepts as a 3D chromatic spiral/helix. Uses Vite for bundling, TypeScript throughout, and `@tonejs/piano` for audio. ~2,200 lines across ~35 files.

---

## Part 1: What's Good

### 1. Clean separation of concerns
The project is divided into well-named directories that map to clear responsibilities:
- `data/` — pure data definitions (notes, chords, scales, intervals)
- `scene/` — Three.js visualization classes
- `interaction/` — input handling (raycast picking, keyboard, selection)
- `audio/` — sound engine
- `engine/` — the orchestrator (`SpiralEngine`)
- `components/` / `pages/` — React UI layer

### 2. The EventBus pattern is a good fit
For bridging imperative Three.js code with React UI, the `EventBus` provides clean decoupling. Visualization classes don't know about React components and vice versa. The `SpiralContext` + `useSpiralBus()` hook is a tidy way to provide it to the React tree.

### 3. Data files are pure and declarative
`chords.ts`, `scales.ts`, `intervals.ts`, and `noteData.ts` are clean data definitions with simple interfaces. `generateNoteData()` computes all derived properties upfront. The `MIDI_MAP` lookup is efficient.

### 4. Good resource cleanup discipline
Most Three.js classes properly dispose geometries, materials, and textures. `SpiralEngine.dispose()` chains cleanup. `RaycastPicker` uses arrow functions for event handler binding. `KeyboardInputManager.destroy()` removes window listeners.

### 5. Reasonable component granularity
The sidebar is split into focused panels (`ChordsPanel`, `ModesPanel`, `IntervalPanel`, etc.) rather than being one monolith.

### 6. Well-designed `MusicSpiral` component
Reusable wrapper that supports multiple sizes, optional interactivity, and uses `IntersectionObserver` to pause rendering when offscreen.

---

## Part 2: Issues & Improvement Opportunities

### A. Architectural Issues

#### 1. Untyped EventBus — the biggest weakness
**File:** `src/utils/eventBus.ts:1-20`

The `EventBus` uses `string` event names and `any[]` args. This means:
- No compile-time checking that `bus.emit('note:on', ...)` passes the right payload
- No autocomplete for event names
- Typos in event names silently fail
- The implicit event contract is scattered across ~15 files with no central definition

**Recommendation:** Create a typed event map:
```ts
interface SpiralEvents {
  'note:on': [NoteInfo];
  'note:off': [NoteInfo];
  'note:click': [NoteNode];
  'shape:show': [ShapePayload];
  'view:toggle': [ViewMode];
  // ... all events
}

class EventBus<T extends Record<string, any[]>> {
  on<K extends keyof T>(event: K, fn: (...args: T[K]) => void): void;
  emit<K extends keyof T>(event: K, ...args: T[K]): void;
}
```

#### 2. Fire-and-forget constructors in `SpiralEngine`
**File:** `src/engine/SpiralEngine.ts:50-55`

Six objects are created with `new` but never stored. They live only because they attach listeners to the EventBus. If you ever need to dispose them, you can't.

**Recommendation:** Store them in an array or named fields, and give them `dispose()` methods.

#### 3. Duplicated animation infrastructure
**Files:** `src/scene/ViewManager.ts` and `src/scene/SpiralConnections.ts`

Both independently implement `easeInOutCubic()`, manual rAF loops, and position lerping.

**Recommendation:** Extract a `Tween` or `AnimationLoop` utility.

#### 4. Unsafe `any` cast for raycasting
**Files:** `src/scene/NoteNode.ts:68`, `src/interaction/RaycastPicker.ts:54`

**Recommendation:** Use Three.js's `userData` property instead of `(mesh as any).noteNode`.

### B. Code Quality Issues

#### 5. Repeated `NOTE_NAMES` constant
Defined in 4+ separate files.

**Recommendation:** Export from `noteData.ts` and import everywhere.

#### 6. Repeated `nodesByMidi` Map construction
Built identically in 4 classes.

**Recommendation:** Compute once in `SpiralEngine` or add to `SpiralBuilder`.

#### 7. `ALL_NOTES.find()` used instead of `getNoteByMidi()`
**Files:** `ModesPanel.tsx:42,77`, `RootAndShapePanel.tsx:52`

**Recommendation:** Replace with the existing `getNoteByMidi()` function.

#### 8. Repeated `Tone.start()` guard in `AudioEngine`
**File:** `src/audio/AudioEngine.ts` — copy-pasted in 4 methods.

**Recommendation:** Extract to `private async ensureContext()`.

#### 9. Duplicate Three.js geometry cleanup pattern
Seen in 5+ classes, slightly different each time.

**Recommendation:** Create a `disposeObject(scene, obj)` utility.

#### 10. Modes data duplicated from scales
**File:** `src/components/sidebar/ModesPanel.tsx:27-34`

**Recommendation:** Derive from the scales data or consolidate.

### C. React-Specific Issues

#### 11. Missing dependency arrays in `MusicSpiral` effects
**File:** `src/components/MusicSpiral.tsx:88` — empty deps array but uses several props.

#### 12. Tab panels always mounted
**File:** `src/components/sidebar/Sidebar.tsx:24-41` — hidden with `display: none` rather than conditional rendering.

### D. Missing Infrastructure

#### 13. No tests
No test files, framework, or scripts configured. The pure data/utility files are very testable.

#### 14. No linting or formatting
No ESLint or Prettier configured.

#### 15. No `dispose()` on `RaycastPicker`
Adds 3 event listeners but has no cleanup method.

---

## Summary

| Category | Rating | Notes |
|----------|--------|-------|
| Directory structure | Great | Clear, well-organized domains |
| TypeScript usage | Good | Used throughout, but EventBus `any` undermines it |
| Component architecture | Good | Appropriate granularity |
| Code duplication | Fair | Several constants and patterns repeated |
| Resource management | Good | Most cleanup is handled, a few gaps |
| Testability | Poor | No tests, but code is structured to be testable |
| Type safety | Fair | EventBus `any` is a systemic hole |

## Priority Refactoring Order

1. **Type the EventBus** — highest impact, prevents an entire class of bugs
2. **Store visualizer references in SpiralEngine** — prevents memory leaks, enables disposal
3. **Consolidate `NOTE_NAMES` and `nodesByMidi`** — quick wins for DRY
4. **Replace `ALL_NOTES.find()` with `getNoteByMidi()`** — correctness + performance
5. **Extract animation utility** — removes duplication, makes transitions composable
6. **Add `dispose()` to `RaycastPicker`** — prevents listener leaks
7. **Extract `ensureContext()` in AudioEngine** — minor cleanup
8. **Add Vitest for data/utility tests** — build confidence for refactoring
