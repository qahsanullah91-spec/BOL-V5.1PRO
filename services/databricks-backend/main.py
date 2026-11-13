"""
Sky Ariana - Databricks Apps Python Backend Service
===================================================
Covers all 5 core capabilities:
1. Authentication & Identity: Service Principal auto-injection + User On-Behalf-Of pass-through
2. Data & Storage: Serverless SQL Warehouse + Lakebase (PostgreSQL) + Unity Catalog Volumes
3. AI & Foundation Models: Mosaic AI Foundation Model endpoints + AI Search (Vector Search)
4. Configuration: app.yaml valueFrom resource binding
5. Deployment: CLI and DABs compatibility
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Optional
from io import BytesIO

from fastapi import FastAPI, Header, HTTPException, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import asyncpg
from databricks import sql
from databricks.sdk import WorkspaceClient
from databricks.sdk.core import Config
from databricks.vector_search.client import VectorSearchClient

# ---------------------------------------------------------------------------
# 1. Global Configurations & Clients
# ---------------------------------------------------------------------------
cfg = Config()  # Auto-injects DATABRICKS_CLIENT_ID & DATABRICKS_CLIENT_SECRET
w = WorkspaceClient()

# App-level State Holders
db_pool: Optional[asyncpg.Pool] = None
vsc_client: Optional[VectorSearchClient] = None

# Resource identifiers (injected via app.yaml valueFrom)
WAREHOUSE_ID = os.getenv("DATABRICKS_WAREHOUSE_ID")
SERVING_ENDPOINT = os.getenv("SERVING_ENDPOINT_NAME", "databricks-meta-llama-3-3-70b-instruct")
VECTOR_INDEX = os.getenv("VECTOR_SEARCH_INDEX_NAME")
VOLUME_ROOT = os.getenv("VOLUME_ROOT_PATH", "/Volumes/main_catalog/logistics_schema/app_documents")

# ---------------------------------------------------------------------------
# 2. Lifecycle Context (Database Pools & Search Client Initialization)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    global db_pool, vsc_client

    # A. Initialize Lakebase (PostgreSQL) async connection pool
    pg_host = os.getenv("PGHOST")
    if pg_host:
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

    # B. Initialize Vector Search client
    if VECTOR_INDEX:
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
    description="Enterprise Python Backend for Databricks Apps",
    version="1.0.0",
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
    if not x_forwarded_access_token:
        # Fallback for local dev when running outside Databricks App proxy
        dev_token = os.getenv("DATABRICKS_DEV_USER_TOKEN")
        if dev_token:
            return dev_token
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing x-forwarded-access-token header."
        )
    return x_forwarded_access_token

async def get_db() -> asyncpg.Pool:
    if not db_pool:
        raise HTTPException(status_code=503, detail="Lakebase PostgreSQL pool is not initialized.")
    return db_pool

# ---------------------------------------------------------------------------
# 4. Schemas
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str
    params: Optional[List] = Field(default_factory=list)

class AuditEvent(BaseModel):
    event_type: str
    details: Dict

class ChatPrompt(BaseModel):
    message: str
    temperature: float = 0.1

# ---------------------------------------------------------------------------
# 5. Health & Diagnostic Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_service_principal": cfg.client_id is not None,
        "warehouse_configured": WAREHOUSE_ID is not None,
        "lakebase_pool_active": db_pool is not None,
        "vector_search_ready": vsc_client is not None,
    }

# ---------------------------------------------------------------------------
# 6. Endpoints: Identity & Authentication
# ---------------------------------------------------------------------------
@app.get("/api/me")
async def get_user_identity(token: str = Depends(get_user_token)):
    """Validates the forwarded user token and retrieves Unity Catalog identity."""
    user_client = WorkspaceClient(token=token)
    user = user_client.current_user.me()
    return {
        "user_name": user.user_name,
        "id": user.id,
        "display_name": user.display_name,
        "active": user.active,
    }

# ---------------------------------------------------------------------------
# 7. Endpoints: SQL Warehouse (App vs. User RLS Mode)
# ---------------------------------------------------------------------------
@app.post("/api/sql/app")
def run_app_query(req: QueryRequest):
    """Executes query as Service Principal (Shared/System access)."""
    if not WAREHOUSE_ID:
        raise HTTPException(status_code=500, detail="DATABRICKS_WAREHOUSE_ID not configured.")
    
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
    if not WAREHOUSE_ID:
        raise HTTPException(status_code=500, detail="DATABRICKS_WAREHOUSE_ID not configured.")
    
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
    pool: asyncpg.Pool = Depends(get_db),
    token: str = Depends(get_user_token)
):
    """Persists transactional event with user attribution in Lakebase PostgreSQL."""
    user_client = WorkspaceClient(token=token)
    user_email = user_client.current_user.me().user_name

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
            event.event_type, user_email, str(event.details)
        )
    return {"status": "recorded", "actor": user_email}

# ---------------------------------------------------------------------------
# 9. Endpoints: Unity Catalog Volumes (File Storage)
# ---------------------------------------------------------------------------
@app.post("/api/volumes/upload")
async def upload_document(file: UploadFile = File(...)):
    """Directly uploads a file payload to a Unity Catalog Volume."""
    file_bytes = await file.read()
    target_path = f"{VOLUME_ROOT}/{file.filename}"
    
    w.files.upload(target_path, BytesIO(file_bytes), overwrite=True)
    return {"path": target_path, "filename": file.filename, "size_bytes": len(file_bytes)}

@app.get("/api/volumes/download")
def download_document(filename: str = Query(...)):
    """Downloads a document from a Unity Catalog Volume."""
    target_path = f"{VOLUME_ROOT}/{filename}"
    try:
        response = w.files.download(target_path)
        content = response.contents.read()
        return {"filename": filename, "size_bytes": len(content)}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")

# ---------------------------------------------------------------------------
# 10. Endpoints: Mosaic AI Foundation Models & AI Search
# ---------------------------------------------------------------------------
@app.post("/api/ai/chat")
def chat_with_foundation_model(chat: ChatPrompt):
    """Queries fine-tuned or Foundation Model endpoints (e.g. Llama 3.3)."""
    response = w.serving_endpoints.query(
        name=SERVING_ENDPOINT,
        messages=[
            {"role": "system", "content": "You are an enterprise logistics AI advisor."},
            {"role": "user", "content": chat.message}
        ],
        temperature=chat.temperature,
        max_tokens=512,
    )
    return {"reply": response.choices[0].message.content}

@app.get("/api/ai/search")
def semantic_search(query: str = Query(...), limit: int = 5):
    """Executes high-QPS similarity searches against Vector Search indexes."""
    if not vsc_client or not VECTOR_INDEX:
        raise HTTPException(status_code=500, detail="Vector search not configured.")
    
    index = vsc_client.get_index(index_name=VECTOR_INDEX)
    results = index.similarity_search(
        query_text=query,
        columns=["id", "document_text", "metadata"],
        num_results=limit
    )
    return {"results": results.get("result", {}).get("data_array", [])}
