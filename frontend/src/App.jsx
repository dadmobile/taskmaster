import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import BacklogPage from './pages/BacklogPage';
import './App.css';

export default function App() {
  const [view, setView] = useState('home');
  const [backlogs, setBacklogs] = useState([]);

  const loadBacklogs = useCallback(async () => {
    const data = await api.listBacklogs();
    setBacklogs(data);
  }, []);

  useEffect(() => { loadBacklogs(); }, [loadBacklogs]);

  // Handle hash-based navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1); // remove #
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
    const id = parseInt(view.split('/')[1]);
    content = (
      <BacklogPage
        backlogId={id}
        allBacklogs={backlogs}
        onRefreshBacklogs={loadBacklogs}
      />
    );
  } else {
    content = <Home allBacklogs={backlogs} onRefreshBacklogs={loadBacklogs} />;
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
