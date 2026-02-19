export interface ChordDef {
  name: string;
  intervals: number[]; // semitone offsets from root, starts with 0
}

export const CHORDS: ChordDef[] = [
  { name: 'Major',        intervals: [0, 4, 7] },
  { name: 'Minor',        intervals: [0, 3, 7] },
  { name: 'Diminished',   intervals: [0, 3, 6] },
  { name: 'Augmented',    intervals: [0, 4, 8] },
  { name: 'Maj7',         intervals: [0, 4, 7, 11] },
  { name: 'Min7',         intervals: [0, 3, 7, 10] },
  { name: 'Dom7',         intervals: [0, 4, 7, 10] },
  { name: 'Dim7',         intervals: [0, 3, 6, 9] },
  { name: 'Sus2',         intervals: [0, 2, 7] },
  { name: 'Sus4',         intervals: [0, 5, 7] },
  { name: 'Half-Dim 7th', intervals: [0, 3, 6, 10] },
  { name: 'Add9',         intervals: [0, 2, 4, 7] },
];
