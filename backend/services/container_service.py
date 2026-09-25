"""Container lookup service with indexed container search."""
from __future__ import annotations

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.logistics import ContainerModel
from backend.schemas.bol import ContainerSchema


async def lookup_container(db: AsyncSession, container_number: str) -> Optional[dict]:
    """Instant container lookup via indexed container_number column."""
    clean_num = container_number.strip().upper()
    if not clean_num:
        return None

    stmt = select(ContainerModel).where(ContainerModel.container_number == clean_num).limit(1)
    res = await db.execute(stmt)
    container = res.scalar_one_or_none()

    if not container:
        # Fallback to case-insensitive partial match
        stmt = select(ContainerModel).where(ContainerModel.container_number.ilike(f"%{clean_num}%")).limit(1)
        res = await db.execute(stmt)
        container = res.scalar_one_or_none()

    if not container:
        return None

    bol_summary = None
    if container.bol:
        bol_summary = {
            "id": container.bol.id,
            "bol_number": container.bol.bol_number,
            "status": container.bol.status,
            "shipper_name": container.bol.shipper_name,
            "consignee_name": container.bol.consignee_name,
            "origin": container.bol.origin,
            "destination": container.bol.destination,
        }

    shipment_summary = None
    if container.shipment:
        shipment_summary = {
            "id": container.shipment.id,
            "tracking_number": container.shipment.tracking_number,
            "status": container.shipment.status,
            "carrier": container.shipment.carrier,
        }

    return {
        "id": container.id,
        "container_number": container.container_number,
        "container_type": container.container_type,
        "seal_number": container.seal_number,
        "tare_weight_kg": float(container.tare_weight_kg or 0),
        "max_payload_kg": float(container.max_payload_kg or 0),
        "status": container.status,
        "bol": bol_summary,
        "shipment": shipment_summary,
    }
