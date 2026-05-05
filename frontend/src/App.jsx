import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import DayView from './pages/DayView';
import BacklogPage from './pages/BacklogPage';
import TemplatesPage from './pages/TemplatesPage';
import './App.css';

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [view, setView] = useState('home');
  const [backlogs, setBacklogs] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadBacklogs = useCallback(async () => {
    setBacklogs(await api.listBacklogs());
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => { loadBacklogs(); }, [loadBacklogs]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      setView(hash || 'home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (target) => {
    window.location.hash = target === 'home' ? '' : target;
  };

  let content;
  if (view.startsWith('backlog/')) {
    const id = parseInt(view.split('/')[1], 10);
    content = (
      <BacklogPage
        backlogId={id}
        allBacklogs={backlogs}
        onRefreshBacklogs={loadBacklogs}
      />
    );
  } else if (view.startsWith('date/')) {
    const date = view.split('/')[1];
    content = (
      <DayView
        key={date}
        date={date}
        allBacklogs={backlogs}
        refreshTick={refreshTick}
        onRefreshBacklogs={loadBacklogs}
        onNavigateDate={(d) => navigate(d === isoToday() ? 'home' : `date/${d}`)}
      />
    );
  } else if (view === 'templates') {
    content = <TemplatesPage />;
  } else {
    const today = isoToday();
    content = (
      <DayView
        key={today}
        date={today}
        allBacklogs={backlogs}
        refreshTick={refreshTick}
        onRefreshBacklogs={loadBacklogs}
        onNavigateDate={(d) => navigate(d === today ? 'home' : `date/${d}`)}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        backlogs={backlogs}
        currentView={view}
        onNavigate={navigate}
        onRefresh={loadBacklogs}
      />
      <main className="content">{content}</main>
    </div>
  );
}
