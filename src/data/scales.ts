export interface ScaleDef {
  name: string;
  intervals: number[]; // semitone offsets from root, starts with 0
}

export const SCALES: ScaleDef[] = [
  { name: 'Major',             intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor',     intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor',    intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor',     intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Pentatonic Major',  intervals: [0, 2, 4, 7, 9] },
  { name: 'Pentatonic Minor',  intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues',             intervals: [0, 3, 5, 6, 7, 10] },
  { name: 'Dorian',           intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Mixolydian',       intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Phrygian',         intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian',           intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Locrian',          intervals: [0, 1, 3, 5, 6, 8, 10] },
  { name: 'Whole Tone',       intervals: [0, 2, 4, 6, 8, 10] },
  { name: 'Chromatic',        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];
