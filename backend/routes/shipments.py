from __future__ import annotations

import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.schemas.placeholders import (
    APIResponse,
    PaginatedList,
    ShipmentCreate,
    ShipmentResponse,
)

router = APIRouter(prefix="/shipments", tags=["Shipments"])

_shipments_store: dict[str, dict] = {}


@router.get("", response_model=PaginatedList[ShipmentResponse])
async def list_shipments(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    items = list(_shipments_store.values())
    if status_filter:
        items = [s for s in items if s["status"].lower() == status_filter.lower()]
    start = (page - 1) * page_size
    paged = items[start : start + page_size]
    return PaginatedList(
        items=paged,
        total=len(items),
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=APIResponse[ShipmentResponse], status_code=status.HTTP_201_CREATED)
async def create_shipment(payload: ShipmentCreate):
    if payload.tracking_number in _shipments_store:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tracking number {payload.tracking_number} already exists",
        )
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    record = {
        **payload.model_dump(),
        "id": len(_shipments_store) + 1,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    _shipments_store[payload.tracking_number] = record
    return APIResponse(success=True, message="Shipment created", data=record)


@router.get("/{tracking_number}", response_model=APIResponse[ShipmentResponse])
async def get_shipment(tracking_number: str):
    if tracking_number not in _shipments_store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return APIResponse(success=True, message="Shipment retrieved", data=_shipments_store[tracking_number])
