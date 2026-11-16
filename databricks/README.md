# Databricks AI Functions Multi-Stage Production Suite

This directory contains the production-grade, end-to-end implementation for **Databricks AI Functions**, **Lakeflow Declarative Streaming Pipelines (SDP/DLT)**, and **Databricks AI Search (Vector Search)**.

---

## Architecture Overview

```
Volumes / Bronze Sources
  ├── /Volumes/main/ai_operations/landing_docs/     (PDFs, Invoices, Receipts)
  ├── /Volumes/main/ai_operations/regulatory_docs/  (Policies, Transit SOPs)
  └── main.ai_operations.bronze_feedback           (Unstructured driver/dispatch tickets)
                         │
                         ▼
Silver Layer (Real-Time AI Enrichment)
  ├── silver_enriched_feedback   ─── ai_mask + ai_analyze_sentiment + ai_classify + ai_extract
  └── silver_parsed_invoices     ─── ai_parse_document + structured line-item extraction
                         │
                         ▼
Gold Layer (RAG, Forecasting & Foundation Models)
  ├── gold_rag_chunks            ─── ai_prep_search with CDF enabled for Vector Search
  ├── gold_logistics_forecast    ─── ai_forecast multi-series time-series predictions
  └── gold_border_compliance     ─── ai_query via system.ai.claude-sonnet-4
```

---

## 1. Quick Start: Upload & Run in Workspace

### Option A: 1-Click UI Import
1. In your Databricks workspace, go to **Workspace** > **Shared** (or your user folder).
2. Click **Import** > **File**.
3. Select `databricks/notebooks/databricks_ai_pipeline.py`.
4. Attach the notebook to a **Serverless SQL Warehouse** or an interactive cluster running **DBR 18.2+** (or DBR 17.3+ for base AI functions).
5. Click **Run All**.

### Option B: Automated Deployer Script (Zero Dependencies)
Set your Databricks credentials in your terminal and run the automated deployer:
```powershell
$env:DATABRICKS_HOST = "https://<your-workspace-instance>.databricks.com"
$env:DATABRICKS_TOKEN = "dapi********************************"
.\.venv\Scripts\python.exe databricks/scripts/deploy_to_workspace.py
```
This script uploads the notebook to `/Workspace/Shared/ai_operations/databricks_ai_pipeline` and pre-configures the pipeline definition.

---

## 2. Lakeflow Declarative Streaming Pipeline

The Lakeflow SQL pipeline (`databricks/lakeflow/lakeflow_ai_pipeline.sql`) converts your data pipelines into automated, event-driven streaming tables:

- **Incremental Ingestion**: `FROM STREAM read_files(...)` and `FROM STREAM(table)` ensures files are processed continuously as they land in Volumes without rescanning old data.
- **Data Quality Expectations**: Enforces constraints like `CONSTRAINT valid_text EXPECT (...) ON VIOLATION DROP ROW`.
- **Change Data Feed (CDF)**: Automatically enabled on `gold_rag_chunks` to feed real-time additions/deletions into the Vector Search index.

### Deploying the Pipeline in Databricks:
1. In Databricks, navigate to **Delta Live Tables** / **Lakeflow Pipelines**.
2. Click **Create Pipeline**.
3. Set:
   - **Pipeline Name**: `AI Operations Lakeflow Pipeline`
   - **Source Code**: Browse to `/Workspace/Shared/ai_operations/lakeflow_ai_pipeline.sql`
   - **Target Catalog**: `main`
   - **Target Schema**: `ai_operations`
   - **Compute Mode**: `Serverless` (or select active cluster)
4. Click **Start** to run the pipeline.

---

## 3. Connect Vector Search / AI Search

The script `databricks/scripts/connect_vector_search.py` automates connecting `main.ai_operations.gold_rag_chunks` to Databricks AI Search:

### Features:
- Provisions a `STANDARD` (or `STORAGE_OPTIMIZED`) Vector Search Endpoint if not already running.
- Creates a **Delta Sync Index** linked directly to the Delta Change Data Feed on `main.ai_operations.gold_rag_chunks`.
- Uses managed embeddings (`databricks-bge-large-en` or `system.ai.bge-large-en`).
- Runs an interactive verification query to test similarity search immediately.

### Running the Vector Search Connector:
```powershell
# Set credentials if running outside Databricks
$env:DATABRICKS_HOST = "https://<your-workspace-instance>.databricks.com"
$env:DATABRICKS_TOKEN = "dapi********************************"

# Run Vector Search sync
.\.venv\Scripts\python.exe databricks/scripts/connect_vector_search.py --endpoint "ai_operations_vs_endpoint" --index "main.ai_operations.gold_rag_chunks_index"
```

To run continuously (sub-minute Delta sync for Standard endpoints):
```powershell
.\.venv\Scripts\python.exe databricks/scripts/connect_vector_search.py --continuous
```

---

## 4. Declarative Automation Bundles (DABs)

If you use the Databricks CLI v1.0+:
```bash
# Validate bundle configuration
databricks bundle validate --strict --target dev

# Deploy pipeline, jobs, and notebooks
databricks bundle deploy --target dev

# Run the complete end-to-end workflow
databricks bundle run ai_workflow_orchestrator --target dev
```
