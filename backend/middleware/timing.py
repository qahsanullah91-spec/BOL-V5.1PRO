from __future__ import annotations

import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("sky_ariana.performance")


class PerformanceTimingMiddleware(BaseHTTPMiddleware):
    """Middleware measuring request processing latency and appending diagnostic headers."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time_sec = time.perf_counter() - start_time
        process_time_ms = process_time_sec * 1000.0

        # Custom diagnostic headers
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
        response.headers["Server-Timing"] = f"total;dur={process_time_ms:.2f}"

        if process_time_ms > 250:
            logger.warning(
                f"Slow operation: {request.method} {request.url.path} took {process_time_ms:.2f}ms"
            )
        else:
            logger.debug(
                f"{request.method} {request.url.path} completed in {process_time_ms:.2f}ms"
            )

        return response
