import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { TopBar } from './TopBar';

const { resetDemo } = vi.hoisted(() => ({ resetDemo: vi.fn() }));

vi.mock('../../api/client', () => ({
  api: { demo: { reset: resetDemo } },
}));

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
      <MemoryRouter initialEntries={['/dashboard']}>
        <TopBar />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetDemo.mockReset().mockResolvedValue(undefined);
  });

  it('shows the authenticated navigation and active dashboard route', () => {
    renderTopBar();

    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboard).toHaveClass('bg-primary/10');
    expect(screen.getByRole('link', { name: 'Ask Future Me' })).toHaveAttribute('href', '/ask-future-me');
    expect(screen.getByRole('link', { name: 'Decisions' })).toHaveAttribute('href', '/decisions');
    expect(screen.getByRole('link', { name: 'Understanding' })).toHaveAttribute('href', '/understanding');
  });

  it('resets the selected persona, clears derived session state, and broadcasts shared refresh events', async () => {
    sessionStorage.setItem('decisions_result', 'runtime decision');
    sessionStorage.setItem('unrelated', 'keep');
    const personaChanged = vi.fn();
    const calendarUpdated = vi.fn();
    window.addEventListener('future-me-demo-persona-changed', personaChanged);
    window.addEventListener('future-me-calendar-updated', calendarUpdated);
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo persona' }));

    await waitFor(() => expect(resetDemo).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Persona restored.')).toBeInTheDocument());
    expect(sessionStorage.getItem('decisions_result')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep');
    expect(personaChanged).toHaveBeenCalledTimes(1);
    expect(calendarUpdated).toHaveBeenCalledTimes(1);

    window.removeEventListener('future-me-demo-persona-changed', personaChanged);
    window.removeEventListener('future-me-calendar-updated', calendarUpdated);
  });

  it('preserves local derived state when reset fails', async () => {
    resetDemo.mockRejectedValueOnce(new Error('Reset unavailable'));
    sessionStorage.setItem('decisions_result', 'runtime decision');
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo persona' }));

    await waitFor(() => expect(screen.getByText('Reset unavailable')).toBeInTheDocument());
    expect(sessionStorage.getItem('decisions_result')).toBe('runtime decision');
  });
});
