"""Container lookup routes."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas.placeholders import APIResponse
from backend.services.container_service import lookup_container

router = APIRouter(prefix="/containers", tags=["Containers"])


@router.get("/lookup", response_model=APIResponse[dict])
async def container_lookup_endpoint(
    number: str = Query(..., description="Container number to lookup (e.g. MSKU1234567)"),
    db: AsyncSession = Depends(get_db),
):
    """Instant container lookup via indexed container_number column (Section 30)."""
    res = await lookup_container(db, number)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Container '{number}' not found",
        )
    return APIResponse(success=True, message="Container found", data=res)
