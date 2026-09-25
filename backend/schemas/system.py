from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current service health status")
    service: str = Field(default="sky-ariana-backend", description="Service identifier")
    version: str = Field(default="1.0.0", description="Backend version")
    timestamp: str = Field(description="ISO-8601 timestamp of health evaluation")
    uptime_seconds: float = Field(description="Seconds since service start")


class ReadyResponse(BaseModel):
    status: str = Field(default="ready", description="Readiness status")
    database: str = Field(description="Database connectivity status: connected or disconnected")
    storage: str = Field(description="Local application storage readiness: ready or error")
    checks: Dict[str, Any] = Field(default_factory=dict, description="Detailed readiness sub-checks")


class SystemInfoResponse(BaseModel):
    app_name: str
    version: str
    environment: str
    is_production: bool
    python_version: str
    platform: str
    database_url: str
    database_engine: str
    sqlite_version: Optional[str] = None
    wal_mode: bool
    data_directory: str
    logs_directory: str
    backups_directory: str
    exports_directory: str
    server_time: str
    uptime_seconds: float


class ServerStatusResponse(BaseModel):
    server_name: str = Field(description="Name or office identifier of the server")
    version: str = Field(description="Backend server version")
    minimum_client_version: str = Field(description="Minimum supported client version")
    connection_mode: str = Field(description="Connection mode: local or server")
    database_type: str = Field(description="Database dialect: sqlite or postgresql")
    maintenance_mode: bool = Field(description="Whether the server is currently in maintenance mode")
    uptime_seconds: float = Field(description="Server uptime in seconds")
    server_time: str = Field(description="Current server UTC timestamp")
    active_connections: Optional[int] = Field(default=None, description="Active database connections")

