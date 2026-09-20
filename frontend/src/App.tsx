import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import ContextPage from './pages/ContextPage';
import DecisionsPage from './pages/DecisionsPage';
import CalendarPage from './pages/CalendarPage';
import DemoPage from './pages/DemoPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="context" element={<ContextPage />} />
          <Route path="decisions" element={<DecisionsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
