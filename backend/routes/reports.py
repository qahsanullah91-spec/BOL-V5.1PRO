from __future__ import annotations

import datetime
import uuid
from fastapi import APIRouter, status

from backend.schemas.placeholders import (
    APIResponse,
    PaginatedList,
    ReportRequest,
    ReportResponse,
)

router = APIRouter(prefix="/reports", tags=["Reports"])

_reports_store: list[dict] = []


@router.get("", response_model=PaginatedList[ReportResponse])
async def list_reports():
    return PaginatedList(
        items=_reports_store,
        total=len(_reports_store),
        page=1,
        page_size=50,
    )


@router.post("/generate", response_model=APIResponse[ReportResponse], status_code=status.HTTP_202_ACCEPTED)
async def generate_report(payload: ReportRequest):
    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    record = {
        "report_id": report_id,
        "report_type": payload.report_type,
        "status": "completed",
        "download_url": f"/api/v1/reports/download/{report_id}",
        "summary": {
            "format": payload.format,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    }
    _reports_store.append(record)
    return APIResponse(success=True, message="Report generated successfully", data=record)
