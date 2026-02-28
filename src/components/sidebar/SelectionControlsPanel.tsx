import { useState, useCallback } from 'react';
import { NoteInfo } from '../../data/noteData';
import { useSpiralBus } from '../../contexts/SpiralContext';
import { useEventBus } from '../../hooks/useEventBus';

export function SelectionControlsPanel() {
  const bus = useSpiralBus();
  const [selectedNotes, setSelectedNotes] = useState<NoteInfo[]>([]);

  useEventBus(
    'selection:changed',
    useCallback((notes: NoteInfo[]) => setSelectedNotes(notes), []),
  );

  return (
    <div className="plugin-container">
      <div className="btn-row">
        <button className="btn" onClick={() => bus.emit('selection:clear')}>
          Clear Selection
        </button>
        <button
          className="btn btn-primary"
          onClick={() => bus.emit('audio:playChord', selectedNotes)}
        >
          Play Chord
        </button>
      </div>
      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => bus.emit('audio:playScale', selectedNotes)}
        >
          Play as Scale
        </button>
      </div>
    </div>
  );
}
