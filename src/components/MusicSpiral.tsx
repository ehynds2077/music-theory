import { useRef, useEffect } from 'react';
import { SpiralEngine } from '../engine/SpiralEngine';
import { EventBus } from '../utils/eventBus';
import { ViewMode } from '../scene/ViewManager';

export interface MusicSpiralProps {
  selectedNotes?: number[];
  shape?: { root: number; intervals: number[]; type: 'scale' | 'chord' };
  viewMode?: ViewMode;
  interactive?: boolean;
  enableAudio?: boolean;
  size?: 'mini' | 'medium' | 'full' | { width: number; height: number };
  showLabels?: boolean;
  expandable?: boolean;
  onExpand?: () => void;
  onBusReady?: (bus: EventBus) => void;
  onAudioReady?: () => void;
  className?: string;
}

function sizeToStyle(
  size: MusicSpiralProps['size'],
): React.CSSProperties {
  if (!size || size === 'full') return { width: '100%', height: '100%' };
  if (size === 'mini') return { width: 280, height: 220 };
  if (size === 'medium') return { width: 480, height: 360 };
  return { width: size.width, height: size.height };
}

export function MusicSpiral({
  selectedNotes,
  shape,
  viewMode,
  interactive = true,
  enableAudio = true,
  size = 'full',
  showLabels = true,
  expandable = false,
  onExpand,
  onBusReady,
  onAudioReady,
  className,
}: MusicSpiralProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SpiralEngine | null>(null);

  const isMini = size === 'mini';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new SpiralEngine({
      container,
      interactive: isMini ? false : interactive,
      enableAudio: isMini ? false : enableAudio,
      showLabels: isMini ? false : showLabels,
      pixelRatio: isMini ? 1 : undefined,
    });
    engineRef.current = engine;

    if (onBusReady) onBusReady(engine.bus);

    if (onAudioReady) {
      engine.bus.on('audio:ready', onAudioReady);
    }

    engine.start();

    // IntersectionObserver: pause when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          engine.start();
        } else {
          engine.stop();
        }
      },
      { threshold: 0 },
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync selectedNotes prop to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !selectedNotes) return;
    engine.bus.emit('selection:set', selectedNotes);
  }, [selectedNotes]);

  // Sync shape prop to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (shape) {
      engine.bus.emit('shape:show', shape);
    } else {
      engine.bus.emit('shape:clear');
    }
  }, [shape]);

  // Sync viewMode prop to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !viewMode) return;
    engine.bus.emit('view:toggle', viewMode);
  }, [viewMode]);

  const style = sizeToStyle(size);

  return (
    <div
      ref={containerRef}
      className={`three-canvas${className ? ` ${className}` : ''}`}
      style={size !== 'full' ? { ...style, position: 'relative' } : undefined}
    >
      {expandable && (
        <button
          className="spiral-expand-btn"
          onClick={onExpand}
          title="Expand"
        >
          &#x26F6;
        </button>
      )}
    </div>
  );
}
