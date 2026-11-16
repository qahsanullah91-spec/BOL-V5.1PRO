-- ============================================================================
-- Databricks Lakeflow / Spark Declarative Pipeline (SDP / DLT)
-- Continuous AI Functions Streaming Pipeline for Logistics & Supply Chain
-- Target Catalog: main | Target Schema: ai_operations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BRONZE LAYER: Incremental Streaming Ingestion
-- ----------------------------------------------------------------------------

-- Streaming table for continuously arriving customer & driver feedback
CREATE OR REFRESH STREAMING TABLE bronze_feedback_stream (
  CONSTRAINT valid_feedback_id EXPECT (id IS NOT NULL) ON VIOLATION DROP ROW
)
COMMENT "Raw streaming customer, border station, and driver feedback messages"
AS SELECT 
  id,
  current_timestamp() AS ingested_at,
  feedback_text
FROM STREAM(main.ai_operations.bronze_feedback);


-- ----------------------------------------------------------------------------
-- 2. SILVER LAYER: Continuous AI Enrichment with Real-Time Inference
-- ----------------------------------------------------------------------------

-- Continuous AI enrichment: Redaction, Sentiment, Urgency, Categorization, & Schema Extraction
CREATE OR REFRESH STREAMING TABLE silver_enriched_feedback (
  CONSTRAINT valid_sentiment EXPECT (sentiment IS NOT NULL) ON VIOLATION WARN,
  CONSTRAINT valid_clean_text EXPECT (clean_text IS NOT NULL AND length(clean_text) > 0) ON VIOLATION DROP ROW
)
COMMENT "Silver streaming table enriched with ai_mask, ai_analyze_sentiment, ai_classify, and ai_extract v2.1"
AS SELECT
  id,
  ingested_at,
  clean_text,
  sentiment,
  urgency_result:response[0]::STRING AS priority_level,
  category_result:response[0]::STRING AS category,
  summary,
  extraction_result:response:bol_number:value::STRING AS extracted_bol_number,
  extraction_result:response:driver_name:value::STRING AS extracted_driver,
  extraction_result:response:border_station:value::STRING AS extracted_station,
  extraction_result:response:claimed_amount:value::DOUBLE AS extracted_amount,
  extraction_result:response:bol_number:confidence_score::DOUBLE AS bol_extraction_confidence,
  extraction_result:error_message::STRING AS extraction_error
FROM (
  SELECT
    id,
    ingested_at,
    clean_text,
    ai_analyze_sentiment(clean_text) AS sentiment,
    ai_classify(
      clean_text,
      '{"P1_CRITICAL": "System outages, safety hazards, lost shipments",
        "P2_HIGH": "Billing discrepancies, major route delays",
        "P3_MEDIUM": "Minor app bugs, UI feedback",
        "P4_LOW": "General compliments, general questions"}',
      map('version', '2.0', 'instructions', 'Logistics and supply chain dispatch operations')
    ) AS urgency_result,
    ai_classify(
      clean_text,
      '["Border Customs", "Driver Rent & Payment", "Container Temperature", "Documentation", "Transit Delay"]',
      map('version', '2.0')
    ) AS category_result,
    ai_summarize(clean_text, 25) AS summary,
    ai_extract(
      clean_text,
      '{
        "bol_number": {"type": "string"},
        "driver_name": {"type": "string"},
        "border_station": {"type": "string"},
        "claimed_amount": {"type": "number"}
      }',
      map('version', '2.1', 'enableConfidenceScores', 'true')
    ) AS extraction_result
  FROM (
    SELECT 
      id,
      ingested_at,
      ai_mask(feedback_text, array('email', 'phone', 'person', 'ssn')) AS clean_text
    FROM STREAM(LIVE.bronze_feedback_stream)
    WHERE feedback_text IS NOT NULL AND trim(feedback_text) != ''
  )
);


-- Continuous Document & Invoice Processing with Auto Loader on Unity Catalog Volume
CREATE OR REFRESH STREAMING TABLE silver_parsed_invoices (
  CONSTRAINT valid_invoice_number EXPECT (invoice_number IS NOT NULL) ON VIOLATION WARN,
  CONSTRAINT positive_total EXPECT (total_amount IS NULL OR total_amount >= 0) ON VIOLATION WARN
)
COMMENT "Streaming document intelligence parsing binary PDFs/receipts via ai_parse_document and ai_extract"
AS SELECT
  path,
  doc_type,
  extracted:response:invoice_number::STRING AS invoice_number,
  extracted:response:vendor_name::STRING AS vendor_name,
  extracted:response:total_amount::DOUBLE AS total_amount,
  extracted:response:currency::STRING AS currency,
  from_json(
    extracted:response:line_items::STRING,
    'ARRAY<STRUCT<item_desc: STRING, qty: DOUBLE, unit_price: DOUBLE, total: DOUBLE>>'
  ) AS line_items,
  extracted:error_message::STRING AS error_log,
  current_timestamp() AS processed_at
FROM (
  SELECT
    path,
    doc_type,
    ai_extract(
      raw_text,
      '{
        "invoice_number": {"type": "string"},
        "vendor_name": {"type": "string"},
        "total_amount": {"type": "number"},
        "currency": {"type": "enum", "labels": ["USD", "EUR", "AFN", "AED"]},
        "line_items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "item_desc": {"type": "string"},
              "qty": {"type": "number"},
              "unit_price": {"type": "number"},
              "total": {"type": "number"}
            }
          }
        }
      }',
      map('version', '2.1')
    ) AS extracted
  FROM (
    SELECT
      path,
      raw_text,
      ai_classify(raw_text, '["INVOICE", "RECEIPT", "BILL_OF_LADING", "CUSTOMS_DECLARATION", "OTHER"]'):response[0]::STRING AS doc_type
    FROM (
      SELECT
        path,
        parsed,
        concat_ws('\n', transform(parsed:document:elements, e -> e:content::STRING)) AS raw_text
      FROM (
        SELECT 
          path,
          ai_parse_document(content, map('version', '2.0', 'descriptionElementTypes', 'table,figure')) AS parsed
        FROM STREAM read_files(
          '/Volumes/main/ai_operations/landing_docs/',
          format => 'binaryFile'
        )
      )
      WHERE parsed:error_status IS NULL
    )
  )
  WHERE doc_type = 'INVOICE'
);


-- ----------------------------------------------------------------------------
-- 3. GOLD LAYER: RAG Semantic Chunking & Vector Search Delta Sync
-- ----------------------------------------------------------------------------

-- Streaming Table with Change Data Feed enabled for automated Vector Search sync
CREATE OR REFRESH STREAMING TABLE gold_rag_chunks (
  CONSTRAINT valid_chunk_id EXPECT (chunk_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT valid_embed_text EXPECT (chunk_to_embed IS NOT NULL) ON VIOLATION DROP ROW
)
TBLPROPERTIES (
  'delta.enableChangeDataFeed' = 'true'
)
CLUSTER BY (chunk_id)
COMMENT "Auto-chunked regulatory and compliance documents with CDF for Vector Search Delta Sync"
AS SELECT
  variant_get(c, '$.chunk_id', 'STRING') AS chunk_id,
  source_document,
  variant_get(c, '$.chunk_to_embed', 'STRING') AS chunk_to_embed,
  variant_get(c, '$.chunk_to_retrieve', 'STRING') AS chunk_to_retrieve,
  current_timestamp() AS updated_at
FROM (
  SELECT
    path AS source_document,
    ai_prep_search(ai_parse_document(content)) AS prep_output
  FROM STREAM read_files(
    '/Volumes/main/ai_operations/regulatory_docs/',
    format => 'binaryFile'
  )
)
LATERAL VIEW explode(variant_get(prep_output, '$.document.contents', 'ARRAY<VARIANT>')) doc_items AS c;


-- ----------------------------------------------------------------------------
-- 4. GOLD LAYER MATERIALIZED VIEWS: Analytics & Foundation Model Inferences
-- ----------------------------------------------------------------------------

-- Materialized View for daily operations priority breakdown
CREATE OR REFRESH MATERIALIZED VIEW gold_operations_priority_summary
COMMENT "Daily aggregated operations priority metrics derived from AI sentiment and urgency"
AS SELECT
  CAST(ingested_at AS DATE) AS report_date,
  priority_level,
  category,
  sentiment,
  COUNT(*) AS total_tickets,
  AVG(extracted_amount) AS avg_claimed_amount
FROM LIVE.silver_enriched_feedback
GROUP BY 1, 2, 3, 4;


-- Materialized View for Foundation Model Compliance Inferences via ai_query
CREATE OR REFRESH MATERIALIZED VIEW gold_border_compliance_audit
COMMENT "Real-time border compliance assessments scored by system.ai.claude-sonnet-4"
AS SELECT
  shipment_id,
  CASE 
    WHEN ai_res.errorMessage IS NULL THEN from_json(
      ai_res.response,
      'STRUCT<
        customs_risk_score: INT,
        clearance_flags: ARRAY<STRING>,
        recommended_action: STRING
      >'
    )
    ELSE NULL
  END AS compliance_assessment,
  ai_res.errorMessage AS execution_error,
  current_timestamp() AS scored_at
FROM (
  SELECT 
    shipment_id,
    ai_query(
      'system.ai.claude-sonnet-4',
      CONCAT(
        'Analyze international border manifest compliance. Output JSON only: ',
        '{"customs_risk_score": 1-100, "clearance_flags": [str], "recommended_action": str}. Manifest details:\n',
        manifest_payload
      ),
      responseFormat => '{"type": "json_object"}',
      failOnError    => false,
      modelParameters => named_struct('temperature', CAST(0.0 AS DOUBLE), 'max_tokens', 800)
    ) AS ai_res
  FROM main.ai_operations.pending_manifests
);
