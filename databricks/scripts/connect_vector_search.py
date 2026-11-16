#!/usr/bin/env python3
"""
Databricks AI Search (Vector Search) Provisioning & Delta Sync Script
Links `main.ai_operations.gold_rag_chunks` to a Databricks Vector Search endpoint.

Supported Auth:
  - Databricks Notebook runtime context
  - Environment variables: DATABRICKS_HOST and DATABRICKS_TOKEN
  - Databricks configuration profile (~/.databrickscfg)
"""

import os
import sys
import time
import argparse
from typing import Optional, Dict, Any

# Ensure compatibility with both databricks-ai-search and databricks-vectorsearch
try:
    from databricks.ai_search.client import AISearchClient as VectorClient
    CLIENT_CLASS_NAME = "AISearchClient (databricks-ai-search)"
except ImportError:
    try:
        from databricks.vector_search.client import VectorSearchClient as VectorClient
        CLIENT_CLASS_NAME = "VectorSearchClient (databricks-vectorsearch)"
    except ImportError:
        VectorClient = None
        CLIENT_CLASS_NAME = None


DEFAULT_ENDPOINT_NAME = "ai_operations_vs_endpoint"
DEFAULT_SOURCE_TABLE = "main.ai_operations.gold_rag_chunks"
DEFAULT_INDEX_NAME = "main.ai_operations.gold_rag_chunks_index"
DEFAULT_EMBEDDING_MODEL = "databricks-bge-large-en"  # Standard managed embedding model


def get_vector_client(
    workspace_url: Optional[str] = None,
    personal_access_token: Optional[str] = None
) -> Any:
    """Initializes Vector Search client with environment fallback."""
    if VectorClient is None:
        raise RuntimeError(
            "Missing Vector Search client library.\n"
            "Install in your environment using: pip install 'databricks-ai-search>=0.79'\n"
            "Or within a Databricks Notebook: %pip install 'databricks-ai-search>=0.79'"
        )

    host = workspace_url or os.environ.get("DATABRICKS_HOST")
    token = personal_access_token or os.environ.get("DATABRICKS_TOKEN")

    if host and token:
        # Strip trailing slashes from host
        host = host.rstrip("/")
        print(f"Connecting to Databricks workspace via explicit credentials ({host})...")
        return VectorClient(workspace_url=host, personal_access_token=token)
    
    print("Connecting to Databricks using local configuration profile / ambient execution context...")
    return VectorClient()


def ensure_endpoint(
    client: Any,
    endpoint_name: str,
    endpoint_type: str = "STANDARD",
    wait_online: bool = True,
    timeout_minutes: int = 15
) -> Dict[str, Any]:
    """Ensures that the Vector Search endpoint exists and is ONLINE."""
    print(f"\n[1/3] Checking Vector Search Endpoint: '{endpoint_name}'...")
    
    try:
        endpoint = client.get_endpoint(endpoint_name)
        status = endpoint.get("endpoint_status", {}).get("state", "UNKNOWN")
        print(f"Endpoint '{endpoint_name}' already exists. Current status: {status}")
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg or "resource_does_not_exist" in error_msg or "404" in error_msg:
            print(f"Endpoint '{endpoint_name}' does not exist. Creating with type={endpoint_type}...")
            endpoint = client.create_endpoint(
                name=endpoint_name,
                endpoint_type=endpoint_type
            )
            status = endpoint.get("endpoint_status", {}).get("state", "PROVISIONING")
            print(f"Provisioning initiated for '{endpoint_name}' (status: {status}).")
        else:
            raise

    if wait_online and status != "ONLINE":
        print(f"Waiting for endpoint '{endpoint_name}' to become ONLINE (timeout: {timeout_minutes}m)...")
        start_time = time.time()
        timeout_seconds = timeout_minutes * 60

        while time.time() - start_time < timeout_seconds:
            time.sleep(15)
            endpoint = client.get_endpoint(endpoint_name)
            status = endpoint.get("endpoint_status", {}).get("state", "UNKNOWN")
            print(f"  > Endpoint '{endpoint_name}' status: {status}")
            if status == "ONLINE":
                print(f"SUCCESS: Endpoint '{endpoint_name}' is now ONLINE!")
                break
            if status in ["OFFLINE", "ERROR", "STOPPED"]:
                raise RuntimeError(f"Endpoint reached failure state: {status}")
        else:
            print(f"WARNING: Endpoint is still {status} after {timeout_minutes} minutes.")

    return endpoint


def ensure_delta_sync_index(
    client: Any,
    endpoint_name: str,
    index_name: str = DEFAULT_INDEX_NAME,
    source_table_name: str = DEFAULT_SOURCE_TABLE,
    primary_key: str = "chunk_id",
    embedding_source_column: str = "chunk_to_embed",
    embedding_model_endpoint: str = DEFAULT_EMBEDDING_MODEL,
    pipeline_type: str = "TRIGGERED"
) -> Any:
    """Creates or triggers sync on the Delta Sync Index."""
    print(f"\n[2/3] Checking Vector Search Index: '{index_name}'...")

    try:
        index = client.get_index(endpoint_name=endpoint_name, index_name=index_name)
        print(f"Index '{index_name}' already exists.")
        print("Triggering manual sync on existing Delta Sync index...")
        index.sync()
        print("Sync triggered successfully.")
        return index
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg or "resource_does_not_exist" in error_msg or "404" in error_msg:
            print(f"Creating Delta Sync Index '{index_name}' on source table '{source_table_name}'...")
            print(f"  • Primary Key: {primary_key}")
            print(f"  • Embedding Source Column: {embedding_source_column}")
            print(f"  • Embedding Model Endpoint: {embedding_model_endpoint}")
            print(f"  • Pipeline Type: {pipeline_type}")

            index = client.create_delta_sync_index(
                endpoint_name=endpoint_name,
                source_table_name=source_table_name,
                index_name=index_name,
                pipeline_type=pipeline_type,
                primary_key=primary_key,
                embedding_source_column=embedding_source_column,
                embedding_model_endpoint_name=embedding_model_endpoint,
                columns_to_sync=[
                    primary_key,
                    "source_document",
                    "chunk_to_retrieve",
                    "updated_at"
                ]
            )
            print(f"Delta Sync Index '{index_name}' creation initiated successfully.")
            return index
        else:
            raise


def test_similarity_search(
    client: Any,
    endpoint_name: str,
    index_name: str,
    query_text: str = "customs clearance and border transit regulations",
    num_results: int = 3
) -> None:
    """Executes a sample similarity query against the index."""
    print(f"\n[3/3] Testing Similarity Search against '{index_name}'...")
    print(f"Query: \"{query_text}\"")

    try:
        index = client.get_index(endpoint_name=endpoint_name, index_name=index_name)
        results = index.similarity_search(
            query_text=query_text,
            columns=["chunk_id", "source_document", "chunk_to_retrieve"],
            num_results=num_results
        )

        data_array = results.get("result", {}).get("data_array", [])
        if not data_array:
            print("Note: Index returned 0 documents (table may still be initializing or empty).")
            return

        print(f"\nFound {len(data_array)} relevant chunks:")
        for idx, row in enumerate(data_array, start=1):
            chunk_id = row[0]
            source_doc = row[1]
            retrieved_snippet = str(row[2])[:140].replace("\n", " ")
            score = row[-1] if len(row) > 3 else "N/A"
            print(f"  [{idx}] Score: {score} | ID: {chunk_id} | Doc: {source_doc}")
            print(f"      Text: \"{retrieved_snippet}...\"")
    except Exception as e:
        print(f"Similarity search test skipped or failed (index may still be indexing): {e}")


def main():
    parser = argparse.ArgumentParser(description="Link Databricks Delta table to Vector Search endpoint.")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT_NAME, help="Vector Search Endpoint Name")
    parser.add_argument("--index", default=DEFAULT_INDEX_NAME, help="Full Index Name (catalog.schema.index)")
    parser.add_argument("--table", default=DEFAULT_SOURCE_TABLE, help="Source Delta Table Name")
    parser.add_argument("--continuous", action="store_true", help="Use CONTINUOUS pipeline instead of TRIGGERED")
    parser.add_argument("--model", default=DEFAULT_EMBEDDING_MODEL, help="Embedding model endpoint")
    parser.add_argument("--query", default="border clearance and transit rules", help="Test query for verification")
    parser.add_argument("--no-wait", action="store_true", help="Do not block waiting for endpoint ONLINE status")
    args = parser.parse_args()

    print("=================================================================")
    print("Databricks Vector Search / AI Search Delta Sync Connector")
    print(f"Client Engine: {CLIENT_CLASS_NAME or 'Not Installed'}")
    print("=================================================================")

    client = get_vector_client()
    
    ensure_endpoint(
        client=client,
        endpoint_name=args.endpoint,
        endpoint_type="STANDARD",
        wait_online=not args.no_wait
    )

    pipeline_type = "CONTINUOUS" if args.continuous else "TRIGGERED"
    index = ensure_delta_sync_index(
        client=client,
        endpoint_name=args.endpoint,
        index_name=args.index,
        source_table_name=args.table,
        embedding_model_endpoint=args.model,
        pipeline_type=pipeline_type
    )

    if not args.no_wait:
        test_similarity_search(
            client=client,
            endpoint_name=args.endpoint,
            index_name=args.index,
            query_text=args.query
        )

    print("\nVector Search setup completed successfully!")


if __name__ == "__main__":
    main()
