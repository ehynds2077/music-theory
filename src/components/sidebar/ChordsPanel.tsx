import { useState, useCallback } from 'react';
import { CHORDS } from '../../data/chords';
import { computeChordMidi, midiToNoteInfos, maxInversion } from '../../data/chordUtils';
import { eventBus } from '../../utils/eventBus';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INVERSION_LABELS = ['Root Position', '1st Inversion', '2nd Inversion', '3rd Inversion'];
const INVERSION_SHORT = ['Root', '1st', '2nd', '3rd'];

const QUICK_PICK_COUNT = 7;
const QUICK_PICK_LABELS = ['Major', 'Minor', 'Dim', 'Aug', 'Maj7', 'Min7', 'Dom7'];

function inversionLabel(i: number): string {
  return INVERSION_LABELS[i] ?? `${i}th Inversion`;
}

function inversionShort(i: number): string {
  return INVERSION_SHORT[i] ?? `${i}th`;
}

export function ChordsPanel() {
  const [rootIndex, setRootIndex] = useState(0);
  const [chordIdx, setChordIdx] = useState(0);
  const [inversion, setInversion] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showMoreChords, setShowMoreChords] = useState(false);

  const chord = CHORDS[chordIdx];
  const maxInv = maxInversion(chord);

  const applyChord = useCallback(
    (root: number, cIdx: number, inv: number, shouldPlay: boolean) => {
      const ch = CHORDS[cIdx];
      const midiNotes = computeChordMidi(root, ch, inv);
      eventBus.emit('selection:set', midiNotes);
      if (shouldPlay) {
        const notes = midiToNoteInfos(midiNotes);
        if (notes.length > 0) {
          eventBus.emit('audio:playChord', notes);
        }
      }
    },
    [],
  );

  const handleRootClick = (i: number) => {
    setRootIndex(i);
    applyChord(i, chordIdx, inversion, autoPlay);
  };

  const handleChordClick = (idx: number) => {
    setChordIdx(idx);
    setShowMoreChords(false);
    const newMax = maxInversion(CHORDS[idx]);
    const clampedInv = Math.min(inversion, newMax);
    setInversion(clampedInv);
    applyChord(rootIndex, idx, clampedInv, autoPlay);
  };

  const handleChordChange = (val: string) => {
    const idx = parseInt(val);
    setChordIdx(idx);
    const newMax = maxInversion(CHORDS[idx]);
    const clampedInv = Math.min(inversion, newMax);
    setInversion(clampedInv);
    applyChord(rootIndex, idx, clampedInv, autoPlay);
  };

  const handleInversionClick = (inv: number) => {
    setInversion(inv);
    applyChord(rootIndex, chordIdx, inv, autoPlay);
  };

  const handleAutoPlayToggle = () => {
    setAutoPlay((prev) => !prev);
  };

  const handlePlayChord = () => {
    applyChord(rootIndex, chordIdx, inversion, true);
  };

  const isQuickPick = chordIdx < QUICK_PICK_COUNT;

  const chordName =
    `${NOTE_NAMES[rootIndex]} ${chord.name}` +
    (inversion > 0 ? ` (${inversionLabel(inversion)})` : '');

  return (
    <div className="plugin-container">
      <label>Root Note</label>
      <div className="root-buttons">
        {NOTE_NAMES.map((name, i) => (
          <button
            key={name}
            className={`btn${i === rootIndex ? ' btn-active' : ''}`}
            onClick={() => handleRootClick(i)}
          >
            {name}
          </button>
        ))}
      </div>

      <label>Chord Type</label>
      <div className="chord-buttons">
        {QUICK_PICK_LABELS.map((label, i) => (
          <button
            key={i}
            className={`btn${chordIdx === i ? ' btn-active' : ''}`}
            onClick={() => handleChordClick(i)}
          >
            {label}
          </button>
        ))}
        <button
          className={`btn${!isQuickPick ? ' btn-active' : ''}`}
          onClick={() => setShowMoreChords((prev) => !prev)}
        >
          ...
        </button>
      </div>
      {showMoreChords && (
        <select value={chordIdx} onChange={(e) => handleChordChange(e.target.value)}>
          {CHORDS.map((c, i) => (
            <option key={i} value={i}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <label>Inversion</label>
      <div className="inversion-buttons">
        {Array.from({ length: maxInv + 1 }, (_, i) => (
          <button
            key={i}
            className={`btn${inversion === i ? ' btn-active' : ''}`}
            onClick={() => handleInversionClick(i)}
          >
            {inversionShort(i)}
          </button>
        ))}
      </div>

      <label className="checkbox-label">
        <input type="checkbox" checked={autoPlay} onChange={handleAutoPlayToggle} />
        Auto-play on change
      </label>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={handlePlayChord}>
          Play Chord
        </button>
      </div>

      <div className="chord-info">
        <div className="chord-name">{chordName}</div>
      </div>
    </div>
  );
}
