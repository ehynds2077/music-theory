import { eventBus } from '../../utils/eventBus';
import { CameraPreset } from '../../scene/CameraController';

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'top', label: 'Top Down' },
  { id: 'side', label: 'Side' },
];

export function CameraPanel() {
  return (
    <div className="plugin-container">
      <label>Camera View</label>
      <div className="camera-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className="btn"
            onClick={() => eventBus.emit('camera:preset', p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
