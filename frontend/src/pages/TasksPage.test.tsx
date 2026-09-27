import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DemoWorldProvider, useDemoWorld } from '../demo-world';
import TasksPage from './TasksPage';

function ApplyButton() {
  const { dispatch } = useDemoWorld();
  return (
    <button
      onClick={() => {
        dispatch({ type: 'start-mentoring-decision' });
        dispatch({ type: 'answer-expected-outcome', answer: 'meaningful-limited' });
        dispatch({ type: 'answer-commitment-flexibility', answer: 'scope-and-schedule-adjustable' });
        dispatch({ type: 'use-mentoring-plan' });
        dispatch({ type: 'set-team-availability', availability: 'flexible-best-fit' });
        dispatch({ type: 'apply-active-plan' });
      }}
    >
      Apply fixture
    </button>
  );
}

function WorkshopButton() {
  const { dispatch } = useDemoWorld();
  return (
    <button onClick={() => dispatch({ type: 'use-workshop-recording' })}>
      Workshop fixture
    </button>
  );
}

describe('TasksPage', () => {
  beforeEach(() => localStorage.clear());

  it('derives baseline task schedule labels from shared calendar events', () => {
    render(
      <DemoWorldProvider>
        <TasksPage />
      </DemoWorldProvider>
    );
    expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    expect(screen.getByText('Friday Oct 16 · 13:00–14:00')).toBeInTheDocument();
    expect(screen.getByText('Weekly Planning')).toBeInTheDocument();
    expect(screen.getByText('Friday Oct 16 · 15:00–16:00')).toBeInTheDocument();
    expect(screen.getByText('Complete Client Proposal')).toBeInTheDocument();
    expect(screen.getByText('Thursday Oct 8 · Deadline 19:00')).toBeInTheDocument();
  });

  it('derives task schedule references from the shared applied plan including actual mentoring times', () => {
    render(
      <DemoWorldProvider>
        <ApplyButton />
        <TasksPage />
      </DemoWorldProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply fixture' }));

    expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    expect(
      screen.getByText(/Friday Oct 16 · 08:00–11:00 · Teaching \+ Monthly Report — Consolidated Morning Block/)
    ).toBeInTheDocument();

    expect(screen.getByText('Weekly Planning')).toBeInTheDocument();
    expect(screen.getByText('Tuesday Oct 13 · 15:00–16:00')).toBeInTheDocument();

    expect(screen.getByText('Mentoring Preparation')).toBeInTheDocument();
    expect(screen.getByText('Friday Oct 16 · 13:00–13:30')).toBeInTheDocument();

    expect(screen.getByText('Focused Mentoring Session')).toBeInTheDocument();
    expect(screen.getByText('Friday Oct 16 · 13:30–15:00')).toBeInTheDocument();
  });

  it('displays flexible backlog for unscheduled tasks', () => {
    render(
      <DemoWorldProvider>
        <WorkshopButton />
        <TasksPage />
      </DemoWorldProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Workshop fixture' }));
    expect(screen.getByText('Review workshop recording')).toBeInTheDocument();
    expect(screen.getByText('Flexible backlog')).toBeInTheDocument();
  });
});
