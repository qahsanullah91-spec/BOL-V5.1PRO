# Databricks notebook source
# COMMAND ----------
# MAGIC %md
# MAGIC # Production AI Functions Medallion Pipeline
# MAGIC **Catalog:** `main` | **Schema:** `ai_operations`
# MAGIC
# MAGIC This pipeline demonstrates all 5 modern Databricks AI Function pillars in a unified architecture:
# MAGIC 1. **Text Enrichment**: `ai_mask`, `ai_analyze_sentiment`, `ai_classify`, `ai_summarize`, `ai_extract` (v2.1 with confidence scoring).
# MAGIC 2. **Document Intelligence**: `ai_parse_document` (v2.0 with OCR & table detection) on binary PDFs/invoices.
# MAGIC 3. **Context-Enriched RAG**: `ai_prep_search` on document trees with Change Data Feed (CDF) for Vector Search.
# MAGIC 4. **Time-Series Forecasting**: `ai_forecast` multi-series daily logistics predictions.
# MAGIC 5. **Foundation Model Serving**: `ai_query` via Unity Catalog (`system.ai.claude-sonnet-4`) with structured JSON schema.

# COMMAND ----------
# DBTITLE 1,Step 0: Catalog, Schema & Volume Provisioning
# MAGIC %sql
# MAGIC CREATE CATALOG IF NOT EXISTS main;
# MAGIC CREATE SCHEMA IF NOT EXISTS main.ai_operations;
# MAGIC USE CATALOG main;
# MAGIC USE SCHEMA ai_operations;
# MAGIC
# MAGIC -- Create Managed Volumes for document landing and regulatory repositories
# MAGIC CREATE VOLUME IF NOT EXISTS main.ai_operations.landing_docs;
# MAGIC CREATE VOLUME IF NOT EXISTS main.ai_operations.regulatory_docs;
# MAGIC
# MAGIC -- Seed dummy bronze tables if they do not exist
# MAGIC CREATE TABLE IF NOT EXISTS main.ai_operations.bronze_feedback (
# MAGIC   id STRING,
# MAGIC   created_at TIMESTAMP,
# MAGIC   feedback_text STRING
# MAGIC );
# MAGIC
# MAGIC CREATE TABLE IF NOT EXISTS main.ai_operations.historical_shipments (
# MAGIC   transit_date STRING,
# MAGIC   border_corridor STRING,
# MAGIC   net_weight_kg DOUBLE,
# MAGIC   freight_amount_usd DOUBLE
# MAGIC );
# MAGIC
# MAGIC CREATE TABLE IF NOT EXISTS main.ai_operations.pending_manifests (
# MAGIC   shipment_id STRING,
# MAGIC   manifest_payload STRING
# MAGIC );

# COMMAND ----------
# DBTITLE 1,Stage 1: Text Classification, Sentiment & Schema Extraction
# MAGIC %sql
# MAGIC -- Enriches unstructured customer & operations feedback in a single pass with PII redaction
# MAGIC CREATE OR REPLACE TABLE main.ai_operations.silver_enriched_feedback AS
# MAGIC WITH raw_source AS (
# MAGIC   SELECT 
# MAGIC     id,
# MAGIC     created_at,
# MAGIC     -- Redact sensitive information (PII) before LLM analysis
# MAGIC     ai_mask(feedback_text, array('email', 'phone', 'person', 'ssn')) AS clean_text
# MAGIC   FROM main.ai_operations.bronze_feedback
# MAGIC   WHERE feedback_text IS NOT NULL AND trim(feedback_text) != ''
# MAGIC ),
# MAGIC enriched_intermediate AS (
# MAGIC   SELECT
# MAGIC     id,
# MAGIC     created_at,
# MAGIC     clean_text,
# MAGIC     
# MAGIC     -- 1. Sentiment Scoring
# MAGIC     ai_analyze_sentiment(clean_text) AS sentiment,
# MAGIC     
# MAGIC     -- 2. Urgency Classification with Contextual Rules
# MAGIC     ai_classify(
# MAGIC       clean_text,
# MAGIC       '{"P1_CRITICAL": "System outages, safety hazards, lost shipments",
# MAGIC         "P2_HIGH": "Billing discrepancies, major route delays",
# MAGIC         "P3_MEDIUM": "Minor app bugs, UI feedback",
# MAGIC         "P4_LOW": "General compliments, general questions"}',
# MAGIC       map('version', '2.0', 'instructions', 'Logistics and supply chain dispatch')
# MAGIC     ) AS urgency_result,
# MAGIC     
# MAGIC     -- 3. Topic Category
# MAGIC     ai_classify(
# MAGIC       clean_text,
# MAGIC       '["Border Customs", "Driver Rent & Payment", "Container Temperature", "Documentation", "Transit Delay"]',
# MAGIC       map('version', '2.0')
# MAGIC     ) AS category_result,
# MAGIC     
# MAGIC     -- 4. Concise Executive Summary
# MAGIC     ai_summarize(clean_text, 25) AS summary,
# MAGIC     
# MAGIC     -- 5. Typed Schema Extraction with Confidence Scoring (v2.1)
# MAGIC     ai_extract(
# MAGIC       clean_text,
# MAGIC       '{
# MAGIC         "bol_number": {"type": "string"},
# MAGIC         "driver_name": {"type": "string"},
# MAGIC         "border_station": {"type": "string"},
# MAGIC         "claimed_amount": {"type": "number"}
# MAGIC       }',
# MAGIC       map('version', '2.1', 'enableConfidenceScores', 'true')
# MAGIC     ) AS extraction_result
# MAGIC   FROM raw_source
# MAGIC )
# MAGIC SELECT
# MAGIC   id,
# MAGIC   created_at,
# MAGIC   clean_text,
# MAGIC   sentiment,
# MAGIC   urgency_result:response[0]::STRING AS priority_level,
# MAGIC   category_result:response[0]::STRING AS category,
# MAGIC   summary,
# MAGIC   extraction_result:response:bol_number:value::STRING AS extracted_bol_number,
# MAGIC   extraction_result:response:driver_name:value::STRING AS extracted_driver,
# MAGIC   extraction_result:response:border_station:value::STRING AS extracted_station,
# MAGIC   extraction_result:response:claimed_amount:value::DOUBLE AS extracted_amount,
# MAGIC   extraction_result:response:bol_number:confidence_score::DOUBLE AS bol_extraction_confidence,
# MAGIC   extraction_result:error_message::STRING AS extraction_error
# MAGIC FROM enriched_intermediate;

# COMMAND ----------
# DBTITLE 1,Stage 2: PDF & Document Processing (Invoices, Receipts, Contracts)
# MAGIC %sql
# MAGIC -- Ingests binary files from Unity Catalog Volume, parses layout with OCR, and extracts invoice line items
# MAGIC CREATE OR REPLACE TABLE main.ai_operations.silver_parsed_invoices AS
# MAGIC WITH raw_binaries AS (
# MAGIC   SELECT 
# MAGIC     path,
# MAGIC     -- Parse PDF / Word / TIFF documents with automatic OCR and table detection
# MAGIC     ai_parse_document(content, map('version', '2.0', 'descriptionElementTypes', 'table,figure')) AS parsed
# MAGIC   FROM read_files('/Volumes/main/ai_operations/landing_docs/', format => 'binaryFile')
# MAGIC ),
# MAGIC text_assembled AS (
# MAGIC   SELECT
# MAGIC     path,
# MAGIC     parsed,
# MAGIC     concat_ws('\n', transform(parsed:document:elements, e -> e:content::STRING)) AS raw_text,
# MAGIC     parsed:error_status AS parse_error
# MAGIC   FROM raw_binaries
# MAGIC   WHERE parsed:error_status IS NULL
# MAGIC ),
# MAGIC classified AS (
# MAGIC   SELECT
# MAGIC     path,
# MAGIC     raw_text,
# MAGIC     ai_classify(raw_text, '["INVOICE", "RECEIPT", "BILL_OF_LADING", "CUSTOMS_DECLARATION", "OTHER"]'):response[0]::STRING AS doc_type
# MAGIC   FROM text_assembled
# MAGIC )
# MAGIC SELECT
# MAGIC   path,
# MAGIC   doc_type,
# MAGIC   extracted:response:invoice_number::STRING AS invoice_number,
# MAGIC   extracted:response:vendor_name::STRING AS vendor_name,
# MAGIC   extracted:response:total_amount::DOUBLE AS total_amount,
# MAGIC   extracted:response:currency::STRING AS currency,
# MAGIC   from_json(
# MAGIC     extracted:response:line_items::STRING,
# MAGIC     'ARRAY<STRUCT<item_desc: STRING, qty: DOUBLE, unit_price: DOUBLE, total: DOUBLE>>'
# MAGIC   ) AS line_items,
# MAGIC   extracted:error_message::STRING AS error_log
# MAGIC FROM (
# MAGIC   SELECT
# MAGIC     path,
# MAGIC     doc_type,
# MAGIC     ai_extract(
# MAGIC       raw_text,
# MAGIC       '{
# MAGIC         "invoice_number": {"type": "string"},
# MAGIC         "vendor_name": {"type": "string"},
# MAGIC         "total_amount": {"type": "number"},
# MAGIC         "currency": {"type": "enum", "labels": ["USD", "EUR", "AFN", "AED"]},
# MAGIC         "line_items": {
# MAGIC           "type": "array",
# MAGIC           "items": {
# MAGIC             "type": "object",
# MAGIC             "properties": {
# MAGIC               "item_desc": {"type": "string"},
# MAGIC               "qty": {"type": "number"},
# MAGIC               "unit_price": {"type": "number"},
# MAGIC               "total": {"type": "number"}
# MAGIC             }
# MAGIC           }
# MAGIC         }
# MAGIC       }',
# MAGIC       map('version', '2.1')
# MAGIC     ) AS extracted
# MAGIC   FROM classified
# MAGIC   WHERE doc_type = 'INVOICE'
# MAGIC );

# COMMAND ----------
# DBTITLE 1,Stage 3: Context-Enriched RAG & Vector Search Index Table
# MAGIC %sql
# MAGIC -- Table definition with Change Data Feed enabled for automated Vector Search synchronization
# MAGIC CREATE OR REPLACE TABLE main.ai_operations.gold_rag_chunks (
# MAGIC   chunk_id STRING NOT NULL,
# MAGIC   source_document STRING,
# MAGIC   chunk_to_embed STRING,
# MAGIC   chunk_to_retrieve STRING,
# MAGIC   updated_at TIMESTAMP
# MAGIC ) USING DELTA
# MAGIC TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');
# MAGIC
# MAGIC ALTER TABLE main.ai_operations.gold_rag_chunks ADD CONSTRAINT pk_rag_chunk PRIMARY KEY (chunk_id);
# MAGIC
# MAGIC -- Uses ai_prep_search for semantic boundary chunking and header/title context enrichment
# MAGIC WITH prepped_docs AS (
# MAGIC   SELECT
# MAGIC     path AS source_document,
# MAGIC     ai_prep_search(ai_parse_document(content)) AS prep_output
# MAGIC   FROM read_files('/Volumes/main/ai_operations/regulatory_docs/', format => 'binaryFile')
# MAGIC )
# MAGIC INSERT INTO main.ai_operations.gold_rag_chunks
# MAGIC SELECT
# MAGIC   variant_get(c, '$.chunk_id', 'STRING') AS chunk_id,
# MAGIC   source_document,
# MAGIC   variant_get(c, '$.chunk_to_embed', 'STRING') AS chunk_to_embed,       -- Embed this (includes title/page hierarchy)
# MAGIC   variant_get(c, '$.chunk_to_retrieve', 'STRING') AS chunk_to_retrieve, -- Retrieve this (clean raw text for the LLM prompt)
# MAGIC   current_timestamp() AS updated_at
# MAGIC FROM prepped_docs
# MAGIC LATERAL VIEW explode(variant_get(prep_output, '$.document.contents', 'ARRAY<VARIANT>')) doc_items AS c;

# COMMAND ----------
# DBTITLE 1,Stage 4: Time-Series Forecasting Model
# MAGIC %sql
# MAGIC -- Generates multi-series daily shipment & freight volume forecasts with 95% confidence intervals
# MAGIC CREATE OR REPLACE TABLE main.ai_operations.gold_logistics_forecast AS
# MAGIC SELECT *
# MAGIC FROM ai_forecast(
# MAGIC   observed => TABLE(
# MAGIC     SELECT 
# MAGIC       CAST(transit_date AS DATE) AS ds,
# MAGIC       border_corridor,
# MAGIC       SUM(net_weight_kg) AS total_weight_kg,
# MAGIC       SUM(freight_amount_usd) AS total_revenue_usd
# MAGIC     FROM main.ai_operations.historical_shipments
# MAGIC     WHERE transit_date >= '2023-01-01'
# MAGIC     GROUP BY 1, 2
# MAGIC   ),
# MAGIC   horizon                   => '2026-12-31',
# MAGIC   time_col                  => 'ds',
# MAGIC   value_col                 => 'total_weight_kg,total_revenue_usd',
# MAGIC   group_col                 => 'border_corridor',
# MAGIC   prediction_interval_width => 0.95,
# MAGIC   frequency                 => 'D',
# MAGIC   parameters                => '{
# MAGIC     "global_floor": 0,
# MAGIC     "weekly_order": 3,
# MAGIC     "daily_order": 0
# MAGIC   }'
# MAGIC );

# COMMAND ----------
# DBTITLE 1,Stage 5: Custom Foundation Model Inferences with Unity Catalog
# MAGIC %sql
# MAGIC -- Uses ai_query with system.ai models, schema-enforced JSON, and error isolation
# MAGIC SELECT
# MAGIC   shipment_id,
# MAGIC   CASE 
# MAGIC     WHEN ai_res.errorMessage IS NULL THEN from_json(
# MAGIC       ai_res.response,
# MAGIC       'STRUCT<
# MAGIC         customs_risk_score: INT,
# MAGIC         clearance_flags: ARRAY<STRING>,
# MAGIC         recommended_action: STRING
# MAGIC       >'
# MAGIC     )
# MAGIC     ELSE NULL
# MAGIC   END AS compliance_assessment,
# MAGIC   ai_res.errorMessage AS execution_error
# MAGIC FROM (
# MAGIC   SELECT 
# MAGIC     shipment_id,
# MAGIC     ai_query(
# MAGIC       'system.ai.claude-sonnet-4',
# MAGIC       CONCAT(
# MAGIC         'Analyze international border manifest compliance. Output JSON only: ',
# MAGIC         '{"customs_risk_score": 1-100, "clearance_flags": [str], "recommended_action": str}. Manifest details:\n',
# MAGIC         manifest_payload
# MAGIC       ),
# MAGIC       responseFormat => '{"type": "json_object"}',
# MAGIC       failOnError    => false,
# MAGIC       modelParameters => named_struct('temperature', CAST(0.0 AS DOUBLE), 'max_tokens', 800)
# MAGIC     ) AS ai_res
# MAGIC   FROM main.ai_operations.pending_manifests
# MAGIC );
