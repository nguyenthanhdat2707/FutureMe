import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../auth/AuthContext';
import { DemoWorldProvider } from '../../demo-world';
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
      <DemoWorldProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={child} />
            </Route>
          </Routes>
        </MemoryRouter>
      </DemoWorldProvider>
    </AuthContext.Provider>,
  );
}

describe('AuthenticatedLayout pitch demo', () => {
  it('renders the shared Persona A page inside the presenter layout', () => {
    renderLayout(<p>Shared page</p>);
    expect(screen.getByText('Shared page')).toBeInTheDocument();
    expect(screen.getByText('Persona A · Oct 5–18, 2026')).toBeInTheDocument();
  });
});
