import { useState } from 'react';
import { LabelMode } from '../../scene/NoteNode';
import { useSpiralBus } from '../../contexts/SpiralContext';

const MODES: { id: LabelMode; label: string }[] = [
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
];

export function LabelModePanel() {
  const bus = useSpiralBus();
  const [active, setActive] = useState<LabelMode>('letters');

  const handleClick = (mode: LabelMode) => {
    setActive(mode);
    bus.emit('labels:mode', mode);
  };

  return (
    <div className="plugin-container">
      <label>Note Labels</label>
      <div className="view-toggle">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`btn${active === m.id ? ' btn-active' : ''}`}
            onClick={() => handleClick(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
