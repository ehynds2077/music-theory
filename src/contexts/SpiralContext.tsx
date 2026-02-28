import { createContext, useContext } from 'react';
import { EventBus } from '../utils/eventBus';

export const SpiralContext = createContext<EventBus | null>(null);

export function useSpiralBus(): EventBus {
  const bus = useContext(SpiralContext);
  if (!bus) {
    throw new Error('useSpiralBus must be used within a SpiralContext.Provider');
  }
  return bus;
}
