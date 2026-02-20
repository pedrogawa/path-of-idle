import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const TICK_RATE = 1000 / 10; // 10 ticks per second (slower for debugging)

export function useGameLoop() {
  const combatState = useGameStore(state => state.combatState);
  const lastTickRef = useRef(Date.now());
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (combatState !== 'fighting') {
      return;
    }
    
    lastTickRef.current = Date.now();
    
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      
      const store = useGameStore.getState();
      store.gameTick(deltaTime);
    }, TICK_RATE);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [combatState]);
}
