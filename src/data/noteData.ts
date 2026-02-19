export interface NoteInfo {
  midiNumber: number;
  name: string;        // e.g. "C", "C#", "D"
  octave: number;
  fullName: string;    // e.g. "C#4"
  frequency: number;
  isBlack: boolean;
  chromaticIndex: number;  // 0-11 (C=0, C#=1, ... B=11)
  spiralAngle: number;     // radians, position around the circle
  spiralY: number;         // height along the helix
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_INDICES = new Set([1, 3, 6, 8, 10]); // C#, D#, F#, G#, A#

const HELIX_RADIUS = 6;
const Y_PER_SEMITONE = 0.5;

export function generateNoteData(): NoteInfo[] {
  const notes: NoteInfo[] = [];

  for (let midi = 21; midi <= 108; midi++) {
    const chromaticIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTE_NAMES[chromaticIndex];
    const fullName = `${name}${octave}`;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const isBlack = BLACK_INDICES.has(chromaticIndex);

    // Spiral position: each semitone = 30 degrees (360/12)
    // Angle starts with C at top (12 o'clock), going counter-clockwise
    const spiralAngle = -((chromaticIndex * Math.PI * 2) / 12);
    const spiralY = (midi - 21) * Y_PER_SEMITONE;

    notes.push({
      midiNumber: midi,
      name,
      octave,
      fullName,
      frequency,
      isBlack,
      chromaticIndex,
      spiralAngle,
      spiralY,
    });
  }

  return notes;
}

export const ALL_NOTES = generateNoteData();

const MIDI_MAP = new Map<number, NoteInfo>(
  ALL_NOTES.map((n) => [n.midiNumber, n])
);

export function getNoteByMidi(midi: number): NoteInfo | undefined {
  return MIDI_MAP.get(midi);
}

export { HELIX_RADIUS, Y_PER_SEMITONE };
