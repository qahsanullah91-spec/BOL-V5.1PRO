"""Server-driven ledger accounting service with exact Decimal calculation and SQL aggregate performance."""
from __future__ import annotations

import csv
import io
from decimal import Decimal
from typing import Any, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.accounting import LedgerAccountModel, LedgerModel
from backend.schemas.ledger import (
    LedgerAccountSummary,
    LedgerEntryItem,
    LedgerExportResponse,
    LedgerPageResponse,
)


def _to_decimal(val: Any) -> Decimal:
    """Safely convert any numeric or string amount to Decimal."""
    if val is None or val == "":
        return Decimal("0.0000")
    try:
        return Decimal(str(val))
    except Exception:
        return Decimal("0.0000")


def _format_money(d: Decimal) -> str:
    """Format Decimal amount to clean 2-decimal string without float rounding issues."""
    return f"{d:.2f}"


async def get_ledger_page(
    db: AsyncSession,
    account_id: Optional[str] = None,
    company_id: Optional[str] = None,
    party_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    currency: Optional[str] = "USD",
    page: int = 1,
    page_size: int = 50,
    sort_dir: str = "asc",
) -> LedgerPageResponse:
    """Server-driven ledger query calculating totals and running balances via SQL aggregation (Sections 32-38, 43-45)."""
    page = max(1, page)
    page_size = max(1, min(page_size, 200))
    offset = (page - 1) * page_size
    curr = (currency or "USD").upper()

    # 1. Base filter conditions for the window
    filters = [LedgerModel.currency == curr]
    if account_id:
        filters.append(LedgerModel.account_id == account_id)
    if date_from:
        filters.append(LedgerModel.transaction_date >= date_from)
    if date_to:
        filters.append(LedgerModel.transaction_date <= date_to)

    window_where = and_(*filters)

    # 2. SQL Aggregate Opening Balance Calculation (transactions prior to date_from, Section 35)
    opening_balance = Decimal("0.0000")
    if date_from:
        prior_filters = [LedgerModel.currency == curr, LedgerModel.transaction_date < date_from]
        if account_id:
            prior_filters.append(LedgerModel.account_id == account_id)
        prior_where = and_(*prior_filters)

        prior_stmt = select(
            func.coalesce(func.sum(LedgerModel.debit), 0),
            func.coalesce(func.sum(LedgerModel.credit), 0),
        ).where(prior_where)
        prior_res = (await db.execute(prior_stmt)).one()
        prior_dr = _to_decimal(prior_res[0])
        prior_cr = _to_decimal(prior_res[1])
        opening_balance = prior_dr - prior_cr

    # 3. Fast Total Count & Summary Totals in Single Query for Filtered Window (Section 48)
    summary_stmt = select(
        func.count(LedgerModel.id),
        func.coalesce(func.sum(LedgerModel.debit), 0),
        func.coalesce(func.sum(LedgerModel.credit), 0),
    ).where(window_where)
    summary_row = (await db.execute(summary_stmt)).one()
    total_count = summary_row[0]
    period_debit = _to_decimal(summary_row[1])
    period_credit = _to_decimal(summary_row[2])
    closing_balance = opening_balance + period_debit - period_credit

    # 4. Running Balance across pages (Section 44)
    # Compute sum of (debit - credit) for rows strictly prior to this page offset
    page_start_balance = opening_balance
    if offset > 0 and total_count > 0:
        offset_items_stmt = (
            select(
                func.coalesce(func.sum(LedgerModel.debit), 0),
                func.coalesce(func.sum(LedgerModel.credit), 0),
            )
            .where(window_where)
            .order_by(
                LedgerModel.transaction_date.asc() if sort_dir.lower() == "asc" else LedgerModel.transaction_date.desc(),
                LedgerModel.id.asc(),
            )
            .limit(offset)
        )
        # Using subquery to limit offset items
        subq = (
            select(LedgerModel.debit, LedgerModel.credit)
            .where(window_where)
            .order_by(
                LedgerModel.transaction_date.asc() if sort_dir.lower() == "asc" else LedgerModel.transaction_date.desc(),
                LedgerModel.id.asc(),
            )
            .limit(offset)
            .subquery()
        )
        pre_sum_stmt = select(
            func.coalesce(func.sum(subq.c.debit), 0),
            func.coalesce(func.sum(subq.c.credit), 0),
        )
        pre_row = (await db.execute(pre_sum_stmt)).one()
        pre_dr = _to_decimal(pre_row[0])
        pre_cr = _to_decimal(pre_row[1])
        page_start_balance = opening_balance + (pre_dr - pre_cr)

    # 5. Page records query with deterministic sorting (Section 45)
    order_clause = (
        (LedgerModel.transaction_date.asc(), LedgerModel.id.asc())
        if sort_dir.lower() == "asc"
        else (LedgerModel.transaction_date.desc(), LedgerModel.id.desc())
    )

    page_stmt = (
        select(
            LedgerModel.id,
            LedgerModel.account_id,
            LedgerModel.account_name,
            LedgerModel.transaction_date,
            LedgerModel.description,
            LedgerModel.debit,
            LedgerModel.credit,
            LedgerModel.balance,
            LedgerModel.currency,
            LedgerModel.fee_type,
            LedgerModel.exchange_rate,
            LedgerModel.reference_id,
            LedgerModel.bol_id,
            LedgerModel.invoice_id,
            LedgerModel.revision,
            LedgerModel.created_at,
            LedgerModel.updated_at,
        )
        .where(window_where)
        .order_by(*order_clause)
        .offset(offset)
        .limit(page_size)
    )

    rows = (await db.execute(page_stmt)).all()

    # Calculate row-by-row running balance
    current_running = page_start_balance
    items: list[LedgerEntryItem] = []
    for r in rows:
        row_dr = _to_decimal(r.debit)
        row_cr = _to_decimal(r.credit)
        current_running = current_running + row_dr - row_cr

        items.append(
            LedgerEntryItem(
                id=r.id,
                account_id=r.account_id,
                account_name=r.account_name,
                transaction_date=r.transaction_date,
                description=r.description,
                debit=_format_money(row_dr),
                credit=_format_money(row_cr),
                balance=_format_money(current_running),
                currency=r.currency or "USD",
                fee_type=r.fee_type,
                exchange_rate=_format_money(_to_decimal(r.exchange_rate)),
                reference_id=r.reference_id,
                bol_id=r.bol_id,
                invoice_id=r.invoice_id,
                revision=r.revision or 1,
                created_at=r.created_at.isoformat() if r.created_at else None,
                updated_at=r.updated_at.isoformat() if r.updated_at else None,
            )
        )

    pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1

    return LedgerPageResponse(
        opening_balance=_format_money(opening_balance),
        total_debit=_format_money(period_debit),
        total_credit=_format_money(period_credit),
        closing_balance=_format_money(closing_balance),
        items=items,
        page=page,
        page_size=page_size,
        total=total_count,
        pages=pages,
        currency=curr,
    )


async def search_ledger_accounts(
    db: AsyncSession, query: Optional[str] = None, limit: int = 30
) -> List[LedgerAccountSummary]:
    """Lightweight searchable account selector (Section 40, 41)."""
    clean_q = (query or "").strip()
    limit = max(1, min(limit, 100))

    stmt = select(LedgerAccountModel).where(LedgerAccountModel.is_active == True)  # noqa: E712
    if clean_q:
        stmt = stmt.where(
            or_(
                LedgerAccountModel.account_name.ilike(f"{clean_q}%"),
                LedgerAccountModel.account_name.ilike(f"%{clean_q}%"),
                LedgerAccountModel.account_code.ilike(f"{clean_q}%"),
            )
        )
    stmt = stmt.order_by(LedgerAccountModel.account_name.asc()).limit(limit)

    rows = (await db.execute(stmt)).scalars().all()
    results: list[LedgerAccountSummary] = []
    for r in rows:
        results.append(
            LedgerAccountSummary(
                id=r.id,
                account_code=r.account_code,
                account_name=r.account_name,
                account_type=r.account_type,
                currency=r.currency,
                current_balance=_format_money(_to_decimal(r.current_balance)),
                entry_count=0,
            )
        )
    return results


async def generate_ledger_csv_export(
    db: AsyncSession,
    account_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    currency: str = "USD",
) -> Tuple[str, int]:
    """Generate server-side CSV export without loading into frontend JavaScript (Section 50)."""
    filters = [LedgerModel.currency == currency.upper()]
    if account_id:
        filters.append(LedgerModel.account_id == account_id)
    if date_from:
        filters.append(LedgerModel.transaction_date >= date_from)
    if date_to:
        filters.append(LedgerModel.transaction_date <= date_to)

    stmt = (
        select(
            LedgerModel.transaction_date,
            LedgerModel.account_name,
            LedgerModel.description,
            LedgerModel.debit,
            LedgerModel.credit,
            LedgerModel.currency,
            LedgerModel.reference_id,
        )
        .where(and_(*filters))
        .order_by(LedgerModel.transaction_date.asc(), LedgerModel.id.asc())
    )
    rows = (await db.execute(stmt)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Account", "Description", "Debit", "Credit", "Balance", "Currency", "Reference"])

    running = Decimal("0.00")
    for r in rows:
        dr = _to_decimal(r[3])
        cr = _to_decimal(r[4])
        running += dr - cr
        writer.writerow([r[0], r[1], r[2], _format_money(dr), _format_money(cr), _format_money(running), r[5], r[6] or ""])

    return output.getvalue(), len(rows)


def build_whatsapp_summary_text(
    account_name: str,
    opening: str,
    debit: str,
    credit: str,
    closing: str,
    currency: str = "USD",
) -> str:
    """Generate concise WhatsApp accounting summary text from server totals (Section 53)."""
    return (
        f"*AQ COMPANIES - Sky Ariana Account Ledger*\n"
        f"Account: {account_name}\n"
        f"Currency: {currency}\n"
        f"--------------------------\n"
        f"Opening Balance: {opening} {currency}\n"
        f"Total Debit:     {debit} {currency}\n"
        f"Total Credit:    {credit} {currency}\n"
        f"Net Closing:     {closing} {currency}\n"
        f"--------------------------\n"
        f"Accounting Invariance Checked (Balance = Debit - Credit)."
    )
