import { useEffect } from 'react';
import { eventBus } from '../utils/eventBus';

export function useEventBus(event: string, handler: (...args: any[]) => void): void {
  useEffect(() => {
    eventBus.on(event, handler);
    return () => {
      eventBus.off(event, handler);
    };
  }, [event, handler]);
}
