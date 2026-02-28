import { ExpandableSpiral } from './ExpandableSpiral';
import { MusicSpiralProps } from './MusicSpiral';
import { ViewMode } from '../scene/ViewManager';

interface SpiralIllustrationProps {
  caption?: string;
  shape?: MusicSpiralProps['shape'];
  selectedNotes?: number[];
  viewMode?: ViewMode;
}

export function SpiralIllustration({ caption, shape, selectedNotes, viewMode }: SpiralIllustrationProps) {
  return (
    <div className="spiral-illustration">
      <ExpandableSpiral
        size="mini"
        interactive={false}
        enableAudio={false}
        showLabels={false}
        shape={shape}
        selectedNotes={selectedNotes}
        viewMode={viewMode}
      />
      {caption && <p className="spiral-caption">{caption}</p>}
    </div>
  );
}
