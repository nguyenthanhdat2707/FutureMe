import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DemoWorldProvider, useDemoWorld } from '../demo-world';
import DashboardPage from './DashboardPage';

function Controls() {
  const { dispatch, resetDemo } = useDemoWorld();
  return <><button onClick={() => dispatch({ type:'update-mental-wellbeing', value:'steady' })}>Set steady</button><button onClick={() => dispatch({ type:'override-opportunity-value', opportunityId:'opportunity.professional-workshop', value:'low' })}>Lower workshop value</button><button onClick={() => dispatch({ type:'override-opportunity-value', opportunityId:'opportunity.student-startup-mentoring', value:'moderate' })}>Lower mentoring value</button><button onClick={resetDemo}>Reset fixture</button></>;
}

function renderDashboard(withControls = false) {
  return render(
    <DemoWorldProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        {withControls && <Controls />}
        <DashboardPage />
      </MemoryRouter>
    </DemoWorldProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders fixed Oct 5–18, 2026 timeline and current state summary from shared world', () => {
    renderDashboard();

    expect(screen.getByText(/Oct 5–18, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/High workload/i)).toBeInTheDocument();
    expect(screen.getByText(/Limited/i)).toBeInTheDocument();
    expect(screen.getByText(/Slightly strained/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Client Proposal/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Student Startup Mentoring/i)).toBeInTheDocument();
  });

  it('displays a compact 14-day capacity view across the fixed two-week period', () => {
    renderDashboard();

    // 14-day capacity section header and date blocks
    expect(screen.getByText(/14-Day Capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/Mon Oct 5/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Thu Oct 8/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Fri Oct 16/i)).toBeInTheDocument();
    expect(screen.getByText(/Sun Oct 18/i)).toBeInTheDocument();
  });

  it('displays upcoming commitments, deadlines, and personal direction snapshot', () => {
    renderDashboard();

    expect(screen.getByText(/Upcoming Commitments & Deadlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Direction Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Deliver current teaching responsibilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Protect important business and project deadlines/i)).toBeInTheDocument();
  });

  it('displays proactive Scenario B insight at baseline and opens reasoning without clarification UI', () => {
    renderDashboard();

    // Proactive insight headline
    expect(screen.getByText(/4:00 PM looks free/i)).toBeInTheDocument();
    const viewReasoningBtn = screen.getByRole('button', { name: /View reasoning/i });
    expect(viewReasoningBtn).toBeInTheDocument();

    // Open reasoning
    fireEvent.click(viewReasoningBtn);

    // Verify all reasoning criteria
    expect(screen.getAllByText(/Thursday Oct 8.*16:00–17:00.*FREE/i)).toHaveLength(2);
    expect(screen.getByText(/19:00 deadline/i)).toBeInTheDocument();
    expect(screen.getByText(/90 min focused work remains/i)).toBeInTheDocument();
    expect(screen.getByText(/16:00–18:00 strong focus window/i)).toBeInTheDocument();
    expect(screen.getAllByText(/High workload/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slightly strained/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Optional Professional Development Workshop/i)).toBeInTheDocument();
    expect(screen.getByText(/recording available/i)).toBeInTheDocument();
    expect(screen.getByText(/Calendar availability:.*Yes/i)).toBeInTheDocument();
    expect(screen.getByText(/Usable capacity:.*Low/i)).toBeInTheDocument();
    expect(screen.getByText('Skip the live workshop and review the recording later.')).toBeInTheDocument();

    // Verify NO clarification UI is present
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Which option fits your schedule best/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Please clarify/i)).not.toBeInTheDocument();

    // Verify "Use recording instead" dispatches action and updates state
    const useRecordingBtn = screen.getByRole('button', { name: /Use recording instead/i });
    fireEvent.click(useRecordingBtn);
    expect(screen.getByText(/Declined live session · Recording flagged for later/i)).toBeInTheDocument();
  });

  it('derives reasoning and opportunity summaries from corrected shared understanding', () => {
    renderDashboard(true);
    fireEvent.click(screen.getByRole('button', { name: 'Set steady' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lower workshop value' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lower mentoring value' }));
    fireEvent.click(screen.getByRole('button', { name: /View reasoning/i }));

    expect(screen.getAllByText(/Steady/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/optional, low value, with recording available later/i)).toBeInTheDocument();
    expect(screen.getByText('Current opportunity').closest('article')).toHaveTextContent(/high priority · moderate alignment with startup and advisory direction/i);
  });

  it('closes mounted reasoning when the shared world resets', () => {
    renderDashboard(true);
    fireEvent.click(screen.getByRole('button', { name: /View reasoning/i }));
    expect(screen.getByRole('region', { name: 'Workshop reasoning' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset fixture' }));
    expect(screen.queryByRole('region', { name: 'Workshop reasoning' })).not.toBeInTheDocument();
  });
});
