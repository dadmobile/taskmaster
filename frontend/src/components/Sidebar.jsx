import { useState } from 'react';
import { api } from '../api';

export default function Sidebar({ backlogs, currentView, onNavigate, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('project');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.createBacklog({ name: newName.trim(), type: newType });
    setNewName('');
    setShowCreate(false);
    onRefresh();
  };

  const grouped = {
    standing: backlogs.filter((b) => ['urgent', 'easy_fun', 'longer_term'].includes(b.type)),
    projects: backlogs.filter((b) => b.type === 'project'),
    monthly: backlogs.filter((b) => b.type === 'monthly'),
  };

  return (
    <nav className="sidebar">
      <h1>Taskmaster</h1>

      <button
        className={currentView === 'home' ? 'active' : ''}
        onClick={() => onNavigate('home')}
      >
        Today
      </button>

      {grouped.standing.length > 0 && (
        <div className="sidebar-section">
          <h4>Backlogs</h4>
          {grouped.standing.map((b) => (
            <button
              key={b.id}
              className={currentView === `backlog/${b.id}` ? 'active' : ''}
              onClick={() => onNavigate(`backlog/${b.id}`)}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {grouped.projects.length > 0 && (
        <div className="sidebar-section">
          <h4>Projects</h4>
          {grouped.projects.map((b) => (
            <button
              key={b.id}
              className={currentView === `backlog/${b.id}` ? 'active' : ''}
              onClick={() => onNavigate(`backlog/${b.id}`)}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {grouped.monthly.length > 0 && (
        <div className="sidebar-section">
          <h4>Monthly</h4>
          {grouped.monthly.map((b) => (
            <button
              key={b.id}
              className={currentView === `backlog/${b.id}` ? 'active' : ''}
              onClick={() => onNavigate(`backlog/${b.id}`)}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-section">
        {!showCreate ? (
          <button className="create-btn" onClick={() => setShowCreate(true)}>+ New Backlog</button>
        ) : (
          <form onSubmit={handleCreate} className="create-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Backlog name"
              autoFocus
            />
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              <option value="project">Project</option>
              <option value="urgent">Urgent</option>
              <option value="easy_fun">Easy/Fun</option>
              <option value="monthly">Monthly</option>
              <option value="longer_term">Longer Term</option>
            </select>
            <div>
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </nav>
  );
}
