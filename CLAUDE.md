# Taskmaster

Personal task tracking app for daily planning across multiple backlogs.

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

### Data Model (4 tables)

- **Backlog**: id, name, kind, date, pinned, position, archived, created_at
  - `kind`: `"daily"` or `"standing"`
  - `date`: set iff `kind == "daily"`, unique (at most one daily per date)
  - `pinned`: only meaningful on standing backlogs — pinned ones surface on the day view
- **Task**: id, title, notes, backlog_id (FK), position (float), completed, completed_at, created_at
  - Float positions enable insert-between reordering (1.0, 1.5, 2.0)
- **Template**: id, name, weekday, position, created_at
  - `weekday`: 0=Mon … 6=Sun, or null. Unique among non-null values (one default template per day-of-week).
- **TemplateTask**: id, template_id (FK), title, notes, position
  - Plain copies into the daily backlog when seeding — no live link.

### API (`/api/...`)

- `GET /backlogs` — list standing backlogs only (daily backlogs are accessed via `/home`)
- `POST /backlogs` — create a standing backlog
- `PATCH /backlogs/{id}` — update (name, pinned, position, archived)
- `DELETE /backlogs/{id}`
- `GET/POST /backlogs/{id}/tasks` — list/create tasks
- `PATCH /tasks/reorder` — batch reorder (list of {id, position}). **Must be registered before `/tasks/{task_id}` routes** to avoid path-param shadowing.
- `PATCH /tasks/{id}` — update task (title, notes, completed, position)
- `DELETE /tasks/{id}`
- `POST /tasks/{id}/move` — move task. Body takes either `target_backlog_id` or `target_date` (mutually exclusive). Past-date moves return 400.
- `GET /home?date=YYYY-MM-DD` — composite day view. Returns `{today, pinned, leftovers}`:
  - `today`: the daily backlog for the requested date (auto-created with template seed if today/future and missing; null if past and missing)
  - `pinned`: each pinned standing backlog with its tasks
  - `leftovers`: every incomplete task on a daily backlog with `date < target_date`, each tagged with its `source_date`
- `GET/POST/PATCH/DELETE /templates` and `/templates/{id}/tasks` — template CRUD

### Frontend

- Hash routing in [App.jsx](frontend/src/App.jsx): `#` (today), `#date/YYYY-MM-DD`, `#backlog/{id}`, `#templates`.
- [DayView.jsx](frontend/src/pages/DayView.jsx) — renders Leftovers panel (when non-empty) → today's daily → each pinned standing backlog. Used for both today and other dates. Date nav: prev/next arrows, date input, Jump-to-today.
- [BacklogPage.jsx](frontend/src/pages/BacklogPage.jsx) — single standing-backlog view with rename/delete and show-completed toggle.
- [TemplatesPage.jsx](frontend/src/pages/TemplatesPage.jsx) — manage templates and their tasks.
- [Sidebar.jsx](frontend/src/components/Sidebar.jsx) — flat list of standing backlogs with a ☆/★ pin toggle, "+ New Backlog" form (name only), Templates link.
- [TaskItem.jsx](frontend/src/components/TaskItem.jsx) — Move dropdown supports → Today, → Tomorrow, → Pick a date…, plus standing backlogs.
- App-level `refreshTick` bumps when `loadBacklogs` runs so DayView re-fetches when sidebar pins change.
- @dnd-kit needs explicit `MouseSensor` + `TouchSensor` + `KeyboardSensor` configured in [BacklogPanel.jsx](frontend/src/components/BacklogPanel.jsx) with `activationConstraint.distance` to avoid spurious clicks triggering drag.

## Key Design Decisions

- Daily backlogs are created on demand. Past dates are never auto-created — past unfinished work surfaces as Leftovers. The backend explicitly refuses to auto-create or accept moves for past dates.
- Templates seed by **plain copy** at daily-backlog creation. Editing a template later does not affect already-seeded days.
- Auto-seed only fires the first time a daily backlog is created. If a template is added after that day's backlog already exists, no seeding happens.
- "Bring all to <date>" on the Leftovers panel uses the *currently-viewed* date, so the same control works for morning triage (today) and forward planning (future date).
- Completing a task sets `completed=true` and `completed_at` but keeps it in the DB.
- In production, FastAPI serves the built React app as static files (SPA catch-all route).

## Planned but not yet implemented

- **Calendar integration**: Pull scheduled events into the day view.
- **Recurring tasks**: Tasks that auto-appear on certain days outside the template flow.
- **Empty-daily cleanup**: Past daily backlogs with no tasks just sit in the DB. Fine for now; prune later if it becomes noisy.
