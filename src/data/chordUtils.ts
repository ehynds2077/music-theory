import { ChordDef } from './chords';
import { getNoteByMidi, NoteInfo } from './noteData';

/**
 * Compute MIDI note numbers for a chord voicing with inversions.
 * Inversions work by moving the lowest note up an octave, repeated N times.
 *
 * Example (C Major, root=0, baseOctave=4):
 *   Root position: [60, 64, 67]
 *   1st inversion: [64, 67, 72]  (60 moved up to 72)
 *   2nd inversion: [67, 72, 76]  (64 moved up to 76)
 */
export function computeChordMidi(
  rootIndex: number,
  chord: ChordDef,
  inversion: number,
  baseOctave = 4,
): number[] {
  const baseMidi = (baseOctave + 1) * 12 + rootIndex;
  const midiNotes = chord.intervals.map((interval) => baseMidi + interval);

  // Apply inversions: move the lowest note up an octave N times
  for (let i = 0; i < inversion; i++) {
    midiNotes.sort((a, b) => a - b);
    midiNotes[0] += 12;
  }

  return midiNotes.sort((a, b) => a - b);
}

/**
 * Convert MIDI numbers to NoteInfo[], filtering out-of-range notes (21-108).
 */
export function midiToNoteInfos(midiNotes: number[]): NoteInfo[] {
  const results: NoteInfo[] = [];
  for (const midi of midiNotes) {
    if (midi < 21 || midi > 108) continue;
    const note = getNoteByMidi(midi);
    if (note) results.push(note);
  }
  return results;
}

/**
 * Maximum inversion index for a chord (number of notes - 1).
 */
export function maxInversion(chord: ChordDef): number {
  return chord.intervals.length - 1;
}
