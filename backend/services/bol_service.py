"""High-Performance Bill of Lading (BOL) service with lightweight lists, pagination, and concurrency."""
from __future__ import annotations

import datetime
from decimal import Decimal
import re
from typing import Any, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.base import generate_uuid
from backend.models.logistics import (
    BOLItemModel,
    BOLModel,
    ContainerModel,
    DriverModel,
    ShipmentModel,
    TruckModel,
)
from backend.models.parties import CompanyModel, ConsigneeModel, NotifyPartyModel, ShipperModel
from backend.schemas.bol import (
    BOLCheckNumberResponse,
    BOLCreateRequest,
    BOLDetail,
    BOLItemSchema,
    BOLListItem,
    BOLPatchRequest,
    BOLSaveResponse,
    ContainerSchema,
    DocumentMetadataSchema,
)
from backend.schemas.placeholders import BOLResponse
from backend.services.party_service import invalidate_recent_party_cache

# Regex patterns for fast search routing
_CONTAINER_REGEX = re.compile(r"^[A-Z]{4}\d{7}$", re.IGNORECASE)
_BOL_NUM_REGEX = re.compile(r"^(BOL[-_]?)?[A-Z0-9]{3,20}$", re.IGNORECASE)


async def check_bol_number_exists(
    db: AsyncSession, bol_number: str, exclude_id: Optional[str] = None
) -> BOLCheckNumberResponse:
    """Fast indexed duplicate check for BOL numbers."""
    clean_num = bol_number.strip()
    stmt = select(BOLModel.id).where(func.lower(BOLModel.bol_number) == clean_num.lower())
    if exclude_id:
        stmt = stmt.where(BOLModel.id != exclude_id)
    res = await db.execute(stmt)
    matched_id = res.scalar_one_or_none()
    return BOLCheckNumberResponse(
        exists=bool(matched_id),
        bol_number=clean_num,
        matched_id=matched_id,
    )


async def list_bols_paged(
    db: AsyncSession,
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    company_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    shipper: Optional[str] = None,
    consignee: Optional[str] = None,
    notify_party: Optional[str] = None,
) -> Tuple[List[BOLListItem], int, int]:
    """Retrieve lightweight BOL list with true server-side pagination and indexed search priority."""
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size

    clean_q = (q or "").strip()
    filters = []

    # Apply indexed filters
    if company_id:
        filters.append(BOLModel.company_id == company_id)
    if status_filter:
        filters.append(BOLModel.status == status_filter)
    if date_from:
        filters.append(BOLModel.issue_date >= date_from)
    if date_to:
        filters.append(BOLModel.issue_date <= date_to)
    if shipper:
        filters.append(BOLModel.shipper_name.ilike(f"%{shipper.strip()}%"))
    if consignee:
        filters.append(BOLModel.consignee_name.ilike(f"%{consignee.strip()}%"))
    if notify_party:
        filters.append(BOLModel.notify_party_name.ilike(f"%{notify_party.strip()}%"))

    # Search Priority (Section 12)
    if clean_q:
        if _CONTAINER_REGEX.match(clean_q):
            # Prioritize container lookup
            container_bol_ids = (
                select(ContainerModel.bol_id)
                .where(ContainerModel.container_number.ilike(f"%{clean_q}%"))
                .scalar_subquery()
            )
            filters.append(BOLModel.id.in_(container_bol_ids))
        elif _BOL_NUM_REGEX.match(clean_q) and len(clean_q) >= 4:
            # Prioritize exact/prefix indexed BOL number match
            filters.append(
                or_(
                    BOLModel.bol_number == clean_q,
                    BOLModel.bol_number.ilike(f"{clean_q}%"),
                    BOLModel.driver_name.ilike(f"%{clean_q}%"),
                    BOLModel.shipper_name.ilike(f"%{clean_q}%"),
                    BOLModel.consignee_name.ilike(f"%{clean_q}%"),
                )
            )
        else:
            # Multi-field substring search
            filters.append(
                or_(
                    BOLModel.bol_number.ilike(f"%{clean_q}%"),
                    BOLModel.driver_name.ilike(f"%{clean_q}%"),
                    BOLModel.shipper_name.ilike(f"%{clean_q}%"),
                    BOLModel.consignee_name.ilike(f"%{clean_q}%"),
                    BOLModel.notify_party_name.ilike(f"%{clean_q}%"),
                    BOLModel.cargo_description.ilike(f"%{clean_q}%"),
                )
            )

    where_clause = and_(*filters) if filters else True

    # Fast Count Query
    count_stmt = select(func.count(BOLModel.id)).where(where_clause)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Lightweight Select Query (Only required columns)
    query_stmt = (
        select(
            BOLModel.id,
            BOLModel.bol_number,
            BOLModel.issue_date,
            BOLModel.status,
            BOLModel.shipper_name,
            BOLModel.consignee_name,
            BOLModel.driver_name,
            BOLModel.carton_count,
            BOLModel.gross_weight_kg,
            BOLModel.net_weight_kg,
            BOLModel.freight_fee,
            BOLModel.currency,
            BOLModel.origin,
            BOLModel.destination,
            BOLModel.border_station,
            BOLModel.revision,
            BOLModel.updated_at,
            BOLModel.company_id,
        )
        .where(where_clause)
        .order_by(BOLModel.created_at.desc(), BOLModel.id.desc())
        .offset(offset)
        .limit(page_size)
    )

    rows = (await db.execute(query_stmt)).all()

    items: list[BOLListItem] = []
    for r in rows:
        route_sum = f"{r.origin} -> {r.border_station}" if r.origin else r.border_station
        if r.destination:
            route_sum += f" -> {r.destination}"

        items.append(
            BOLListItem(
                id=r.id,
                bol_number=r.bol_number,
                issue_date=r.issue_date.isoformat() if r.issue_date else None,
                status=r.status,
                shipper_name=r.shipper_name,
                consignee_name=r.consignee_name,
                route_summary=route_sum,
                driver_name=r.driver_name,
                carton_count=r.carton_count or 0,
                gross_weight_kg=float(r.gross_weight_kg or 0),
                net_weight_kg=float(r.net_weight_kg or 0),
                freight_fee=float(r.freight_fee or 0),
                currency=r.currency or "USD",
                updated_at=r.updated_at.isoformat() if r.updated_at else None,
                revision=r.revision or 1,
                number_of_packages=str(r.carton_count or 0),
                gross_weight=str(r.gross_weight_kg or 0),
                net_weight=str(r.net_weight_kg or 0),
                driver_rent=str(r.freight_fee or 0),
            )
        )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return items, total, pages


async def get_bol_detail(db: AsyncSession, bol_id_or_number: str) -> BOLDetail:
    """Retrieve full detail for a single BOL (including cargo items, containers, linked docs metadata)."""
    clean_id = bol_id_or_number.strip()
    stmt = (
        select(BOLModel)
        .where(or_(BOLModel.id == clean_id, BOLModel.bol_number == clean_id))
        .options(
            selectinload(BOLModel.items),
            selectinload(BOLModel.containers),
            selectinload(BOLModel.company),
            selectinload(BOLModel.shipper),
            selectinload(BOLModel.consignee),
            selectinload(BOLModel.notify_party),
            selectinload(BOLModel.driver),
            selectinload(BOLModel.truck),
            selectinload(BOLModel.documents),
        )
    )
    res = await db.execute(stmt)
    bol = res.scalar_one_or_none()
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOL '{clean_id}' not found",
        )

    # Cargo Items
    items_list = [
        BOLItemSchema(
            id=item.id,
            item_description=item.item_description,
            carton_count=item.carton_count,
            gross_weight_kg=float(item.gross_weight_kg or 0),
            net_weight_kg=float(item.net_weight_kg or 0),
            volume_cbm=float(item.volume_cbm or 0),
            package_type=item.package_type,
            commodity_id=item.commodity_id,
        )
        for item in bol.items
    ]

    # Containers
    containers_list = [
        ContainerSchema(
            id=c.id,
            container_number=c.container_number,
            container_type=c.container_type,
            seal_number=c.seal_number,
            tare_weight_kg=float(c.tare_weight_kg or 0),
            max_payload_kg=float(c.max_payload_kg or 0),
            status=c.status,
        )
        for c in bol.containers
    ]

    # Document Metadata only (no PDF blobs, Section 31)
    docs_metadata = [
        DocumentMetadataSchema(
            id=doc.id,
            title=doc.title,
            document_type=doc.document_type,
            file_size_bytes=getattr(doc, "file_size", getattr(doc, "file_size_bytes", 0)) or 0,
            mime_type=doc.mime_type,
            created_at=doc.created_at.isoformat() if doc.created_at else None,
        )
        for doc in bol.documents
    ]

    container_nums = ", ".join(c.container_number for c in bol.containers if c.container_number) if bol.containers else None
    seal_nums = ", ".join(c.seal_number for c in bol.containers if c.seal_number) if bol.containers else None
    routes_list = [
        {"from": bol.origin or "Origin", "to": bol.border_station or "Border", "mode": "road", "status": "completed"},
        {"from": bol.border_station or "Border", "to": bol.destination or "Destination", "mode": "road", "status": "pending"},
    ] if (bol.origin or bol.border_station or bol.destination) else []

    return BOLDetail(
        id=bol.id,
        bol_number=bol.bol_number,
        issue_date=bol.issue_date.isoformat() if bol.issue_date else None,
        origin=bol.origin,
        destination=bol.destination,
        border_station=bol.border_station,
        driver_name=bol.driver_name,
        father_name=bol.father_name,
        driver_rent=float(bol.driver_rent or 0),
        carton_count=bol.carton_count or 0,
        gross_weight_kg=float(bol.gross_weight_kg or 0),
        net_weight_kg=float(bol.net_weight_kg or 0),
        cargo_description=bol.cargo_description,
        status=bol.status,
        freight_fee=float(bol.freight_fee or 0),
        demurrage_fee=float(bol.demurrage_fee or 0),
        documentation_fee=float(bol.documentation_fee or 0),
        currency=bol.currency or "USD",
        exchange_rate=float(bol.exchange_rate or 1.0),
        company_id=bol.company_id,
        company_name=bol.company.company_name if bol.company else None,
        shipper_id=bol.shipper_id,
        shipper_name=bol.shipper_name or (bol.shipper.name if bol.shipper else None),
        consignee_id=bol.consignee_id,
        consignee_name=bol.consignee_name or (bol.consignee.name if bol.consignee else None),
        notify_party_id=bol.notify_party_id,
        notify_party_name=bol.notify_party_name or (bol.notify_party.name if bol.notify_party else None),
        truck_number=bol.truck.truck_number if bol.truck else None,
        driver_phone=bol.driver.phone if bol.driver else None,
        number_of_packages=str(bol.carton_count or 0),
        gross_weight=str(bol.gross_weight_kg or 0),
        net_weight=str(bol.net_weight_kg or 0),
        driver_father_name=bol.father_name,
        notify_party=bol.notify_party_name or (bol.notify_party.name if bol.notify_party else None),
        driver_contact=bol.driver.phone if bol.driver else None,
        container_numbers=container_nums,
        seal_numbers=seal_nums,
        routes=routes_list,
        items=items_list,
        containers=containers_list,
        linked_documents=docs_metadata,
        revision=bol.revision or 1,
        created_at=bol.created_at.isoformat() if bol.created_at else None,
        updated_at=bol.updated_at.isoformat() if bol.updated_at else None,
    )


async def patch_bol(
    db: AsyncSession, bol_id_or_number: str, payload: BOLPatchRequest
) -> BOLSaveResponse:
    """Partial update with optimistic concurrency control (Section 23, 24)."""
    clean_id = bol_id_or_number.strip()
    stmt = (
        select(BOLModel)
        .where(or_(BOLModel.id == clean_id, BOLModel.bol_number == clean_id))
        .with_for_update()
    )
    res = await db.execute(stmt)
    bol = res.scalar_one_or_none()
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOL '{clean_id}' not found",
        )

    # Optimistic concurrency check
    if bol.revision != payload.revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Concurrency conflict: This BOL was updated elsewhere (server rev={bol.revision}, client rev={payload.revision}). "
                "Please refresh before saving."
            ),
        )

    # Apply only provided fields
    update_data = payload.model_dump(exclude_unset=True, exclude={"revision", "items", "containers"})
    for key, val in update_data.items():
        if val is not None:
            if key in ("driver_rent", "gross_weight_kg", "net_weight_kg", "freight_fee", "demurrage_fee", "documentation_fee", "exchange_rate"):
                setattr(bol, key, Decimal(str(val)))
            else:
                setattr(bol, key, val)

    bol.revision += 1
    bol.updated_at = datetime.datetime.now(datetime.timezone.utc)

    # Sync cargo items if supplied
    if payload.items is not None:
        # Clear existing items and replace
        await db.execute(select(BOLItemModel).where(BOLItemModel.bol_id == bol.id))
        for existing in bol.items:
            await db.delete(existing)
        for item_data in payload.items:
            db.add(
                BOLItemModel(
                    bol_id=bol.id,
                    item_description=item_data.item_description,
                    carton_count=item_data.carton_count,
                    gross_weight_kg=Decimal(str(item_data.gross_weight_kg)),
                    net_weight_kg=Decimal(str(item_data.net_weight_kg)),
                    volume_cbm=Decimal(str(item_data.volume_cbm)),
                    package_type=item_data.package_type,
                    commodity_id=item_data.commodity_id,
                )
            )

    await db.commit()
    await db.refresh(bol)

    return BOLSaveResponse(
        id=bol.id,
        bol_number=bol.bol_number,
        revision=bol.revision,
        status=bol.status,
        updated_at=bol.updated_at.isoformat() if bol.updated_at else datetime.datetime.now(datetime.timezone.utc).isoformat(),
        message="BOL updated successfully with partial PATCH",
    )


async def duplicate_bol(
    db: AsyncSession, source_id_or_number: str, new_bol_number: str
) -> BOLSaveResponse:
    """Fast, safe BOL duplication cloning required logistics specs into a new transaction (Section 28)."""
    clean_id = source_id_or_number.strip()
    source_detail = await get_bol_detail(db, clean_id)

    # Duplicate check on target number
    dup_check = await check_bol_number_exists(db, new_bol_number)
    if dup_check.exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Target BOL number '{new_bol_number}' already exists.",
        )

    new_id = generate_uuid()
    now = datetime.datetime.now(datetime.timezone.utc)

    # Create cloned BOL (Explicitly excluding old ID, audit history, PDF history, payments)
    cloned_bol = BOLModel(
        id=new_id,
        bol_number=new_bol_number.strip(),
        issue_date=now,
        origin=source_detail.origin,
        destination=source_detail.destination,
        border_station=source_detail.border_station,
        driver_name=source_detail.driver_name,
        father_name=source_detail.father_name,
        driver_rent=Decimal(str(source_detail.driver_rent)),
        carton_count=source_detail.carton_count,
        gross_weight_kg=Decimal(str(source_detail.gross_weight_kg)),
        net_weight_kg=Decimal(str(source_detail.net_weight_kg)),
        cargo_description=source_detail.cargo_description,
        status="active",
        freight_fee=Decimal(str(source_detail.freight_fee)),
        demurrage_fee=Decimal(str(source_detail.demurrage_fee)),
        documentation_fee=Decimal(str(source_detail.documentation_fee)),
        currency=source_detail.currency,
        exchange_rate=Decimal(str(source_detail.exchange_rate)),
        company_id=source_detail.company_id,
        shipper_id=source_detail.shipper_id,
        shipper_name=source_detail.shipper_name,
        consignee_id=source_detail.consignee_id,
        consignee_name=source_detail.consignee_name,
        notify_party_id=source_detail.notify_party_id,
        notify_party_name=source_detail.notify_party_name,
        revision=1,
        created_at=now,
        updated_at=now,
    )
    db.add(cloned_bol)

    # Clone cargo items
    for item in source_detail.items:
        db.add(
            BOLItemModel(
                bol_id=new_id,
                item_description=item.item_description,
                carton_count=item.carton_count,
                gross_weight_kg=Decimal(str(item.gross_weight_kg)),
                net_weight_kg=Decimal(str(item.net_weight_kg)),
                volume_cbm=Decimal(str(item.volume_cbm)),
                package_type=item.package_type,
                commodity_id=item.commodity_id,
            )
        )

    await db.commit()
    invalidate_recent_party_cache()

    return BOLSaveResponse(
        id=new_id,
        bol_number=new_bol_number.strip(),
        revision=1,
        status="active",
        updated_at=now.isoformat(),
        message="BOL duplicated successfully",
    )


async def create_bol_atomic(
    db: AsyncSession, payload: BOLCreateRequest
) -> BOLResponse:
    """Create a new BOL with nested items and containers in one safe atomic transaction (Section 25, 26)."""
    clean_num = payload.bol_number.strip()
    dup_check = await check_bol_number_exists(db, clean_num)
    if dup_check.exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"BOL number {clean_num} already exists",
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    new_id = generate_uuid()

    try:
        new_bol = BOLModel(
            id=new_id,
            bol_number=clean_num,
            origin=payload.origin,
            destination=payload.destination,
            border_station=payload.border_station,
            driver_name=payload.driver_name,
            father_name=payload.father_name,
            driver_rent=Decimal(str(payload.driver_rent)),
            carton_count=payload.carton_count,
            gross_weight_kg=Decimal(str(payload.gross_weight_kg)),
            net_weight_kg=Decimal(str(payload.net_weight_kg)),
            cargo_description=payload.cargo_description,
            status=payload.status,
            freight_fee=Decimal(str(payload.freight_fee)),
            demurrage_fee=Decimal(str(payload.demurrage_fee)),
            documentation_fee=Decimal(str(payload.documentation_fee)),
            currency=payload.currency or "USD",
            exchange_rate=Decimal(str(payload.exchange_rate or 1.0)),
            company_id=payload.company_id,
            shipper_name=payload.shipper_name,
            consignee_name=payload.consignee_name,
            notify_party_name=payload.notify_party_name,
            revision=1,
            created_at=now,
            updated_at=now,
        )
        db.add(new_bol)

        # Add items if present
        for item in payload.items:
            db.add(
                BOLItemModel(
                    bol_id=new_id,
                    item_description=item.item_description,
                    carton_count=item.carton_count,
                    gross_weight_kg=Decimal(str(item.gross_weight_kg)),
                    net_weight_kg=Decimal(str(item.net_weight_kg)),
                    volume_cbm=Decimal(str(item.volume_cbm)),
                    package_type=item.package_type,
                    commodity_id=item.commodity_id,
                )
            )

        # Add containers if present
        for c in payload.containers:
            db.add(
                ContainerModel(
                    bol_id=new_id,
                    container_number=c.container_number,
                    container_type=c.container_type,
                    seal_number=c.seal_number,
                    tare_weight_kg=Decimal(str(c.tare_weight_kg)),
                    max_payload_kg=Decimal(str(c.max_payload_kg)),
                    status=c.status,
                )
            )

        await db.commit()
        await db.refresh(new_bol)
        invalidate_recent_party_cache()
    except Exception as exc:
        await db.rollback()
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Atomic BOL creation transaction failed: {str(exc)}",
        ) from exc

    return BOLResponse(
        id=1,
        bol_number=new_bol.bol_number,
        origin=new_bol.origin,
        border_station=new_bol.border_station,
        driver_name=new_bol.driver_name,
        father_name=new_bol.father_name,
        driver_rent=float(new_bol.driver_rent or 0),
        carton_count=new_bol.carton_count,
        gross_weight_kg=float(new_bol.gross_weight_kg or 0),
        net_weight_kg=float(new_bol.net_weight_kg or 0),
        cargo_description=new_bol.cargo_description,
        destination=new_bol.destination,
        status=new_bol.status,
        freight_fee=float(new_bol.freight_fee or 0),
        demurrage_fee=float(new_bol.demurrage_fee or 0),
        documentation_fee=float(new_bol.documentation_fee or 0),
        currency=new_bol.currency,
        exchange_rate=float(new_bol.exchange_rate or 1.0),
        created_at=new_bol.created_at.isoformat() if new_bol.created_at else now.isoformat(),
        updated_at=new_bol.updated_at.isoformat() if new_bol.updated_at else now.isoformat(),
    )
