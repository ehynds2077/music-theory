export interface IntervalDef {
  name: string;
  shortName: string;
  semitones: number;
  color: string;
}

export const INTERVALS: IntervalDef[] = [
  { name: 'Minor 2nd',       shortName: 'm2',  semitones: 1,  color: '#ff4444' },
  { name: 'Major 2nd',       shortName: 'M2',  semitones: 2,  color: '#ff8800' },
  { name: 'Minor 3rd',       shortName: 'm3',  semitones: 3,  color: '#ffcc00' },
  { name: 'Major 3rd',       shortName: 'M3',  semitones: 4,  color: '#88ff00' },
  { name: 'Perfect 4th',     shortName: 'P4',  semitones: 5,  color: '#00ff88' },
  { name: 'Tritone',         shortName: 'TT',  semitones: 6,  color: '#00ffff' },
  { name: 'Perfect 5th',     shortName: 'P5',  semitones: 7,  color: '#4488ff' },
  { name: 'Minor 6th',       shortName: 'm6',  semitones: 8,  color: '#8844ff' },
  { name: 'Major 6th',       shortName: 'M6',  semitones: 9,  color: '#cc44ff' },
  { name: 'Minor 7th',       shortName: 'm7',  semitones: 10, color: '#ff44cc' },
  { name: 'Major 7th',       shortName: 'M7',  semitones: 11, color: '#ff4488' },
  { name: 'Octave',          shortName: 'P8',  semitones: 12, color: '#ffffff' },
];
