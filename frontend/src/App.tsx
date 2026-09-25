import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import HomePage from './pages/HomePage';
import ContextPage from './pages/ContextPage';
import DecisionsPage from './pages/DecisionsPage';
import DashboardPage from './pages/DashboardPage';
import DemoPage from './pages/DemoPage';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/" element={<RequireAuth><AuthenticatedLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<Navigate to="/dashboard" replace />} />
            <Route path="onboarding" element={<HomePage />} />
            <Route path="ask-future-me" element={<DecisionsPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="understanding" element={<ContextPage />} />
            <Route path="context" element={<Navigate to="/understanding" replace />} />
            <Route path="demo" element={<DemoPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
