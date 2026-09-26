import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { DEMO_WORLD_STORAGE_KEY, DemoWorldProvider } from '../../demo-world';
import { TopBar } from './TopBar';

vi.mock('../../config/demo-personas', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../config/demo-personas')>(),
  isDemoMode: true,
}));

function renderTopBar() {
  return render(
    <AuthContext.Provider value={{
      isAuthenticated: true,
      isLoading: false,
      user: null,
      getToken: vi.fn().mockResolvedValue(null),
      signOut: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(undefined),
    }}>
      <DemoWorldProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <TopBar />
        </MemoryRouter>
      </DemoWorldProvider>
    </AuthContext.Provider>,
  );
}

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

  });

  it('shows the authenticated navigation and active dashboard route', () => {
    renderTopBar();

    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboard).toHaveClass('bg-primary/10');
    expect(screen.getByRole('link', { name: 'Ask Future Me' })).toHaveAttribute('href', '/ask-future-me');
    expect(screen.getByRole('link', { name: 'Decisions' })).toHaveAttribute('href', '/decisions');
    expect(screen.getByRole('link', { name: 'Understanding' })).toHaveAttribute('href', '/understanding');
  });

  it('shows Persona A presenter controls and restores the pristine shared baseline', async () => {
    renderTopBar();

    expect(screen.getByText('Persona A · Oct 5–18, 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Demo' }));

    await waitFor(() => expect(screen.getByText('Pristine baseline restored.')).toBeInTheDocument());
    const persisted = JSON.parse(localStorage.getItem(DEMO_WORLD_STORAGE_KEY) ?? '{}') as { persona?: { id?: string }; decisions?: unknown[] };
    expect(persisted.persona?.id).toBe('persona-a');
    expect(persisted.decisions).toEqual([]);
  });
});
