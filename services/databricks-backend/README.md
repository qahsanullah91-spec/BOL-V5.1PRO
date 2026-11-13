# Sky Databricks Apps Python Backend Service

A unified enterprise Python backend designed specifically for **Databricks Apps**. It demonstrates all 5 foundational pillars of the Databricks Apps platform:

## Capabilities Matrix

| # | Capability | Technology / SDK | Key Pattern / Endpoint |
|---|---|---|---|
| **1** | **Authentication & Identity** | `databricks-sdk` | `Config()` auto-injected Service Principal; `x-forwarded-access-token` for User On-Behalf-Of (`/api/me`) |
| **2** | **Data & Storage** | `databricks-sql-connector`, `asyncpg`, UC Volumes | Serverless SQL (`/api/sql/app` & `/api/sql/user`), Lakebase PostgreSQL (`/api/lakebase/audit-log`), Volumes (`/api/volumes/*`) |
| **3** | **AI & Foundation Models** | Mosaic AI Serving, `databricks-vector-search` | LLM Foundation Models (`/api/ai/chat`), Semantic Vector Index Search (`/api/ai/search`) |
| **4** | **Configuration & Packaging** | `app.yaml`, `requirements.txt` | `valueFrom` resource injection, pre-configured port 8000 binding |
| **5** | **Deployment Pipeline** | CLI v1.0+ & DABs | `deploy.ps1` automated pipeline, `databricks.yml` bundle |

---

## Files Guide

- **`main.py`**: The complete FastAPI application with lifecycle connection pooling (`asyncpg`), Databricks SDK integration, and endpoints for all 5 domains.
- **`app.yaml`**: The Databricks Apps runtime manifest mapping app resources via `valueFrom`.
- **`requirements.txt`**: Production dependencies (FastAPI, uvicorn, asyncpg, psycopg2-binary, databricks-sdk, etc.).
- **`databricks.yml`**: Declarative Automation Bundles (DABs) infrastructure definition.
- **`deploy.ps1`**: Automated PowerShell deployment script supporting both CLI and DABs.

---

## Deployment Instructions

### Method A: Databricks CLI v1.0+ (Quickest)
```powershell
cd services/databricks-backend
.\deploy.ps1 -Method cli -AppName sky-databricks-backend
```

### Method B: Declarative Automation Bundles (DABs)
```powershell
cd services/databricks-backend
.\deploy.ps1 -Method dab
```

### Resource Configuration in Workspace
When deploying for the first time, navigate to the Databricks App in your workspace UI, go to **Settings > Resources**, and bind:
1. **SQL Warehouse**: Key `sql-warehouse` (Permissions: `CAN_USE`)
2. **Lakebase Database**: Key `database` (Permissions: `CAN_CONNECT_AND_CREATE`)
3. **Model Serving Endpoint**: Key `serving-endpoint` (Permissions: `CAN_QUERY`)
4. **Vector Search Index**: Key `vector-search-index` (Permissions: `CAN_QUERY`)
