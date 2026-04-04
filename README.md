# Taskmaster

Personal task tracking app for managing multiple backlogs with daily/weekly planning. Self-hosted, runs on a single machine.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Setup

```bash
# Install backend and frontend dependencies
make setup
```

This creates a Python virtualenv at `backend/venv/` and installs npm packages in `frontend/`.

## Running

### Development

```bash
make dev
```

This starts both servers:
- **Backend** (FastAPI): http://localhost:8000
- **Frontend** (Vite dev server): http://localhost:5173 (proxies API calls to backend)

Open http://localhost:5173 in your browser.

### Production

```bash
make run
```

Builds the React frontend and serves everything from FastAPI at http://localhost:8000.

## Project Structure

```
backend/
  app/
    main.py          # FastAPI app, routes, static file serving
    models.py        # SQLAlchemy models (Backlog, Task)
    database.py      # DB engine/session setup
  requirements.txt
  taskmaster.db      # SQLite database (auto-created, gitignored)

frontend/
  src/
    App.jsx          # Root component, hash-based routing
    Home.jsx         # Daily view — today + week + backlog summaries
    BacklogPage.jsx  # Full backlog view with drag-and-drop
    Sidebar.jsx      # Navigation + create new backlogs
  vite.config.js     # Dev server proxy config
```

## How It Works

- **Backlogs** are lists of tasks. Some are date-based (daily, weekly, monthly) and auto-created; others are standing lists (urgent, easy/fun, projects, longer-term).
- **Daily view** shows today's tasks, this week's plan, and the top items from each standing backlog.
- **Drag-and-drop** reordering within any backlog.
- **Completed tasks** are hidden by default but can be toggled visible.
- Data lives in a single SQLite file — no external database needed.
