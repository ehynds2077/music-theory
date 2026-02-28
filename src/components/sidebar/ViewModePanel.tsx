import { useState } from 'react';
import { ViewMode } from '../../scene/ViewManager';
import { useSpiralBus } from '../../contexts/SpiralContext';

const MODES: { id: ViewMode; label: string }[] = [
  { id: 'spiral', label: 'Spiral' },
  { id: 'concentric', label: 'Concentric' },
  { id: 'fifths', label: 'Fifths' },
];

export function ViewModePanel() {
  const bus = useSpiralBus();
  const [active, setActive] = useState<ViewMode>('spiral');

  const handleClick = (mode: ViewMode) => {
    setActive(mode);
    bus.emit('view:toggle', mode);
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
