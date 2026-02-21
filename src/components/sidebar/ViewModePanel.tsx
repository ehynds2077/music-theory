import { useState } from 'react';
import { ViewMode } from '../../scene/ViewManager';
import { eventBus } from '../../utils/eventBus';

const MODES: { id: ViewMode; label: string }[] = [
  { id: 'spiral', label: 'Spiral' },
  { id: 'concentric', label: 'Concentric' },
  { id: 'fifths', label: 'Fifths' },
];

export function ViewModePanel() {
  const [active, setActive] = useState<ViewMode>('spiral');

  const handleClick = (mode: ViewMode) => {
    setActive(mode);
    eventBus.emit('view:toggle', mode);
  };

  return (
    <div className="plugin-container">
      <label>View Mode</label>
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
