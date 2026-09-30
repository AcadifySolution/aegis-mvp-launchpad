from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import CORS_ALLOWED_ORIGINS

app = FastAPI(
    title="Aegis MVP Launchpad Engine",
    description="AI-assisted MVP scoping, architecture, and estimation backend.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-API-Key"],
)

app.include_router(api_router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "aegis-backend"}
