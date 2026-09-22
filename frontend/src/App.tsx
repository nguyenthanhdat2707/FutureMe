import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import ContextPage from './pages/ContextPage';
import DecisionsPage from './pages/DecisionsPage';
import CalendarPage from './pages/CalendarPage';
import DemoPage from './pages/DemoPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<HomePage />} />
            <Route path="context" element={<ContextPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="demo" element={<DemoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
