from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, DEBUG
from app.database import Base, engine
from app.engine.loader import registry
from app.routes import attempts, problems, students, teacher


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and load templates
    Base.metadata.create_all(bind=engine)
    loaded = registry.load_all()
    print(f"[StoryMath] Initialized database and loaded {len(loaded)} templates across {len(registry.structures())} structures.")
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="StoryMath API",
    description="Deterministic maths engine and pedagogical backend for StoryMath (Classes 5-7).",
    version="1.0.0",
    lifespan=lifespan,
    debug=DEBUG
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(students.router)
app.include_router(problems.router)
app.include_router(attempts.router)
app.include_router(teacher.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "StoryMath API",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "structures_count": len(registry.structures()),
        "templates_count": len(registry.get_all())
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
