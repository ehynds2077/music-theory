import { useEffect, useContext } from 'react';
import { SpiralContext } from '../contexts/SpiralContext';

export function useEventBus(event: string, handler: (...args: any[]) => void): void {
  const bus = useContext(SpiralContext);

  useEffect(() => {
    if (!bus) return;
    bus.on(event, handler);
    return () => {
      bus.off(event, handler);
    };
  }, [bus, event, handler]);
}
