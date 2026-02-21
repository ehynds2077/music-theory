import { useRef, useEffect, useState, useCallback } from 'react';
import { PianoSpiralScene } from '../scene/PianoSpiralScene';
import { AnimationControls } from '../components/piano-spiral/AnimationControls';

export function PianoSpiralPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PianoSpiralScene | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new PianoSpiralScene(container);
    sceneRef.current = scene;

    scene.onProgressChange = (p) => setProgress(p);
    scene.onPlayStateChange = (p) => setPlaying(p);

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const handlePlay = useCallback(() => sceneRef.current?.play(), []);
  const handlePause = useCallback(() => sceneRef.current?.pause(), []);
  const handleReset = useCallback(() => sceneRef.current?.reset(), []);
  const handleSeek = useCallback((v: number) => sceneRef.current?.setProgress(v), []);

  return (
    <div className="piano-spiral-page">
      <div ref={containerRef} className="three-canvas" />
      <AnimationControls
        playing={playing}
        progress={progress}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onSeek={handleSeek}
      />
    </div>
  );
}
