---
created: 2026-11-13T12:32:00-08:00
title: Schedule automated daily GCS snapshot backups
area: tooling
severity: minor
files:
  - scripts/gcs-automated-backup.cjs:1
  - tests/gcs-automated-backup.test.cjs:1
  - docs/GOOGLE_CLOUD_DEPLOYMENT.md:75
---

## Problem

Live production databases (`.local-*.json` and counter tokens) can currently be backed up on-demand via `node scripts/gcs-automated-backup.cjs`, but automated recurring execution needs to be configured (either via Windows Task Scheduler `schtasks` or Google Cloud Scheduler). Without an active scheduled job, automated daily offsite snapshots rely on manual operator triggers.

## Solution

1. Create a helper registration script `scripts/register-backup-scheduler.cjs` to set up a scheduled Windows Task (`schtasks /create /tn "SkyArianaGcsBackup" /tr "node scripts/gcs-automated-backup.cjs" /sc daily /st 02:00`).
2. Alternatively, configure Google Cloud Scheduler to trigger a protected webhook on Cloud Run or Cloud Function if hosted in GCP.
3. Add status reporting in the Electron desktop settings/backup tab showing the last scheduled run time and next scheduled run time.
