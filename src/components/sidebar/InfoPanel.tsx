import { useState, useCallback } from 'react';
import { NoteInfo } from '../../data/noteData';
import { useEventBus } from '../../hooks/useEventBus';

export function InfoPanel() {
  const [notes, setNotes] = useState<NoteInfo[]>([]);

  useEventBus(
    'selection:changed',
    useCallback((n: NoteInfo[]) => setNotes(n), []),
  );

  if (notes.length === 0) {
    return (
      <div className="info-panel">
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          Click notes on the spiral to select them.
        </p>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <p style={{ color: '#a0a0c0', fontSize: '0.8rem', marginBottom: 6 }}>
        {notes.length} note{notes.length !== 1 ? 's' : ''} selected
      </p>
      {notes.map((n) => (
        <div key={n.midiNumber} className="note-info">
          <strong>{n.fullName}</strong> &mdash; MIDI {n.midiNumber} &mdash;{' '}
          {n.frequency.toFixed(1)} Hz{n.isBlack ? ' (\u266F/\u266D)' : ''}
        </div>
      ))}
    </div>
  );
}
