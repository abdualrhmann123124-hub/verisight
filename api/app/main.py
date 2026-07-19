"""VeriSight analysis engine.

A stateless compute service. It holds no database connection and no user
state: it receives media, runs the forensic pipeline, and returns a
structured report. Persistence, accounts, and history all live in the web
app, which keeps this service independently scalable and keeps user data out
of it entirely.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes.analysis import router as analysis_router
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "Forensic analysis for digital media. Reports confidence-based "
        "indicators with the measurements behind them — never a verdict."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,  # no cookies or auth headers cross this boundary
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(analysis_router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    """Liveness probe, also used by the web app to report engine availability."""
    return {"status": "ok", "version": settings.version}
