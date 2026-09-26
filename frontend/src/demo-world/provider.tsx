import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { createDemoWorldBaseline, DEMO_WORLD_STORAGE_KEY } from './baseline';
import { demoWorldReducer, hydrateDemoWorld, persistDemoWorld } from './store';
import type { DemoWorld, DemoWorldAction } from './types';

interface DemoWorldContextValue {
  world: DemoWorld;
  dispatch: React.Dispatch<DemoWorldAction>;
  resetDemo: () => void;
}

const DemoWorldContext = createContext<DemoWorldContextValue | null>(null);

function initialWorld(): DemoWorld {
  if (typeof window === 'undefined') return createDemoWorldBaseline();
  return hydrateDemoWorld(window.localStorage);
}

export function DemoWorldProvider({ children }: { children: ReactNode }) {
  const [world, dispatch] = useReducer(demoWorldReducer, undefined, initialWorld);
  useEffect(() => { persistDemoWorld(world, window.localStorage); }, [world]);
  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(DEMO_WORLD_STORAGE_KEY);
    dispatch({ type:'reset-demo-world' });
  }, []);
  const value = useMemo(() => ({ world, dispatch, resetDemo }), [world, resetDemo]);
  return <DemoWorldContext.Provider value={value}>{children}</DemoWorldContext.Provider>;
}

export function useDemoWorld(): DemoWorldContextValue {
  const value = useContext(DemoWorldContext);
  if (!value) throw new Error('useDemoWorld must be used inside DemoWorldProvider');
  return value;
}
