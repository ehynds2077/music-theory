import { useState, useCallback, useEffect } from 'react';
import { MusicSpiral, MusicSpiralProps } from './MusicSpiral';
import { Sidebar } from './sidebar/Sidebar';
import { SpiralContext } from '../contexts/SpiralContext';
import { EventBus } from '../utils/eventBus';

interface SpiralModalProps {
  open: boolean;
  onClose: () => void;
  selectedNotes?: MusicSpiralProps['selectedNotes'];
  shape?: MusicSpiralProps['shape'];
  viewMode?: MusicSpiralProps['viewMode'];
}

export function SpiralModal({ open, onClose, selectedNotes, shape, viewMode }: SpiralModalProps) {
  const [bus, setBus] = useState<EventBus | null>(null);

  // Reset bus when modal closes so stale bus doesn't persist on reopen
  useEffect(() => {
    if (!open) setBus(null);
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <SpiralContext.Provider value={bus}>
      <div className="spiral-modal-overlay" onClick={handleOverlayClick}>
        <div className="spiral-modal-content">
          <MusicSpiral
            size="full"
            selectedNotes={selectedNotes}
            shape={shape}
            viewMode={viewMode}
            onBusReady={setBus}
          />
          {bus && <Sidebar />}
          <button className="spiral-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>
    </SpiralContext.Provider>
  );
}
