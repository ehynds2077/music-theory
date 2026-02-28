import { useState, useEffect, useCallback } from 'react';
import { MusicSpiral } from '../components/MusicSpiral';
import { Sidebar } from '../components/sidebar/Sidebar';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SpiralContext } from '../contexts/SpiralContext';
import { EventBus } from '../utils/eventBus';

export function SpiralExplorePage() {
  const [bus, setBus] = useState<EventBus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleAudioReady = useCallback(() => setLoading(false), []);

  return (
    <SpiralContext.Provider value={bus}>
      <div className="spiral-explore-page">
        <MusicSpiral size="full" onBusReady={setBus} onAudioReady={handleAudioReady} />
        {bus && <Sidebar />}
        <LoadingOverlay visible={loading} />
      </div>
    </SpiralContext.Provider>
  );
}
