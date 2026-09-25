"""Party search service with LRU recent cache and fast prefix indexing."""
from __future__ import annotations

import collections
from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.parties import (
    CompanyModel,
    ConsigneeModel,
    CustomerModel,
    NotifyPartyModel,
    ShipperModel,
)
from backend.schemas.parties import PartySearchItem

# In-memory recent party cache for ultra-fast selection (last 10 per role)
_RECENT_CACHE: dict[str, collections.deque[PartySearchItem]] = {
    "SHIPPER": collections.deque(maxlen=10),
    "CONSIGNEE": collections.deque(maxlen=10),
    "NOTIFY_PARTY": collections.deque(maxlen=10),
    "CUSTOMER": collections.deque(maxlen=10),
}


def record_recent_party(item: PartySearchItem) -> None:
    """Store party in recent cache, avoiding duplicates."""
    role = item.role.upper()
    if role not in _RECENT_CACHE:
        _RECENT_CACHE[role] = collections.deque(maxlen=10)
    deck = _RECENT_CACHE[role]
    # Remove existing if present to move to top
    for i, existing in enumerate(list(deck)):
        if existing.id == item.id:
            del deck[i]
            break
    deck.appendleft(item)


def get_recent_parties(role: Optional[str] = None) -> List[PartySearchItem]:
    """Retrieve cached recent parties for instant selector rendering."""
    if role and role.upper() in _RECENT_CACHE:
        return list(_RECENT_CACHE[role.upper()])
    all_recent: list[PartySearchItem] = []
    for r, deck in _RECENT_CACHE.items():
        all_recent.extend(deck)
    return all_recent[:20]


def invalidate_recent_party_cache(role: Optional[str] = None) -> None:
    """Invalidate recent party cache after record changes (Section 5)."""
    if role and role.upper() in _RECENT_CACHE:
        _RECENT_CACHE[role.upper()].clear()
    else:
        for deck in _RECENT_CACHE.values():
            deck.clear()


async def search_parties(
    db: AsyncSession,
    query: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 20,
) -> List[PartySearchItem]:
    """Search parties across Shippers, Consignees, Notify Parties, and Customers.
    
    Uses prefix matching first, then substring search.
    If query is empty, returns recent cached parties.
    """
    clean_q = (query or "").strip()
    clean_role = (role or "").strip().upper()

    if not clean_q:
        recent = get_recent_parties(clean_role)
        if recent:
            return recent[:limit]

    results: list[PartySearchItem] = []
    limit = max(1, min(limit, 50))

    # Helper for search
    prefix_q = f"{clean_q}%"
    sub_q = f"%{clean_q}%"

    # 1. Shippers
    if not clean_role or clean_role in ("SHIPPER", "ALL"):
        stmt = (
            select(ShipperModel)
            .where(
                or_(
                    ShipperModel.name.ilike(prefix_q),
                    ShipperModel.name.ilike(sub_q),
                    ShipperModel.phone.ilike(prefix_q) if clean_q else False,
                )
            )
            .limit(limit)
        )
        res = await db.execute(stmt)
        for s in res.scalars():
            results.append(
                PartySearchItem(
                    id=s.id,
                    name=s.name,
                    role="SHIPPER",
                    code=s.code,
                    company_name=s.company.company_name if s.company else None,
                    contact_person=s.contact_person,
                    phone=s.phone,
                    email=s.email,
                    address=s.address,
                    city=s.city,
                    country=s.country,
                )
            )

    # 2. Consignees
    if (not clean_role or clean_role in ("CONSIGNEE", "ALL")) and len(results) < limit:
        stmt = (
            select(ConsigneeModel)
            .where(
                or_(
                    ConsigneeModel.name.ilike(prefix_q),
                    ConsigneeModel.name.ilike(sub_q),
                    ConsigneeModel.phone.ilike(prefix_q) if clean_q else False,
                )
            )
            .limit(limit - len(results))
        )
        res = await db.execute(stmt)
        for c in res.scalars():
            results.append(
                PartySearchItem(
                    id=c.id,
                    name=c.name,
                    role="CONSIGNEE",
                    code=c.code,
                    company_name=c.company.company_name if c.company else None,
                    contact_person=c.contact_person,
                    phone=c.phone,
                    email=c.email,
                    address=c.address,
                    city=c.city,
                    country=c.country,
                )
            )

    # 3. Notify Parties
    if (not clean_role or clean_role in ("NOTIFY_PARTY", "ALL")) and len(results) < limit:
        stmt = (
            select(NotifyPartyModel)
            .where(
                or_(
                    NotifyPartyModel.name.ilike(prefix_q),
                    NotifyPartyModel.name.ilike(sub_q),
                    NotifyPartyModel.phone.ilike(prefix_q) if clean_q else False,
                )
            )
            .limit(limit - len(results))
        )
        res = await db.execute(stmt)
        for n in res.scalars():
            results.append(
                PartySearchItem(
                    id=n.id,
                    name=n.name,
                    role="NOTIFY_PARTY",
                    contact_person=n.contact_person,
                    phone=n.phone,
                    email=n.email,
                    address=n.address,
                    city=n.city,
                    country=n.country,
                )
            )

    # 4. Customers
    if (not clean_role or clean_role in ("CUSTOMER", "ALL")) and len(results) < limit:
        stmt = (
            select(CustomerModel)
            .where(
                or_(
                    CustomerModel.customer_name.ilike(prefix_q),
                    CustomerModel.customer_name.ilike(sub_q),
                    CustomerModel.phone.ilike(prefix_q) if clean_q else False,
                )
            )
            .limit(limit - len(results))
        )
        res = await db.execute(stmt)
        for cust in res.scalars():
            results.append(
                PartySearchItem(
                    id=cust.id,
                    name=cust.customer_name,
                    role="CUSTOMER",
                    company_name=cust.company,
                    phone=cust.phone,
                    email=cust.email,
                    address=cust.address,
                )
            )

    return results
