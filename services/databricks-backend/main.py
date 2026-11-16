"""
Sky Ariana - Databricks Apps Python Backend Service
===================================================
Covers all 5 core Databricks Apps capabilities:
1. Authentication & Identity: Service Principal auto-injection + User On-Behalf-Of pass-through
2. Data & Storage: Serverless SQL Warehouse + Lakebase (PostgreSQL) + Unity Catalog Volumes
3. AI & Foundation Models: Mosaic AI Foundation Model endpoints + AI Search (Vector Search)
4. Configuration: app.yaml valueFrom resource binding
5. Deployment: CLI and DABs compatibility

Features dual-mode support:
- Live Mode: Full integration with Databricks Cloud Workspace, Unity Catalog, and Lakebase
- Simulation Mode: Automatic zero-config offline fallback for local development & AppKit testing
"""

import os
import json
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Optional, Any
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel, Field

# Optional imports for Databricks cloud packages
try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False
    asyncpg = None

try:
    from databricks import sql
    from databricks.sdk import WorkspaceClient
    from databricks.sdk.core import Config
    from databricks.vector_search.client import VectorSearchClient
    DATABRICKS_SDK_AVAILABLE = True
except ImportError:
    DATABRICKS_SDK_AVAILABLE = False
    sql = None
    WorkspaceClient = None
    Config = None
    VectorSearchClient = None

# ---------------------------------------------------------------------------
# 1. Global Configurations & State
# ---------------------------------------------------------------------------
FORCE_SIMULATION = os.getenv("DATABRICKS_SIMULATION_MODE", "").lower() in ("true", "1")
WAREHOUSE_ID = os.getenv("DATABRICKS_WAREHOUSE_ID")
SERVING_ENDPOINT = os.getenv("SERVING_ENDPOINT_NAME", "databricks-meta-llama-3-3-70b-instruct")
VECTOR_INDEX = os.getenv("VECTOR_SEARCH_INDEX_NAME")
VOLUME_ROOT = os.getenv("VOLUME_ROOT_PATH", "/Volumes/main_catalog/logistics_schema/app_documents")
LOCAL_VOLUMES_DIR = Path(__file__).parent / "volumes_local"
LOCAL_VOLUMES_DIR.mkdir(parents=True, exist_ok=True)

# App-level State Holders
cfg: Optional[Any] = None
w: Optional[Any] = None
db_pool: Optional[Any] = None
vsc_client: Optional[Any] = None
SIMULATION_MODE = True
in_memory_audit_logs: List[Dict[str, Any]] = []

# Try initializing live Databricks SDK if available and not forced into simulation
if DATABRICKS_SDK_AVAILABLE and not FORCE_SIMULATION and os.getenv("DATABRICKS_HOST"):
    try:
        cfg = Config()
        w = WorkspaceClient()
        SIMULATION_MODE = False
        print("[DATABRICKS] Live Databricks SDK initialized.")
    except Exception as e:
        print(f"[DATABRICKS] Cloud auth unavailable ({e}). Running in Local Simulation Mode.")
        SIMULATION_MODE = True
else:
    print("[DATABRICKS] Running in Local Simulation Mode (Offline/AppKit dev).")
    SIMULATION_MODE = True

# ---------------------------------------------------------------------------
# 2. Lifecycle Context (Database Pools & Search Client Initialization)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    global db_pool, vsc_client

    # A. Lakebase (PostgreSQL) async connection pool
    pg_host = os.getenv("PGHOST")
    if pg_host and ASYNCPG_AVAILABLE:
        try:
            db_pool = await asyncpg.create_pool(
                host=pg_host,
                database=os.getenv("PGDATABASE"),
                user=os.getenv("PGUSER"),
                password=os.getenv("PGPASSWORD"),
                port=int(os.getenv("PGPORT", "5432")),
                min_size=2,
                max_size=10,
            )
            print(f"[LAKEBASE] Connected successfully to PostgreSQL at {pg_host}")
        except Exception as e:
            print(f"[LAKEBASE] Warning: Could not connect to Lakebase pool: {e}")

    # B. Vector Search client (Live mode only)
    if not SIMULATION_MODE and VECTOR_INDEX and VectorSearchClient and cfg:
        try:
            workspace_url = f"https://{cfg.host}" if not str(cfg.host).startswith("http") else str(cfg.host)
            vsc_client = VectorSearchClient(
                workspace_url=workspace_url,
                service_principal_client_id=cfg.client_id,
                service_principal_client_secret=cfg.client_secret,
                disable_notice=True
            )
            print(f"[VECTOR_SEARCH] Initialized client for index {VECTOR_INDEX}")
        except Exception as e:
            print(f"[VECTOR_SEARCH] Warning: Could not initialize VectorSearchClient: {e}")

    yield

    # Teardown resources on app stop
    if db_pool:
        await db_pool.close()
        print("[LAKEBASE] Database pool closed.")

app = FastAPI(
    title="Sky Databricks Logistics API",
    description="Enterprise Python Backend for Databricks Apps & Sky Ariana BOL",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 3. Auth Dependency: User On-Behalf-Of (OBO) Pass-Through
# ---------------------------------------------------------------------------
async def get_user_token(x_forwarded_access_token: Optional[str] = Header(None)) -> str:
    """Extracts SSO OAuth token passed by Databricks Apps front proxy."""
    if x_forwarded_access_token:
        return x_forwarded_access_token
    dev_token = os.getenv("DATABRICKS_DEV_USER_TOKEN")
    if dev_token:
        return dev_token
    if SIMULATION_MODE:
        return "simulation_dev_token_skyariana_2026"
    raise HTTPException(
        status_code=401,
        detail="Unauthorized: Missing x-forwarded-access-token header."
    )

async def get_db():
    if not db_pool and not SIMULATION_MODE:
        raise HTTPException(status_code=503, detail="Lakebase PostgreSQL pool is not initialized.")
    return db_pool

# ---------------------------------------------------------------------------
# 4. Schemas
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str
    params: Optional[List[Any]] = Field(default_factory=list)

class AuditEvent(BaseModel):
    event_type: str
    details: Dict[str, Any]

class ChatPrompt(BaseModel):
    message: str
    temperature: float = 0.1

# ---------------------------------------------------------------------------
# 5. Welcome & Health Diagnostic Endpoints
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def root_dashboard():
    mode_badge = "Simulation / Local Emulation" if SIMULATION_MODE else "Live Databricks Cloud"
    color = "#3b82f6" if SIMULATION_MODE else "#10b981"
    return f"""
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sky Databricks Logistics API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; line-height: 1.6; }}
          .card {{ background: #1e293b; border-radius: 12px; padding: 28px; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); border: 1px solid #334155; }}
          h1 {{ color: #38bdf8; margin-top: 0; }}
          .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; background: {color}; color: #fff; }}
          code {{ background: #090d16; padding: 2px 6px; border-radius: 4px; color: #f43f5e; }}
          ul {{ padding-left: 20px; }}
          li {{ margin-bottom: 8px; }}
          a {{ color: #38bdf8; text-decoration: none; font-weight: 500; }}
          a:hover {{ text-decoration: underline; }}
          .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }}
          .box {{ background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; }}
        </style>
      </head>
      <body>
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>Sky Ariana Databricks Apps API</h1>
            <span class="badge">{mode_badge}</span>
          </div>
          <p>Enterprise Python service powering Sky Ariana BOL logistics, Serverless SQL Warehouse queries, Lakebase auditing, UC Volumes, and Mosaic AI Foundation Models.</p>
          <div class="grid">
            <div class="box">
              <strong>Interactive Documentation</strong>
              <p>Explore all OpenAPI specifications and test endpoints live:</p>
              <a href="/docs" target="_blank">&rarr; Swagger UI (/docs)</a><br/>
              <a href="/redoc" target="_blank">&rarr; ReDoc UI (/redoc)</a>
            </div>
            <div class="box">
              <strong>Health & Diagnostics</strong>
              <p>Verify live state, warehouse configuration, and vector search readiness:</p>
              <a href="/health" target="_blank">&rarr; Health Check (/health)</a>
            </div>
          </div>
        </div>
      </body>
    </html>
    """

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if not SIMULATION_MODE else "healthy (simulation_mode)",
        "simulation_mode": SIMULATION_MODE,
        "app_service_principal": bool(cfg and getattr(cfg, "client_id", None)),
        "warehouse_configured": bool(WAREHOUSE_ID),
        "lakebase_pool_active": db_pool is not None,
        "vector_search_ready": vsc_client is not None,
        "volumes_local_path": str(LOCAL_VOLUMES_DIR) if SIMULATION_MODE else VOLUME_ROOT,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

# ---------------------------------------------------------------------------
# 6. Endpoints: Identity & Authentication
# ---------------------------------------------------------------------------
@app.get("/api/me")
async def get_user_identity(token: str = Depends(get_user_token)):
    """Validates the forwarded user token and retrieves Unity Catalog identity."""
    if SIMULATION_MODE or not w:
        return {
            "user_name": "developer@skyariana.com",
            "id": "sky-dev-001",
            "display_name": "Sky Ariana Lead Logistics Analyst",
            "active": True,
            "mode": "simulation",
            "roles": ["app_admin", "logistics_auditor", "bol_officer"]
        }
    user_client = WorkspaceClient(token=token)
    user = user_client.current_user.me()
    return {
        "user_name": user.user_name,
        "id": user.id,
        "display_name": user.display_name,
        "active": user.active,
        "mode": "cloud_sso"
    }

# ---------------------------------------------------------------------------
# 7. Endpoints: SQL Warehouse (App vs. User RLS Mode)
# ---------------------------------------------------------------------------
SIMULATED_BOL_RECORDS = [
    ["BOL-2026-001", "Al-Bari Steel Ltd", "Herat", "Islam Qala", "Mashhad", "Steel Rebar & Billets", "450 Bundles", 32500.0, 31800.0, 2450.0, "Delivered", "2026-11-01"],
    ["BOL-2026-002", "Ariana Food Trading", "Kabul", "Torghundi", "Ashgabat", "Fresh Fruit & Dry Fruits", "1200 Cartons", 18200.0, 17500.0, 1850.0, "In Transit", "2026-11-03"],
    ["BOL-2026-003", "Balkh Cotton Processing", "Mazar-i-Sharif", "Hairatan", "Termez", "Cotton Yarn 20s", "800 Bales", 24000.0, 23500.0, 1950.0, "Customs Cleared", "2026-11-05"],
    ["BOL-2026-004", "Kandahar Pomegranate Corp", "Kandahar", "Spin Boldak", "Chaman", "Organic Pomegranates", "1500 Crates", 21000.0, 20200.0, 1600.0, "Delivered", "2026-11-07"],
    ["BOL-2026-005", "Pamir Minerals Export", "Kunduz", "Hairatan", "Tashkent", "Talc Powder & Minerals", "600 Bags", 28000.0, 27400.0, 2200.0, "In Transit", "2026-11-10"],
    ["BOL-2026-006", "Global Transit Logistics", "Herat", "Islam Qala", "Dogharoon", "Industrial Machinery Parts", "42 Cases", 15400.0, 14900.0, 3100.0, "Port Origin", "2026-11-12"],
]
SIMULATED_COLUMNS = [
    "bol_number", "consignee", "origin", "transit_border", "destination",
    "commodity", "packages", "gross_weight_kg", "net_weight_kg", "freight_charge_usd", "status", "created_at"
]

@app.post("/api/sql/app")
def run_app_query(req: QueryRequest):
    """Executes query as Service Principal (Shared/System access)."""
    if SIMULATION_MODE or not sql or not WAREHOUSE_ID:
        q_upper = req.query.upper()
        if "COUNT" in q_upper:
            return {"columns": ["total_shipments", "active_transit"], "rows": [[len(SIMULATED_BOL_RECORDS), 2]]}
        if "SUM" in q_upper or "METRIC" in q_upper:
            total_wt = sum(r[8] for r in SIMULATED_BOL_RECORDS)
            total_freight = sum(r[9] for r in SIMULATED_BOL_RECORDS)
            return {"columns": ["total_net_weight_kg", "total_freight_usd"], "rows": [[total_wt, total_freight]]}
        return {"columns": SIMULATED_COLUMNS, "rows": SIMULATED_BOL_RECORDS}
    
    with sql.connect(
        server_hostname=cfg.host,
        http_path=f"/sql/1.0/warehouses/{WAREHOUSE_ID}",
        credentials_provider=lambda: cfg.authenticate,
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute(req.query, tuple(req.params))
            cols = [c[0] for c in cursor.description] if cursor.description else []
            rows = cursor.fetchall() if cursor.description else []
            return {"columns": cols, "rows": rows}

@app.post("/api/sql/user")
def run_user_query(req: QueryRequest, token: str = Depends(get_user_token)):
    """Executes query as User (Enforces Unity Catalog Row/Column Filters)."""
    if SIMULATION_MODE or not sql or not WAREHOUSE_ID:
        return {"columns": SIMULATED_COLUMNS, "rows": SIMULATED_BOL_RECORDS}
    
    with sql.connect(
        server_hostname=cfg.host,
        http_path=f"/sql/1.0/warehouses/{WAREHOUSE_ID}",
        access_token=token,
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute(req.query, tuple(req.params))
            cols = [c[0] for c in cursor.description] if cursor.description else []
            rows = cursor.fetchall() if cursor.description else []
            return {"columns": cols, "rows": rows}

# ---------------------------------------------------------------------------
# 8. Endpoints: Lakebase (PostgreSQL) Transactional Storage
# ---------------------------------------------------------------------------
@app.post("/api/lakebase/audit-log")
async def record_audit_event(
    event: AuditEvent,
    pool: Optional[Any] = Depends(get_db),
    token: str = Depends(get_user_token)
):
    """Persists transactional event with user attribution in Lakebase PostgreSQL."""
    user_email = "developer@skyariana.com"
    if not SIMULATION_MODE and w:
        user_client = WorkspaceClient(token=token)
        user_email = user_client.current_user.me().user_name

    if SIMULATION_MODE or not pool:
        record = {
            "id": len(in_memory_audit_logs) + 1,
            "event_type": event.event_type,
            "actor": user_email,
            "details": event.details,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        in_memory_audit_logs.append(record)
        return {"status": "recorded", "actor": user_email, "storage": "simulation_in_memory", "id": record["id"]}

    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                event_type TEXT NOT NULL,
                actor TEXT NOT NULL,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            "INSERT INTO audit_logs (event_type, actor, details) VALUES ($1, $2, $3);",
            event.event_type, user_email, json.dumps(event.details)
        )
    return {"status": "recorded", "actor": user_email, "storage": "lakebase_postgresql"}

# ---------------------------------------------------------------------------
# 9. Endpoints: Unity Catalog Volumes (File Storage)
# ---------------------------------------------------------------------------
@app.post("/api/volumes/upload")
async def upload_document(file: UploadFile = File(...)):
    """Directly uploads a file payload to a Unity Catalog Volume or local storage."""
    file_bytes = await file.read()
    
    if SIMULATION_MODE or not w:
        local_target = LOCAL_VOLUMES_DIR / file.filename
        with open(local_target, "wb") as f:
            f.write(file_bytes)
        return {
            "path": str(local_target),
            "filename": file.filename,
            "size_bytes": len(file_bytes),
            "storage": "local_simulation_volume"
        }

    target_path = f"{VOLUME_ROOT}/{file.filename}"
    w.files.upload(target_path, BytesIO(file_bytes), overwrite=True)
    return {"path": target_path, "filename": file.filename, "size_bytes": len(file_bytes), "storage": "unity_catalog_volume"}

@app.get("/api/volumes/download")
def download_document(filename: str = Query(...)):
    """Downloads a document from a Unity Catalog Volume."""
    if SIMULATION_MODE or not w:
        local_target = LOCAL_VOLUMES_DIR / filename
        if not local_target.exists():
            raise HTTPException(status_code=404, detail=f"File {filename} not found in local volume.")
        return {"filename": filename, "size_bytes": local_target.stat().st_size, "storage": "local_simulation_volume"}

    target_path = f"{VOLUME_ROOT}/{filename}"
    try:
        response = w.files.download(target_path)
        content = response.contents.read()
        return {"filename": filename, "size_bytes": len(content), "storage": "unity_catalog_volume"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")

# ---------------------------------------------------------------------------
# 10. Endpoints: Mosaic AI Foundation Models & AI Search
# ---------------------------------------------------------------------------
@app.post("/api/ai/chat")
def chat_with_foundation_model(chat: ChatPrompt):
    """Queries fine-tuned or Foundation Model endpoints (e.g. Llama 3.3)."""
    if SIMULATION_MODE or not w:
        prompt_lower = chat.message.lower()
        if "rate" in prompt_lower or "freight" in prompt_lower or "cost" in prompt_lower:
            reply = (
                "Based on recent border station tariff rates, standard freight from Herat (Islam Qala) to Mashhad "
                "averages $75/MT for steel and dry cargo. Demurrage allowances standard is 72 hours free time at terminal."
            )
        elif "border" in prompt_lower or "transit" in prompt_lower or "customs" in prompt_lower:
            reply = (
                "Current transit border status: Islam Qala (Normal, avg clearance 4.2h), Torghundi (Normal, avg clearance 3.8h), "
                "Hairatan (High flow, rail-to-truck transfer operating 24/7). All T1 customs declarations require valid chamber stamps."
            )
        elif "bol" in prompt_lower or "shipment" in prompt_lower:
            reply = (
                "Sky Ariana BOL system currently tracks 6 active cross-border shipments totaling 135,300 kg net weight. "
                "All accounting invariants (Net Balance = Total Debit - Total Credit) are verified in equilibrium."
            )
        else:
            reply = (
                f"[Mosaic AI Llama-3.3-70b-instruct Simulation]: Analysis completed for query '{chat.message}'. "
                "All shipment parameters conform to Sky Ariana international logistics regulations."
            )
        return {"reply": reply, "model": SERVING_ENDPOINT, "mode": "simulation"}

    response = w.serving_endpoints.query(
        name=SERVING_ENDPOINT,
        messages=[
            {"role": "system", "content": "You are an enterprise logistics AI advisor."},
            {"role": "user", "content": chat.message}
        ],
        temperature=chat.temperature,
        max_tokens=512,
    )
    return {"reply": response.choices[0].message.content, "model": SERVING_ENDPOINT, "mode": "cloud"}

@app.get("/api/ai/search")
def semantic_search(query: str = Query(...), limit: int = 5):
    """Executes high-QPS similarity searches against Vector Search indexes."""
    if SIMULATION_MODE or not vsc_client or not VECTOR_INDEX:
        # Realistic semantic search hits based on logistics terms
        results = [
            {
                "id": f"doc-vec-{i+1}",
                "document_text": f"Bill of Lading manifest for {r[0]} ({r[1]}): {r[5]}, Net Weight: {r[8]} kg via {r[3]}.",
                "metadata": {"bol_number": r[0], "border": r[3], "commodity": r[5], "destination": r[4]},
                "score": round(0.96 - (i * 0.05), 4)
            }
            for i, r in enumerate(SIMULATED_BOL_RECORDS[:limit])
        ]
        return {"results": results, "index": VECTOR_INDEX or "simulated_logistics_index", "mode": "simulation"}

    index = vsc_client.get_index(index_name=VECTOR_INDEX)
    results = index.similarity_search(
        query_text=query,
        columns=["id", "document_text", "metadata"],
        num_results=limit
    )
    return {"results": results.get("result", {}).get("data_array", []), "mode": "cloud"}
