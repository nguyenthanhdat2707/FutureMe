import { createContext, useContext } from 'react';
import type React from 'react';
import type { DemoWorld, DemoWorldAction } from './types';

export interface DemoWorldContextValue {
  world: DemoWorld;
  dispatch: React.Dispatch<DemoWorldAction>;
  resetDemo: () => void;
  resetVersion: number;
}

export const DemoWorldContext = createContext<DemoWorldContextValue | null>(null);

export function useDemoWorld(): DemoWorldContextValue {
  const value = useContext(DemoWorldContext);
  if (!value) throw new Error('useDemoWorld must be used inside DemoWorldProvider');
  return value;
}
