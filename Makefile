.PHONY: dev dev-backend dev-frontend build run setup

# Development: run backend and frontend in parallel
dev:
	@echo "Starting backend and frontend..."
	@make dev-backend & make dev-frontend & wait

dev-backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# Build frontend for production
build:
	cd frontend && npm run build

# Run production (serves frontend from backend)
run: build
	cd backend && ./venv/bin/uvicorn app.main:app --port 8000

# Initial setup
setup:
	cd backend && python -m venv venv && ./venv/bin/pip install -r requirements.txt
	cd frontend && npm install
