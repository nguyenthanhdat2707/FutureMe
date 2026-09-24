import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the authenticated navigation and active dashboard route', () => {
    render(
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

    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboard).toHaveClass('bg-primary/10');
    expect(screen.getByRole('link', { name: 'Ask Future Me' })).toHaveAttribute('href', '/ask-future-me');
    expect(screen.getByRole('link', { name: 'Decisions' })).toHaveAttribute('href', '/decisions');
    expect(screen.getByRole('link', { name: 'Understanding' })).toHaveAttribute('href', '/understanding');
  });
});
