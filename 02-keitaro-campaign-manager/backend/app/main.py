"""Точка входа веб-панели Keitaro Campaign Manager."""
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.keitaro.client import KeitaroApiError
from app.routers import campaigns, dictionaries, streams

app = FastAPI(title="Keitaro Campaign Manager", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-режим: Vite крутится на своём порту
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dictionaries.router)
app.include_router(campaigns.router)
app.include_router(streams.router)


@app.exception_handler(KeitaroApiError)
async def keitaro_error_handler(_: Request, exc: KeitaroApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


# Если фронтенд собран (npm run build) — отдаём его статику из FastAPI,
# чтобы демо работало одним процессом на :8000.
DIST = Path(__file__).resolve().parent.parent / ".." / "frontend" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
