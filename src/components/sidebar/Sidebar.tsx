import { useState } from 'react';
import { TabBar, TabId } from './TabBar';
import { RootAndShapePanel } from './RootAndShapePanel';
import { IntervalPanel } from './IntervalPanel';
import { ChordsPanel } from './ChordsPanel';
import { ViewModePanel } from './ViewModePanel';
import { CameraPanel } from './CameraPanel';
import { ClockOverlayToggle } from './ClockOverlayToggle';
import { LabelModePanel } from './LabelModePanel';
import { KeyboardPanel } from './KeyboardPanel';
import { SelectionControlsPanel } from './SelectionControlsPanel';
import { InfoPanel } from './InfoPanel';
import { SheetMusic } from './SheetMusic';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<TabId>('explore');

  return (
    <div className="sidebar">
      <h1>Chromatic Spiral</h1>
      <div className="controls">
        <TabBar active={activeTab} onChange={setActiveTab} />
        <div className="tab-panel" style={{ display: activeTab === 'explore' ? undefined : 'none' }}>
          <RootAndShapePanel />
          <IntervalPanel />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'chords' ? undefined : 'none' }}>
          <ChordsPanel />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'view' ? undefined : 'none' }}>
          <ViewModePanel />
          <CameraPanel />
          <ClockOverlayToggle />
          <LabelModePanel />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'play' ? undefined : 'none' }}>
          <KeyboardPanel />
        </div>
        <SelectionControlsPanel />
      </div>
      <InfoPanel />
      <SheetMusic />
      <footer className="footer">
        <span>&copy; 2026 Ethan Hynds</span>
        <a href="https://github.com/ehynds2077/music-theory" target="_blank" rel="noopener">
          GitHub
        </a>
      </footer>
    </div>
  );
}
