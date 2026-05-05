import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import backlogs, home, tasks, templates

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Taskmaster")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backlogs.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(home.router, prefix="/api")
app.include_router(templates.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve frontend static files in production
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
