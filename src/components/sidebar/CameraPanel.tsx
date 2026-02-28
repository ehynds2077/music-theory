import { useSpiralBus } from '../../contexts/SpiralContext';
import { CameraPreset } from '../../scene/CameraController';

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'top', label: 'Top Down' },
  { id: 'side', label: 'Side' },
];

export function CameraPanel() {
  const bus = useSpiralBus();
  return (
    <div className="plugin-container">
      <label>Camera View</label>
      <div className="camera-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className="btn"
            onClick={() => bus.emit('camera:preset', p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
