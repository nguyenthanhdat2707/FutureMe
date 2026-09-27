import { useState } from 'react';
import { Link } from 'react-router-dom';
import { selectHistoryAndLearnedSignal, useDemoWorld, type OutcomeRecord } from '../demo-world';

function MentoringOutcomeSection({
  outcome,
  onCorrect,
}: {
  outcome: OutcomeRecord;
  onCorrect: (minutes: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(String(outcome.actualPreparationMinutes));

  const handleSave = () => {
    const parsed = parseInt(minutes, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onCorrect(parsed);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setMinutes(String(outcome.actualPreparationMinutes));
    setEditing(false);
  };

  return (
    <section className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
          Completed reflection · Observed History
        </p>
        {!editing && (
          <button
            type="button"
            aria-label="Correct actual preparation time"
            onClick={() => {
              setMinutes(String(outcome.actualPreparationMinutes));
              setEditing(true);
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            Correct
          </button>
        )}
      </div>
      <h2 className="mt-2 text-2xl text-text-primary">Focused Mentoring Session</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl bg-white p-4 font-semibold text-text-primary">
          Estimated preparation: {outcome.estimatedPreparationMinutes.min}–{outcome.estimatedPreparationMinutes.max} min
        </p>
        <div className="rounded-xl bg-white p-4">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="actual-prep-input" className="text-sm font-semibold text-text-primary">
                Actual preparation:
              </label>
              <input
                id="actual-prep-input"
                type="number"
                aria-label="Actual preparation minutes"
                className="w-20 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-sm font-bold text-text-primary"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                min={1}
                max={480}
              />
              <span className="text-sm font-semibold text-text-primary">min</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs font-bold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">
                Actual preparation: {outcome.actualPreparationMinutes} min
              </p>
              {outcome.actualPreparationMinutes !== 75 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  Corrected
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function HistoryPage() {
  const { world, dispatch } = useDemoWorld();
  const history = selectHistoryAndLearnedSignal(world);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Continuous Understanding</p>
          <h1 className="mt-2 text-4xl text-text-primary">History & Reflection</h1>
          <p className="mt-2 text-text-secondary">
            Choices and actual outcomes remain separate. Reflections improve future planning.
          </p>
        </div>
        <Link to="/understanding" className="text-sm font-bold text-primary">
          View learned understanding →
        </Link>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-2xl text-text-primary">Historical preference</h2>
          {history.historicalPreferences.map((p) => (
            <div key={p.id} className="mt-4 rounded-xl bg-violet-50 p-4">
              <p className="text-sm text-violet-950">{p.text}</p>
              <p className="mt-2 text-xs font-bold uppercase text-violet-700">
                {p.provenance === 'inferred' ? 'Inferred' : 'Observed History'}
              </p>
            </div>
          ))}
        </article>

        <article className="card p-6">
          <h2 className="text-2xl text-text-primary">Recent decisions</h2>
          {history.decisions.length === 0 ? (
            <p className="mt-4 text-sm text-text-secondary">No pitch-demo decisions recorded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.decisions.map((d) => (
                <div key={d.id} className="rounded-xl border border-surface-border p-4">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold text-text-primary">{d.title}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold capitalize text-emerald-800">
                      {d.status === 'planned' ? 'Planned' : d.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">Chosen: {d.chosenOption}</p>
                  {d.actualOutcome && (
                    <p className="mt-2 text-sm text-text-primary">Actual outcome: {d.actualOutcome}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {history.outcomes.map((o) => (
        <MentoringOutcomeSection
          key={o.id}
          outcome={o}
          onCorrect={(minutes) =>
            dispatch({ type: 'correct-mentoring-preparation', actualPreparationMinutes: minutes })
          }
        />
      ))}

      {history.learnedSignals.map((s) => (
        <section key={s.id} className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-6">
          <p className="text-xs font-bold uppercase text-violet-700">What Future Me learned</p>
          <p className="mt-2 text-lg font-semibold text-violet-950">{s.text}</p>
          <p className="mt-2 text-sm text-violet-800">
            Future plans for similar work will use this corrected observed preparation range.
          </p>
        </section>
      ))}
    </main>
  );
}

export default HistoryPage;
