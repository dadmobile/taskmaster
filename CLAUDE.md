# Taskmaster

Personal task tracking app for managing multiple backlogs with daily/weekly planning.

## Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (`backend/`)
- **Frontend**: React (Vite), @dnd-kit for drag-and-drop (`frontend/`)
- **DB**: Single SQLite file (`backend/taskmaster.db`, gitignored)

## Running

```bash
# First time setup
make setup

# Development (backend on :8000, frontend on :5173 with proxy)
make dev

# Or run separately:
cd backend && ./venv/bin/uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev

# Production (builds frontend, serves everything from :8000)
make run
```

Note: `python` may be aliased on this machine. Always use `./venv/bin/python` or `./venv/bin/uvicorn` from `backend/`.

## Architecture

### Data Model (2 tables)

- **Backlog**: id, name, type, date_context, position, archived, created_at
  - Types: `daily`, `weekly`, `urgent`, `easy_fun`, `project`, `monthly`, `longer_term`
  - `date_context`: used for daily (the date), weekly (Monday), monthly (1st of month)
- **Task**: id, title, notes, backlog_id (FK), position (float), completed, completed_at, created_at
  - Float positions enable insert-between reordering (1.0, 1.5, 2.0)

### API (`/api/...`)

- `GET/POST /backlogs` — list/create backlogs
- `PATCH /backlogs/{id}` — update backlog
- `GET/POST /backlogs/{id}/tasks` — list/create tasks
- `PATCH /tasks/{id}` — update task (title, notes, completed, position)
- `POST /tasks/{id}/move` — move task to different backlog
- `PATCH /tasks/reorder` — batch reorder (list of {id, position})
- `GET /daily?target_date=YYYY-MM-DD` — composite view: auto-creates daily/weekly backlogs, returns today's tasks + week tasks + top 5 from each standing backlog

### Frontend

- Hash-based routing (`#backlog/3` etc.)
- `Home.jsx` — daily view (today + week + backlog summaries)
- `BacklogPage.jsx` — full backlog view with show/hide completed
- Sidebar — nav to all backlogs + create new ones
- Drag-and-drop reordering within each backlog panel

## Key Design Decisions

- Completing a task sets `completed=true` and `completed_at` but keeps it in the DB (hidden by default, toggle to show)
- Daily and weekly backlogs are auto-created on first access via the `/daily` endpoint
- In production, FastAPI serves the built React app as static files (SPA catch-all route)

## Planned but not yet implemented

- **Planning/triage mode**: View incomplete tasks from previous day/week/month, bulk move to new lists
- **Calendar integration**: Pull scheduled events into daily view
- **Recurring/auto-generated tasks**: Tasks that auto-appear on certain days
