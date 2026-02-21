import { eventBus } from '../../utils/eventBus';

export function ClockOverlayToggle() {
  return (
    <div className="plugin-container">
      <label className="checkbox-label">
        <input
          type="checkbox"
          onChange={() => eventBus.emit('clock:toggle')}
        />{' '}
        Clock Overlay
      </label>
    </div>
  );
}
