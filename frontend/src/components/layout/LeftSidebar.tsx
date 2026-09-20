import { Link, useLocation } from 'react-router-dom';

/**
 * LeftSidebar - Personal Context Anchors
 * Goals, Roles, Current Context Check
 */
function LeftSidebar() {
  const location = useLocation();

  return (
    <div className="h-screen overflow-y-auto p-6 space-y-6">
      {/* Navigation */}
      <nav className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Navigation</h2>
        <Link
          to="/"
          className={`block px-3 py-2 rounded-lg text-sm ${
            location.pathname === '/'
              ? 'bg-accent-ai bg-opacity-10 text-accent-ai font-medium'
              : 'text-text-primary hover:bg-slate-100'
          }`}
        >
          Home
        </Link>
        <Link
          to="/context"
          className={`block px-3 py-2 rounded-lg text-sm ${
            location.pathname === '/context'
              ? 'bg-accent-ai bg-opacity-10 text-accent-ai font-medium'
              : 'text-text-primary hover:bg-slate-100'
          }`}
        >
          What Future Me Understands
        </Link>
        <Link
          to="/decisions"
          className={`block px-3 py-2 rounded-lg text-sm ${
            location.pathname === '/decisions'
              ? 'bg-accent-ai bg-opacity-10 text-accent-ai font-medium'
              : 'text-text-primary hover:bg-slate-100'
          }`}
        >
          Ask Future Me
        </Link>
        <Link
          to="/calendar"
          className={`block px-3 py-2 rounded-lg text-sm ${
            location.pathname === '/calendar'
              ? 'bg-accent-ai bg-opacity-10 text-accent-ai font-medium'
              : 'text-text-primary hover:bg-slate-100'
          }`}
        >
          Calendar
        </Link>
        <Link
          to="/demo"
          className={`block px-3 py-2 rounded-lg text-sm ${
            location.pathname === '/demo'
              ? 'bg-accent-ai bg-opacity-10 text-accent-ai font-medium'
              : 'text-text-primary hover:bg-slate-100'
          }`}
        >
          Demo Mode
        </Link>
      </nav>

      {/* Context Snapshot */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary">Right Now</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Energy</span>
            <span className="font-mono text-accent-intention">Medium</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Focus</span>
            <span className="font-mono text-text-primary">High</span>
          </div>
        </div>
      </div>

      {/* Active Goals Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary">Active Goals</h3>
        <div className="card p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Launch MVP</p>
              <p className="text-xs text-text-secondary">3 days remaining</p>
            </div>
            <span className="text-xs font-mono text-accent-warning">35%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;
