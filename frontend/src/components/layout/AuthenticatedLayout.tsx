import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function AuthenticatedLayout() {
  return (
    <div className="min-h-screen min-w-0" style={{ background: 'radial-gradient(circle at 10% 10%, rgba(122, 92, 246, 0.08), transparent 34%), radial-gradient(circle at 88% 18%, rgba(255, 134, 55, 0.06), transparent 30%), linear-gradient(180deg, #fbfaf7 0%, #f7f5f2 100%)' }}>
      <TopBar />
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;
