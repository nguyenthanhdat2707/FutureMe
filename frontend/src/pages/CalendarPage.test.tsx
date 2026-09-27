import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DemoWorldProvider, useDemoWorld } from '../demo-world';
import CalendarPage from './CalendarPage';

function ApplyButton() { const { dispatch } = useDemoWorld(); return <button onClick={() => { dispatch({type:'start-mentoring-decision'}); dispatch({type:'answer-expected-outcome',answer:'meaningful-limited'}); dispatch({type:'answer-commitment-flexibility',answer:'scope-and-schedule-adjustable'}); dispatch({type:'use-mentoring-plan'}); dispatch({type:'set-team-availability',availability:'flexible-best-fit'}); dispatch({type:'apply-active-plan'}); }}>Apply fixture</button>; }

describe('CalendarPage', () => {
  beforeEach(() => localStorage.clear());
  it('shows the fixed free slot and deadline from the shared baseline', () => { render(<DemoWorldProvider><CalendarPage /></DemoWorldProvider>); expect(screen.getByText('FREE')).toBeInTheDocument(); expect(screen.getAllByText('16:00–17:00').length).toBeGreaterThan(0); expect(screen.getByText('Client Proposal Deadline')).toBeInTheDocument(); expect(screen.getByText('19:00')).toBeInTheDocument(); });
  it('reflects the applied consolidation, relocation, and mentoring insertions', () => { render(<DemoWorldProvider><ApplyButton/><CalendarPage /></DemoWorldProvider>); fireEvent.click(screen.getByRole('button',{name:'Apply fixture'})); expect(screen.getByText(/Teaching \+ Monthly Report/)).toBeInTheDocument(); expect(screen.getByText(/Weekly Planning — moved from Friday/)).toBeInTheDocument(); expect(screen.getByText('Mentoring Preparation')).toBeInTheDocument(); expect(screen.getByText('Focused Mentoring Session')).toBeInTheDocument(); });
});
