import { useState } from 'react';
import { LabelMode } from '../../scene/NoteNode';
import { eventBus } from '../../utils/eventBus';

const MODES: { id: LabelMode; label: string }[] = [
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
];

export function LabelModePanel() {
  const [active, setActive] = useState<LabelMode>('letters');

  const handleClick = (mode: LabelMode) => {
    setActive(mode);
    eventBus.emit('labels:mode', mode);
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
