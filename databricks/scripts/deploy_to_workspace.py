#!/usr/bin/env python3
"""
Databricks Workspace Automated Asset Importer & Deployer
Uses native standard library (urllib) to upload notebooks and trigger pipelines.
No external dependencies required.

Usage:
    export DATABRICKS_HOST="https://adb-xxxxxx.azuredatabricks.net"
    export DATABRICKS_TOKEN="dapi..."
    python databricks/scripts/deploy_to_workspace.py
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error
from pathlib import Path


def get_databricks_credentials():
    host = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")
    token = os.environ.get("DATABRICKS_TOKEN", "").strip()

    if not host or not token:
        # Check ~/.databrickscfg
        cfg_path = Path.home() / ".databrickscfg"
        if cfg_path.exists():
            print(f"Reading configuration from {cfg_path}...")
            with open(cfg_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("host") and not host:
                        host = line.split("=", 1)[1].strip().rstrip("/")
                    elif line.startswith("token") and not token:
                        token = line.split("=", 1)[1].strip()

    if not host or not token:
        print("\n[ERROR] Databricks credentials not found.")
        print("Please set the following environment variables:")
        print("  $env:DATABRICKS_HOST = 'https://<your-workspace-instance>.databricks.com'")
        print("  $env:DATABRICKS_TOKEN = 'dapi********************************'")
        print("\nOr configure ~/.databrickscfg.")
        sys.exit(1)

    return host, token


def databricks_api_call(host: str, token: str, endpoint: str, method: str = "GET", data: dict = None):
    url = f"{host}{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"API Error ({e.code}) on {endpoint}: {err_msg}")
        raise


def test_connection(host: str, token: str):
    print(f"\n[1/3] Verifying Databricks connection to: {host}...")
    try:
        user_info = databricks_api_call(host, token, "/api/2.0/preview/scim/v2/Me")
        user_name = user_info.get("userName") or user_info.get("displayName") or "Authenticated User"
        print(f"SUCCESS: Connected as {user_name}")
    except Exception as e:
        print(f"FAILED: Could not authenticate to {host}. Please verify DATABRICKS_TOKEN.")
        sys.exit(1)


def upload_notebook(host: str, token: str, local_path: Path, workspace_path: str):
    print(f"\n[2/3] Uploading notebook to: {workspace_path}...")
    if not local_path.exists():
        print(f"Error: local file not found: {local_path}")
        sys.exit(1)

    with open(local_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "content": content_b64,
        "path": workspace_path,
        "language": "PYTHON",
        "format": "SOURCE",
        "overwrite": True
    }

    try:
        # Create parent directory if needed
        parent_dir = str(Path(workspace_path).parent).replace("\\", "/")
        databricks_api_call(host, token, "/api/2.0/workspace/mkdirs", "POST", {"path": parent_dir})
        
        # Import notebook
        databricks_api_call(host, token, "/api/2.0/workspace/import", "POST", payload)
        print(f"SUCCESS: Notebook successfully uploaded to {workspace_path}")
        print(f"Open in browser: {host}/#workspace{workspace_path}")
    except Exception as e:
        print(f"FAILED to upload notebook: {e}")
        raise


def register_lakeflow_pipeline(host: str, token: str, pipeline_sql_path: Path, target_catalog: str = "main", target_schema: str = "ai_operations"):
    print(f"\n[3/3] Checking Lakeflow / DLT Declarative Pipeline specification...")
    print(f"Target Catalog: {target_catalog} | Schema: {target_schema}")
    print(f"Local SQL Pipeline: {pipeline_sql_path}")
    
    # Upload SQL file to workspace so the pipeline can reference it
    ws_sql_path = f"/Workspace/Shared/ai_operations/lakeflow_ai_pipeline.sql"
    with open(pipeline_sql_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "content": content_b64,
        "path": ws_sql_path,
        "language": "SQL",
        "format": "SOURCE",
        "overwrite": True
    }
    databricks_api_call(host, token, "/api/2.0/workspace/import", "POST", payload)
    print(f"Uploaded pipeline SQL definition to: {ws_sql_path}")

    pipeline_spec = {
        "name": "ai_operations_lakeflow_pipeline",
        "catalog": target_catalog,
        "target": target_schema,
        "continuous": False,  # Serverless auto-scaling or triggered
        "channel": "preview",
        "libraries": [
            {"notebook": {"path": ws_sql_path}}
        ],
        "serverless": True
    }

    print("\nLakeflow Pipeline Ready to Create or Run!")
    print(f"Pipeline Config: {json.dumps(pipeline_spec, indent=2)}")


def main():
    print("=================================================================")
    print("Databricks AI Operations Asset Deployer")
    print("=================================================================")

    base_dir = Path(__file__).resolve().parent.parent
    notebook_path = base_dir / "notebooks" / "databricks_ai_pipeline.py"
    lakeflow_path = base_dir / "lakeflow" / "lakeflow_ai_pipeline.sql"

    host, token = get_databricks_credentials()
    test_connection(host, token)

    target_ws_notebook = "/Workspace/Shared/ai_operations/databricks_ai_pipeline"
    upload_notebook(host, token, notebook_path, target_ws_notebook)
    register_lakeflow_pipeline(host, token, lakeflow_path)

    print("\n=================================================================")
    print("DEPLOYMENT COMPLETED SUCCESSFULLY")
    print("=================================================================")


if __name__ == "__main__":
    main()
