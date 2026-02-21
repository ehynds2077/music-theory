export function AnimationControls({
  playing,
  progress,
  onPlay,
  onPause,
  onReset,
  onSeek,
}: {
  playing: boolean;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (value: number) => void;
}) {
  return (
    <div className="animation-controls">
      <div className="animation-buttons">
        {playing ? (
          <button className="btn btn-primary" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onPlay}>
            Play
          </button>
        )}
        <button className="btn" onClick={onReset}>
          Reset
        </button>
      </div>
      <input
        type="range"
        className="animation-slider"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
      />
      <span className="animation-progress">{Math.round(progress * 100)}%</span>
    </div>
  );
}
