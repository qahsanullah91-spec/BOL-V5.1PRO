from __future__ import annotations

import datetime
import os
import platform
import sqlite3
import sys
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.database import get_db, verify_db_connection
from backend.schemas.system import HealthResponse, ReadyResponse, ServerStatusResponse, SystemInfoResponse
from backend.services.sequence_service import get_next_sequence, peek_current_sequence

router = APIRouter(tags=["System"])

SERVER_START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Service liveness probe returning current status, version, and uptime."""
    uptime = time.time() - SERVER_START_TIME
    return HealthResponse(
        status="healthy",
        service="sky-ariana-backend",
        version=settings.APP_VERSION,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        uptime_seconds=round(uptime, 2),
    )


@router.get("/ready", response_model=ReadyResponse)
async def get_readiness():
    """Service readiness probe checking database connectivity and storage health."""
    db_check = await verify_db_connection()
    is_db_ready = db_check.get("connected", False)

    # Storage check
    storage_ready = False
    storage_error = None
    try:
        test_file = settings.resolved_data_dir / ".storage_check.tmp"
        test_file.write_text("ok", encoding="utf-8")
        if test_file.exists():
            test_file.unlink()
            storage_ready = True
    except Exception as exc:
        storage_error = str(exc)

    checks = {
        "database": db_check,
        "storage": {
            "path": str(settings.resolved_data_dir),
            "writable": storage_ready,
            "error": storage_error,
        },
    }

    is_overall_ready = is_db_ready and storage_ready

    payload = ReadyResponse(
        status="ready" if is_overall_ready else "not_ready",
        database="connected" if is_db_ready else "disconnected",
        storage="ready" if storage_ready else "error",
        checks=checks,
    )

    if not is_overall_ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload.model_dump())

    return payload


@router.get("/version")
async def get_version_info():
    """Version metadata endpoint for client-server compatibility and diagnostics."""
    return {
        "app_version": settings.APP_VERSION,
        "backend_version": settings.APP_VERSION,
        "api_version": "v1",
        "schema_version": "9c12685e0336",
        "minimum_client_version": settings.MINIMUM_CLIENT_VERSION,
        "environment": settings.APP_ENV,
        "is_production": settings.is_production,
    }


@router.get("/system/server-status", response_model=ServerStatusResponse)
async def get_server_status() -> ServerStatusResponse:
    """Multi-PC Office Network Status endpoint for client discovery and compatibility handshake."""
    uptime = time.time() - SERVER_START_TIME
    return ServerStatusResponse(
        server_name=settings.SERVER_NAME,
        version=settings.APP_VERSION,
        minimum_client_version=settings.MINIMUM_CLIENT_VERSION,
        connection_mode=settings.CONNECTION_MODE,
        database_type="postgresql" if settings.is_postgres else "sqlite",
        maintenance_mode=settings.MAINTENANCE_MODE,
        uptime_seconds=round(uptime, 2),
        server_time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        active_connections=None,
    )


@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info() -> SystemInfoResponse:
    """Detailed operational system telemetry, environment, and storage configuration."""
    uptime = time.time() - SERVER_START_TIME
    db_engine = (
        "PostgreSQL (Enterprise Connection Pool)"
        if settings.is_postgres
        else "SQLite (WAL mode, foreign keys, 10s busy timeout)"
    )
    return SystemInfoResponse(
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        is_production=settings.is_production,
        python_version=sys.version,
        platform=platform.platform(),
        database_url=settings.resolved_database_url,
        database_engine=db_engine,
        sqlite_version=sqlite3.sqlite_version if settings.is_sqlite else None,
        wal_mode=settings.is_sqlite,
        data_directory=str(settings.resolved_data_dir),
        logs_directory=str(settings.logs_dir),
        backups_directory=str(settings.backups_dir),
        exports_directory=str(settings.exports_dir),
        reports_directory=str(settings.reports_dir),
        server_time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        uptime_seconds=round(uptime, 2),
    )


@router.post("/system/sequences/next")
async def allocate_next_sequence(
    entity_type: str = Query("bol", description="Type of entity: bol, invoice, journal_entry, shipment"),
    prefix: Optional[str] = Query(None),
    pad_length: Optional[int] = Query(None),
    suffix: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Atomically allocate the next sequential document number across all connected office PCs."""
    next_num = await get_next_sequence(
        db=db,
        entity_type=entity_type,
        prefix_override=prefix,
        pad_length_override=pad_length,
        suffix_override=suffix,
    )
    return {
        "success": True,
        "entity_type": entity_type,
        "allocated_number": next_num,
    }


@router.get("/system/sequences/peek")
async def peek_sequence_endpoint(
    entity_type: str = Query("bol", description="Type of entity: bol, invoice, journal_entry, shipment"),
    db: AsyncSession = Depends(get_db),
):
    """Peek the current counter and next preview number without incrementing."""
    data = await peek_current_sequence(db=db, entity_type=entity_type)
    return {"success": True, "data": data}
