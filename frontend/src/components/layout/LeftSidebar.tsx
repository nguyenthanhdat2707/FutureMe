import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isCognitoMode } from '../../auth/cognito';

/**
 * LeftSidebar - Personal Context Anchors
 * Goals, Roles, Current Context Check
 */
function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <div className="h-screen flex flex-col p-6 overflow-y-auto">
      <div className="space-y-6 flex-1">
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

      {isCognitoMode && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-xs text-text-secondary mb-2 truncate">
            {user?.getUsername() || 'Authenticated'}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default LeftSidebar;
