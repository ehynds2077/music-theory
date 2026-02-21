import { useState, useCallback } from 'react';
import { eventBus } from '../../utils/eventBus';
import { useEventBus } from '../../hooks/useEventBus';

const LAYOUT = {
  blackRow: [
    { key: 'w', note: 'C#' },
    { key: 'e', note: 'D#' },
    { key: '', note: '' },
    { key: 't', note: 'F#' },
    { key: 'y', note: 'G#' },
    { key: 'u', note: 'A#' },
    { key: '', note: '' },
    { key: 'o', note: 'C#' },
    { key: 'p', note: 'D#' },
  ],
  whiteRow: [
    { key: 'a', note: 'C' },
    { key: 's', note: 'D' },
    { key: 'd', note: 'E' },
    { key: 'f', note: 'F' },
    { key: 'g', note: 'G' },
    { key: 'h', note: 'A' },
    { key: 'j', note: 'B' },
    { key: 'k', note: 'C' },
    { key: 'l', note: 'D' },
    { key: ';', note: 'E' },
  ],
};

export function KeyboardPanel() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [octave, setOctave] = useState(4);
  const [chord, setChord] = useState<{ name: string; root: string } | null>(null);

  useEventBus(
    'keyboard:noteOn',
    useCallback(({ key }: { key: string }) => {
      setActiveKeys((prev) => new Set(prev).add(key));
    }, []),
  );

  useEventBus(
    'keyboard:noteOff',
    useCallback(({ key }: { key: string }) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, []),
  );

  useEventBus(
    'keyboard:octaveChanged',
    useCallback((oct: number) => setOctave(oct), []),
  );

  useEventBus(
    'chord:detected',
    useCallback((c: { name: string; root: string } | null) => setChord(c), []),
  );

  return (
    <div className="plugin-container">
      <label>Computer Keyboard</label>
      <div className="keyboard-layout">
        <div className="keyboard-row keyboard-row-black">
          {LAYOUT.blackRow.map((k, i) =>
            k.key ? (
              <span
                key={i}
                className={`kb-key kb-black${activeKeys.has(k.key) ? ' kb-active' : ''}`}
              >
                {k.key.toUpperCase()}
                <small>{k.note}</small>
              </span>
            ) : (
              <span key={i} className="kb-spacer" />
            ),
          )}
        </div>
        <div className="keyboard-row keyboard-row-white">
          {LAYOUT.whiteRow.map((k, i) => (
            <span
              key={i}
              className={`kb-key kb-white${activeKeys.has(k.key) ? ' kb-active' : ''}`}
            >
              {k.key.toUpperCase()}
              <small>{k.note}</small>
            </span>
          ))}
        </div>
      </div>
      <div className="chord-label">{chord ? `${chord.root} ${chord.name}` : ''}</div>
      <div className="keyboard-octave">
        <button
          className="btn kb-oct-btn"
          onClick={() => eventBus.emit('keyboard:shiftOctave', -1)}
        >
          Z: Oct-
        </button>
        <span className="kb-octave-label">
          Octave: <strong>{octave}</strong>
        </span>
        <button
          className="btn kb-oct-btn"
          onClick={() => eventBus.emit('keyboard:shiftOctave', 1)}
        >
          X: Oct+
        </button>
      </div>
    </div>
  );
}
