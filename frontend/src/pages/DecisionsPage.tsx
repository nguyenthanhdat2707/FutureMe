import { useState } from 'react';

/**
 * DecisionsPage - Ask Future Me
 * Decision query interface with trade-off analysis
 */
function DecisionsPage() {
  const [query, setQuery] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const handleAsk = () => {
    if (query.trim()) {
      setShowResponse(true);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Ask Future Me</h1>
        <p className="text-text-secondary">Get context-aware decision support</p>
      </header>

      {/* Query Input */}
      <div className="card p-6 space-y-4">
        <label htmlFor="decision-query" className="block text-sm font-medium text-text-secondary">
          What decision do you need help with?
        </label>
        <textarea
          id="decision-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Should I reschedule my client meeting to work on the MVP?"
          className="w-full p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-ai"
          rows={4}
        />
        <button
          onClick={handleAsk}
          className="px-6 py-3 bg-accent-ai text-white rounded-lg font-medium hover:bg-opacity-90"
        >
          Ask Future Me
        </button>
      </div>

      {/* Response */}
      {showResponse && (
        <div className="space-y-6">
          {/* Recommendation */}
          <div className="card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-ai bg-opacity-10 rounded-full flex items-center justify-center">
                <span className="text-accent-ai font-bold text-sm">AI</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-2">Recommendation</h3>
                <p className="text-text-primary">
                  Postpone the client meeting to tomorrow afternoon and use this time slot for focused MVP development.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Confidence:</span>
                  <div className="flex-1 max-w-xs bg-slate-200 rounded-full h-2">
                    <div className="bg-accent-ai h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="font-mono text-sm">85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">Why this recommendation?</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-green-600 font-bold">+</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Hackathon deadline proximity</p>
                  <p className="text-sm text-text-secondary">Only 3 days remaining until demo day</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-green-600 font-bold">+</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Current energy level</p>
                  <p className="text-sm text-text-secondary">Your energy is medium-high, suitable for deep work</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-green-600 font-bold">+</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Meeting flexibility</p>
                  <p className="text-sm text-text-secondary">Client meeting can be rescheduled with 24h notice</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trade-offs */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">Trade-offs to consider</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-accent-warning pl-4">
                <p className="font-medium text-sm text-text-primary mb-1">Client relationship</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary mb-1">Gain:</p>
                    <p className="text-text-primary">Complete critical MVP milestone</p>
                  </div>
                  <div>
                    <p className="text-text-secondary mb-1">Cost:</p>
                    <p className="text-text-primary">Need to reschedule meeting (minor inconvenience)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternatives */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-text-primary">Alternative options</h3>
            <div className="border border-slate-300 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-text-primary">Keep meeting, work on MVP in evening</p>
                <span className="font-mono text-sm text-text-secondary">40% fit</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary mb-1">Pros:</p>
                  <ul className="list-disc list-inside text-text-primary space-y-1">
                    <li>Maintain scheduled commitment</li>
                    <li>No rescheduling needed</li>
                  </ul>
                </div>
                <div>
                  <p className="text-text-secondary mb-1">Cons:</p>
                  <ul className="list-disc list-inside text-text-primary space-y-1">
                    <li>Evening energy typically lower</li>
                    <li>Risk of incomplete work</li>
                    <li>Potential burnout</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-accent-ai text-white rounded-lg font-medium hover:bg-opacity-90">
              Accept & Apply
            </button>
            <button className="px-6 py-3 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50">
              Show me more options
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DecisionsPage;
