import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../auth/AuthContext';
import { getSelectedDemoPersonaId, setSelectedDemoPersonaId } from '../../config/demo-personas';
import { AuthenticatedLayout } from './AuthenticatedLayout';

vi.mock('../../config/demo-personas', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../config/demo-personas')>(),
  isDemoMode: true,
}));

function renderLayout(child: React.ReactNode) {
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
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={child} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('AuthenticatedLayout demo refresh', () => {
  it('remounts shared page state when the current persona is refreshed without changing IDs', async () => {
    let mounts = 0;
    function Page() {
      useEffect(() => { mounts += 1; }, []);
      return <p>Shared page</p>;
    }

    renderLayout(<Page />);
    expect(screen.getByText('Shared page')).toBeInTheDocument();
    expect(mounts).toBe(1);

    act(() => { setSelectedDemoPersonaId(getSelectedDemoPersonaId()); });

    await waitFor(() => expect(mounts).toBe(2));
  });
});
