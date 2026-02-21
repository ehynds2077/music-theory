import { eventBus } from '../utils/eventBus';
import { getNoteByMidi, NoteInfo } from '../data/noteData';
import { NoteNode } from '../scene/NoteNode';

// Standard DAW keyboard layout
// Black keys: W  E     T  Y  U     O  P
// White keys: A  S  D  F  G  H  J  K  L  ;
// Notes:      C  D  E  F  G  A  B  C  D  E
const KEY_TO_SEMITONE: Record<string, number> = {
  // White keys (bottom row)
  'a': 0,   // C
  's': 2,   // D
  'd': 4,   // E
  'f': 5,   // F
  'g': 7,   // G
  'h': 9,   // A
  'j': 11,  // B
  'k': 12,  // C+1
  'l': 14,  // D+1
  ';': 16,  // E+1
  // Black keys (top row)
  'w': 1,   // C#
  'e': 3,   // D#
  't': 6,   // F#
  'y': 8,   // G#
  'u': 10,  // A#
  'o': 13,  // C#+1
  'p': 15,  // D#+1
};

const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;

export class KeyboardInputManager {
  private octave = 4;
  private activeKeys = new Set<string>();
  private activeMidi = new Map<string, number>(); // key → currently-sounding MIDI
  private noteNodes: Map<number, NoteNode>;

  constructor(noteNodes: NoteNode[]) {
    this.noteNodes = new Map(noteNodes.map((n) => [n.noteInfo.midiNumber, n]));

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    eventBus.on('keyboard:shiftOctave', (delta: number) => {
      this.shiftOctave(delta);
    });
  }

  private isInputFocused(e: KeyboardEvent): boolean {
    const tag = (e.target as HTMLElement)?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  private keyToMidi(key: string): number | null {
    const semitone = KEY_TO_SEMITONE[key];
    if (semitone === undefined) return null;
    // MIDI: C4 = 60, octave N starts at (N+1)*12
    const midi = (this.octave + 1) * 12 + semitone;
    // Clamp to piano range 21–108
    if (midi < 21 || midi > 108) return null;
    return midi;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.isInputFocused(e)) return;

    const key = e.key.toLowerCase();

    // Octave shifting
    if (key === 'z') {
      e.preventDefault();
      this.shiftOctave(-1);
      return;
    }
    if (key === 'x') {
      e.preventDefault();
      this.shiftOctave(1);
      return;
    }

    // Prevent key repeat
    if (this.activeKeys.has(key)) return;

    const midi = this.keyToMidi(key);
    if (midi === null) return;

    e.preventDefault();

    const note = getNoteByMidi(midi);
    if (!note) return;

    this.activeKeys.add(key);
    this.activeMidi.set(key, midi);

    // Set visual state
    const node = this.noteNodes.get(midi);
    if (node) node.playing = true;

    eventBus.emit('note:on', note);
    eventBus.emit('keyboard:noteOn', { note, key });

    // Add to unified selection (silent to avoid double audio)
    eventBus.emit('selection:add', [midi], { silent: true });
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    if (!this.activeKeys.has(key)) return;
    this.activeKeys.delete(key);

    // Use the MIDI that was sounding when this key was pressed
    const midi = this.activeMidi.get(key);
    this.activeMidi.delete(key);

    if (midi === undefined) return;

    const note = getNoteByMidi(midi);
    if (!note) return;

    // Clear visual state
    const node = this.noteNodes.get(midi);
    if (node) node.playing = false;

    eventBus.emit('note:off', note);
    eventBus.emit('keyboard:noteOff', { note, key });
  }

  private onBlur(): void {
    this.releaseAll();
  }

  private releaseAll(): void {
    for (const [key, midi] of this.activeMidi) {
      const note = getNoteByMidi(midi);
      if (note) {
        const node = this.noteNodes.get(midi);
        if (node) node.playing = false;
        eventBus.emit('note:off', note);
        eventBus.emit('keyboard:noteOff', { note, key });
      }
    }
    this.activeKeys.clear();
    this.activeMidi.clear();
  }

  private shiftOctave(delta: number): void {
    const newOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, this.octave + delta));
    if (newOctave === this.octave) return;
    this.releaseAll();
    this.octave = newOctave;
    eventBus.emit('keyboard:octaveChanged', this.octave);
  }

  destroy(): void {
    this.releaseAll();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
