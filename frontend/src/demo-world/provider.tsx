import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { createDemoWorldBaseline, DEMO_WORLD_STORAGE_KEY } from './baseline';
import { DemoWorldContext } from './context';
import { demoWorldReducer, hydrateDemoWorld, persistDemoWorld } from './store';
import type { DemoWorld } from './types';

function initialWorld(): DemoWorld {
  if (typeof window === 'undefined') return createDemoWorldBaseline();
  return hydrateDemoWorld(window.localStorage);
}

export function DemoWorldProvider({ children }: { children: ReactNode }) {
  const [world, dispatch] = useReducer(demoWorldReducer, undefined, initialWorld);
  const [resetVersion, setResetVersion] = useState(0);
  useEffect(() => { persistDemoWorld(world, window.localStorage); }, [world]);
  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(DEMO_WORLD_STORAGE_KEY);
    dispatch({ type:'reset-demo-world' });
    setResetVersion(version => version + 1);
  }, []);
  const value = useMemo(() => ({ world, dispatch, resetDemo, resetVersion }), [world, resetDemo, resetVersion]);
  return <DemoWorldContext.Provider value={value}>{children}</DemoWorldContext.Provider>;
}
