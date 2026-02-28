import { useSpiralBus } from '../../contexts/SpiralContext';

export function ClockOverlayToggle() {
  const bus = useSpiralBus();
  return (
    <div className="plugin-container">
      <label className="checkbox-label">
        <input
          type="checkbox"
          onChange={() => bus.emit('clock:toggle')}
        />{' '}
        Clock Overlay
      </label>
    </div>
  );
}
