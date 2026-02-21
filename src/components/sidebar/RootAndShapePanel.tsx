import { useState, useCallback } from 'react';
import { SCALES } from '../../data/scales';
import { ALL_NOTES, NoteInfo } from '../../data/noteData';
import { eventBus } from '../../utils/eventBus';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function RootAndShapePanel() {
  const [currentRoot, setCurrentRoot] = useState(0);
  const [scaleIndex, setScaleIndex] = useState('');

  const emitShape = useCallback(
    (root: number, sIdx: string) => {
      if (sIdx !== '') {
        eventBus.emit('shape:show', {
          root,
          intervals: SCALES[parseInt(sIdx)].intervals,
          type: 'scale',
        });
      }
    },
    [],
  );

  const handleRootClick = (i: number) => {
    setCurrentRoot(i);
    eventBus.emit('root:changed', i);
    emitShape(i, scaleIndex);
  };

  const handleScaleChange = (val: string) => {
    setScaleIndex(val);
    if (val === '') {
      eventBus.emit('shape:clear');
    } else {
      eventBus.emit('shape:show', {
        root: currentRoot,
        intervals: SCALES[parseInt(val)].intervals,
        type: 'scale',
      });
    }
  };

  const playCurrentScale = () => {
    if (scaleIndex === '') return;

    const intervals = SCALES[parseInt(scaleIndex)].intervals;
    const notes: NoteInfo[] = [];
    for (const offset of intervals) {
      const midi = 60 + currentRoot + offset;
      const note = ALL_NOTES.find((n) => n.midiNumber === midi);
      if (note) notes.push(note);
    }
    if (notes.length === 0) return;

    eventBus.emit('audio:playScale', notes);
  };

  return (
    <div className="plugin-container">
      <label>Root / Key</label>
      <div className="root-buttons">
        {NOTE_NAMES.map((name, i) => (
          <button
            key={name}
            className={`btn${i === currentRoot ? ' btn-active' : ''}`}
            onClick={() => handleRootClick(i)}
          >
            {name}
          </button>
        ))}
      </div>

      <label>Scale</label>
      <select value={scaleIndex} onChange={(e) => handleScaleChange(e.target.value)}>
        <option value="">&mdash; None &mdash;</option>
        {SCALES.map((s, i) => (
          <option key={i} value={i}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={playCurrentScale}>
          Play Scale
        </button>
      </div>
    </div>
  );
}
