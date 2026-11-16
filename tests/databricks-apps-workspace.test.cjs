const { test, describe } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

describe('Databricks Apps Integration & AppKit Workspace', () => {
  const rootDir = path.resolve(__dirname, '..')

  test('Databricks backend main.py implements all 5 core capabilities with dual-mode simulation', () => {
    const mainPyPath = path.join(rootDir, 'services', 'databricks-backend', 'main.py')
    assert.ok(fs.existsSync(mainPyPath), 'services/databricks-backend/main.py must exist')
    const content = fs.readFileSync(mainPyPath, 'utf-8')

    // 1. Identity & Auth
    assert.match(content, /\/api\/me/, 'Must implement /api/me identity endpoint')
    assert.match(content, /get_user_token/, 'Must implement get_user_token dependency')

    // 2. SQL Warehouse
    assert.match(content, /\/api\/sql\/app/, 'Must implement /api/sql/app endpoint')
    assert.match(content, /\/api\/sql\/user/, 'Must implement /api/sql/user endpoint')

    // 3. Lakebase Auditing
    assert.match(content, /\/api\/lakebase\/audit-log/, 'Must implement Lakebase audit endpoint')

    // 4. Volumes
    assert.match(content, /\/api\/volumes\/upload/, 'Must implement UC Volumes upload endpoint')
    assert.match(content, /\/api\/volumes\/download/, 'Must implement UC Volumes download endpoint')

    // 5. AI Foundation Models & Search
    assert.match(content, /\/api\/ai\/chat/, 'Must implement Mosaic AI chat endpoint')
    assert.match(content, /\/api\/ai\/search/, 'Must implement Vector Search endpoint')

    // Dual-Mode Simulation
    assert.match(content, /SIMULATION_MODE/, 'Must support SIMULATION_MODE fallback')
  })

  test('Local runner run_local.py exists and configures dynamic port selection', () => {
    const runnerPath = path.join(rootDir, 'services', 'databricks-backend', 'run_local.py')
    assert.ok(fs.existsSync(runnerPath), 'services/databricks-backend/run_local.py must exist')
    const content = fs.readFileSync(runnerPath, 'utf-8')
    assert.match(content, /uvicorn\.run/, 'Must invoke uvicorn runner')
    assert.match(content, /find_available_port/, 'Must detect available ports gracefully')
  })

  test('Next.js API proxy route handler app/api/databricks/[...slug]/route.ts is defined with GET and POST', () => {
    const routePath = path.join(rootDir, 'app', 'api', 'databricks', '[...slug]', 'route.ts')
    assert.ok(fs.existsSync(routePath), 'API route handler must exist')
    const content = fs.readFileSync(routePath, 'utf-8')

    assert.match(content, /export async function GET/, 'Must export GET handler')
    assert.match(content, /export async function POST/, 'Must export POST handler')
    assert.match(content, /DATABRICKS_BACKEND_URL/, 'Must configure backend URL')
    assert.match(content, /FALLBACK_BOLS/, 'Must support graceful offline fallback')
  })

  test('AppKit Workspace component provides Metric Views, Genie AI, SQL Explorer, Volumes and Lakebase tabs', () => {
    const componentPath = path.join(rootDir, 'components', 'databricks', 'databricks-appkit-workspace.tsx')
    assert.ok(fs.existsSync(componentPath), 'databricks-appkit-workspace.tsx must exist')
    const content = fs.readFileSync(componentPath, 'utf-8')

    // Tab navigation
    assert.match(content, /Metric Views/, 'Must include Governed Metric Views')
    assert.match(content, /Genie AI Copilot/, 'Must include Genie AI Copilot')
    assert.match(content, /SQL Explorer/, 'Must include Serverless SQL Explorer')
    assert.match(content, /UC Volumes/, 'Must include Unity Catalog Volumes')
    assert.match(content, /Lakebase Audit/, 'Must include Lakebase Audit stream')

    // Accounting invariance adherence
    assert.match(content, /Balance = Debit - Credit|Invariance/i, 'Must check or state accounting invariance identity')

    // Border metadata
    assert.match(content, /Islam Qala/, 'Must track Islam Qala border')
    assert.match(content, /Torghundi/, 'Must track Torghundi border')
    assert.match(content, /Hairatan/, 'Must track Hairatan border')
  })

  test('App routing and navigation includes databricks module', () => {
    const pagePath = path.join(rootDir, 'app', 'page.tsx')
    const pageContent = fs.readFileSync(pagePath, 'utf-8')
    assert.match(pageContent, /DatabricksAppKitWorkspace/, 'app/page.tsx must import DatabricksAppKitWorkspace')
    assert.match(pageContent, /view === 'databricks'/, 'app/page.tsx must render databricks view')

    const headerPath = path.join(rootDir, 'components', 'header.tsx')
    const headerContent = fs.readFileSync(headerPath, 'utf-8')
    assert.match(headerContent, /id:\s*'databricks'/, 'header.tsx must list databricks module')

    const appContextPath = path.join(rootDir, 'lib', 'app-context.tsx')
    const appContextContent = fs.readFileSync(appContextPath, 'utf-8')
    assert.match(appContextContent, /'databricks'/, 'app-context.tsx must include databricks in view union')
  })
})
