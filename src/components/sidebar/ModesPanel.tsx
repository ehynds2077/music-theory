import { useState } from 'react';
import { ALL_NOTES, NoteInfo } from '../../data/noteData';
import { useSpiralBus } from '../../contexts/SpiralContext';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale degree indices (0-based into the intervals array, 7 = octave)
// Each melody highlights the characteristic sound of the mode
const MODE_MELODIES: number[][] = [
  // Ionian — bright, resolved, classic do-re-mi feel
  [0, 2, 4, 2, 4, 5, 4, 2, 0, 4, 7],
  // Dorian — smooth, jazzy, the natural 6th (degree 5) gives it lift
  [0, 2, 3, 4, 5, 4, 3, 2, 0, 2, 3, 4, 3, 0],
  // Phrygian — Spanish, the b2 (degree 1) is the signature move
  [4, 3, 2, 1, 0, 1, 0, 3, 4, 3, 2, 1, 0],
  // Lydian — dreamy, floating, the #4 (degree 3) creates wonder
  [0, 2, 3, 4, 6, 4, 3, 2, 0, 4, 6, 7],
  // Mixolydian — rock/blues swagger, the b7 (degree 6) pulls back down
  [0, 2, 4, 6, 4, 2, 4, 2, 0, 6, 0],
  // Aeolian — melancholic, the b6 and b3 give it sadness
  [0, 4, 3, 2, 0, 2, 3, 4, 5, 4, 3, 2, 0],
  // Locrian — unstable, dark, the b5 (degree 4) and b2 create tension
  [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 4, 3, 0],
];

const MODES = [
  { name: 'Ionian (Major)',  intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian',          intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian',        intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian',          intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian',      intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Aeolian (Minor)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian',         intervals: [0, 1, 3, 5, 6, 8, 10] },
];

function degreesToNotes(root: number, intervals: number[], degrees: number[]): NoteInfo[] {
  const notes: NoteInfo[] = [];
  for (const deg of degrees) {
    const semitones = deg === 7 ? 12 : intervals[deg];
    if (semitones === undefined) continue;
    const midi = 60 + root + semitones;
    const note = ALL_NOTES.find((n) => n.midiNumber === midi);
    if (note) notes.push(note);
  }
  return notes;
}

export function ModesPanel() {
  const bus = useSpiralBus();
  const [root, setRoot] = useState(0);
  const [modeIdx, setModeIdx] = useState(0);

  const applyMode = (r: number, idx: number) => {
    bus.emit('root:changed', r);
    bus.emit('shape:show', {
      root: r,
      intervals: MODES[idx].intervals,
      type: 'scale' as const,
    });
  };

  const handleRootClick = (i: number) => {
    setRoot(i);
    applyMode(i, modeIdx);
  };

  const handleModeClick = (idx: number) => {
    setModeIdx(idx);
    applyMode(root, idx);
  };

  const playScale = () => {
    const intervals = MODES[modeIdx].intervals;
    const notes: NoteInfo[] = [];
    for (const offset of [...intervals, 12]) {
      const midi = 60 + root + offset;
      const note = ALL_NOTES.find((n) => n.midiNumber === midi);
      if (note) notes.push(note);
    }
    if (notes.length > 0) {
      bus.emit('audio:playScale', notes);
    }
  };

  const playMelody = () => {
    const melody = MODE_MELODIES[modeIdx];
    const notes = degreesToNotes(root, MODES[modeIdx].intervals, melody);
    if (notes.length > 0) {
      bus.emit('audio:playScale', notes);
    }
  };

  return (
    <div className="plugin-container">
      <label>Root</label>
      <div className="root-buttons">
        {NOTE_NAMES.map((name, i) => (
          <button
            key={name}
            className={`btn${i === root ? ' btn-active' : ''}`}
            onClick={() => handleRootClick(i)}
          >
            {name}
          </button>
        ))}
      </div>

      <label>Mode</label>
      <div className="mode-buttons">
        {MODES.map((m, i) => (
          <button
            key={m.name}
            className={`btn${modeIdx === i ? ' btn-active' : ''}`}
            onClick={() => handleModeClick(i)}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="chord-info">
        <div className="chord-name">{NOTE_NAMES[root]} {MODES[modeIdx].name}</div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={playScale}>
          Play Scale
        </button>
        <button className="btn btn-primary" onClick={playMelody}>
          Play Melody
        </button>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={() => bus.emit('shape:clear')}>
          Clear
        </button>
      </div>
    </div>
  );
}
