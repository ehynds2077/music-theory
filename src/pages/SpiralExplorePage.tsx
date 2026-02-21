import { useState, useEffect, useCallback } from 'react';
import { ThreeCanvas } from '../components/ThreeCanvas';
import { Sidebar } from '../components/sidebar/Sidebar';
import { LoadingOverlay } from '../components/LoadingOverlay';

export function SpiralExplorePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleAudioReady = useCallback(() => setLoading(false), []);

  return (
    <div className="spiral-explore-page">
      <ThreeCanvas onAudioReady={handleAudioReady} />
      <Sidebar />
      <LoadingOverlay visible={loading} />
    </div>
  );
}
