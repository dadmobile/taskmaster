# Taskmaster

Personal task tracking app for daily planning across multiple backlogs. Self-hosted, runs on a single machine.

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

## How It Works

There are two kinds of list:

- **Daily backlogs** belong to a specific date and are created lazily — visit a date and one is created for it (today and future dates only). Past dates are never auto-created; their unfinished work surfaces as "leftovers" instead.
- **Standing backlogs** are named, ongoing lists (e.g. "Urgent", "Project Beta"). Star one to **pin** it: pinned backlogs appear as panels alongside today on the home view.

The day view shows, in order:
1. **Leftovers** — every incomplete task from any past daily backlog, with a `from <date>` tag and a one-click "Bring all to <date>" button. Hidden when empty. This is the morning-planning surface: triage yesterday's unfinished work, then plan today.
2. **Today** (or the date you've navigated to).
3. Each pinned standing backlog.

Other features:

- **Templates**: define a list of tasks for a weekday (e.g. a Monday template). When a new daily backlog is created on that weekday, those tasks are copied in automatically. Templates without a weekday are inactive.
- **Move tasks** between backlogs, to today, to tomorrow, or to a picked future date.
- **Drag-and-drop** reordering within any backlog.
- **Completed tasks** stay in the database (hidden by default; toggle to show).
- Data lives in a single SQLite file at `backend/taskmaster.db` — no external database needed.

## Routes

- `#` — today
- `#date/YYYY-MM-DD` — a specific date's day view
- `#backlog/<id>` — a single standing backlog
- `#templates` — manage templates
