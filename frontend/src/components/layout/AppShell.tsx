import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

/**
 * AppShell - 3-column responsive layout
 * LEFT: Personal Context Anchors (20-24%)
 * CENTER: Decision & Context Stream (44-48%)
 * RIGHT: Temporal Reality / Calendar (32-34%)
 */
function AppShell() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Personal Context */}
      <aside className="hidden lg:block w-1/5 min-w-sidebar-left max-w-sidebar-left border-r border-slate-200">
        <LeftSidebar />
      </aside>

      {/* Center - Main Content Area */}
      <main className="flex-1 lg:max-w-[48%] overflow-y-auto">
        <Outlet />
      </main>

      {/* Right Sidebar - Calendar Timeline */}
      <aside className="hidden lg:block w-1/3 min-w-sidebar-right max-w-sidebar-right border-l border-slate-200">
        <RightSidebar />
      </aside>
    </div>
  );
}

export default AppShell;
