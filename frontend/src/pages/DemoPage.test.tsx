import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import DemoPage from './DemoPage';
import {
  DEMO_PERSONAS,
  DEMO_PERSONA_STORAGE_KEY,
  clearPersonaSessionState,
  getSelectedDemoPersonaId,
  setSelectedDemoPersonaId,
} from '../config/demo-personas';

describe('public demo personas', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders all six synthetic personas without credentials', () => {
    render(<MemoryRouter><DemoPage /></MemoryRouter>);

    expect(screen.getAllByRole('button', { name: /persona/i })).toHaveLength(6);
    for (const persona of DEMO_PERSONAS) {
      expect(screen.getByText(persona.displayName)).toBeInTheDocument();
      expect(screen.getByText(persona.scenario)).toBeInTheDocument();
    }
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/password|secret|token/);
  });

  it('persists only an allowlisted persona ID and clears decision session state when switching', () => {
    sessionStorage.setItem('decisions_result', 'old-result');
    sessionStorage.setItem('unrelated', 'keep');
    clearPersonaSessionState();
    setSelectedDemoPersonaId(DEMO_PERSONAS[1].id);

    expect(sessionStorage.getItem('decisions_result')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep');
    expect(localStorage.getItem(DEMO_PERSONA_STORAGE_KEY)).toBe(DEMO_PERSONAS[1].id);
    expect(getSelectedDemoPersonaId()).toBe(DEMO_PERSONAS[1].id);
  });

  it('switches persona from the card action', () => {
    render(<MemoryRouter initialEntries={['/demo']}><DemoPage /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole('button', { name: 'Use this persona' })[0]);

    expect(getSelectedDemoPersonaId()).toBe(DEMO_PERSONAS[1].id);
  });

  it('rejects arbitrary persona IDs', () => {
    expect(() => setSelectedDemoPersonaId('arbitrary-user')).toThrow('Unknown demo persona');
    expect(localStorage.getItem(DEMO_PERSONA_STORAGE_KEY)).toBeNull();
  });
});
