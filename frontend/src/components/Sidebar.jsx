import { useState } from 'react';
import { api } from '../api';

export default function Sidebar({ backlogs, currentView, onNavigate, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.createBacklog({ name: newName.trim() });
    setNewName('');
    setShowCreate(false);
    onRefresh();
  };

  const togglePin = async (b, e) => {
    e.stopPropagation();
    await api.updateBacklog(b.id, { pinned: !b.pinned });
    onRefresh();
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

      <div className="sidebar-section">
        <h4>Backlogs</h4>
        {backlogs.length === 0 && <div className="sidebar-empty">No backlogs yet</div>}
        {backlogs.map((b) => (
          <div key={b.id} className="sidebar-backlog-row">
            <button
              className={`sidebar-backlog${currentView === `backlog/${b.id}` ? ' active' : ''}`}
              onClick={() => onNavigate(`backlog/${b.id}`)}
            >
              {b.name}
            </button>
            <button
              className={`pin-toggle${b.pinned ? ' pinned' : ''}`}
              onClick={(e) => togglePin(b, e)}
              title={b.pinned ? 'Unpin from Today view' : 'Pin to Today view'}
            >
              {b.pinned ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>

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
            <div>
              <button type="submit">Create</button>
              <button type="button" onClick={() => { setShowCreate(false); setNewName(''); }}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="sidebar-section sidebar-footer">
        <button
          className={currentView === 'templates' ? 'active' : ''}
          onClick={() => onNavigate('templates')}
        >
          Templates
        </button>
      </div>
    </nav>
  );
}
