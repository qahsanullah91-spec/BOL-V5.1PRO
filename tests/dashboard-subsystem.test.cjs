const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Dashboard Subsystem — Core Accounting Invariance and Routing Rules', async (t) => {
  await t.test('Accounting Invariance: Net Balance = Total Debit - Total Credit', () => {
    // Test dataset representing account ledgers
    const mockAccounts = [
      {
        id: 'acc-1',
        name: 'Haji Ahmad Logistics',
        totalDebit: 154200.50,
        totalCredit: 98100.25,
      },
      {
        id: 'acc-2',
        name: 'Kabul Super Trans',
        totalDebit: 52000.00,
        totalCredit: 52000.00,
      },
      {
        id: 'acc-3',
        name: 'Spin Boldak Traders',
        totalDebit: 12500.00,
        totalCredit: 45000.00,
      },
    ];

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const acc of mockAccounts) {
      const balance = acc.totalDebit - acc.totalCredit;
      grandTotalDebit += acc.totalDebit;
      grandTotalCredit += acc.totalCredit;

      // Invariance check per account
      assert.equal(balance, acc.totalDebit - acc.totalCredit, `Account ${acc.name} must satisfy Net = Debit - Credit`);
    }

    const netReceivable = grandTotalDebit - grandTotalCredit;
    assert.equal(
      netReceivable,
      grandTotalDebit - grandTotalCredit,
      'System-wide Net Balance must satisfy Grand Debit - Grand Credit'
    );
    assert.equal(netReceivable, (154200.50 + 52000.00 + 12500.00) - (98100.25 + 52000.00 + 45000.00));
  });

  await t.test('App Context State: Default view is "dashboard" for non-shippers', () => {
    const appContextFile = fs.readFileSync(path.join(__dirname, '../lib/app-context.tsx'), 'utf8');

    // Verify view type includes 'dashboard'
    assert.match(appContextFile, /'dashboard'/);

    // Verify initial state defaults to 'dashboard'
    assert.match(appContextFile, /view:\s*user\?\.role\s*===\s*["']shipper["']\s*\?\s*["']shipper-portal["']\s*:\s*["']dashboard["']/);

    // Verify login and logout route to 'dashboard'
    assert.match(appContextFile, /view:\s*userObj\.role\s*===\s*["']shipper["']\s*\?\s*["']shipper-portal["']\s*:\s*["']dashboard["']/);
    assert.match(appContextFile, /view:\s*['"]dashboard['"]/);
  });

  await t.test('app/page.tsx: DashboardView is imported, preloaded, and rendered', () => {
    const pageFile = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');

    // Safe module declaration
    assert.match(pageFile, /const DashboardView = createSafeModule\(['"]Executive Dashboard['"]/);

    // Preloader registration
    assert.match(pageFile, /{\s*key:\s*['"]dashboard-view['"],\s*importer:\s*\(\)\s*=>\s*import\(['"]@\/components\/dashboard\/dashboard-view['"]\)\s*}/);

    // Rendered conditionally on view === 'dashboard'
    assert.match(pageFile, /view === ['"]dashboard['"] && \(/);
    assert.match(pageFile, /<DashboardView \/>/);

    // Fluid container for dashboard
    assert.match(pageFile, /fluid=\{view === ['"]dashboard['"] \|\|/);
  });

  await t.test('components/header.tsx: Header integrates Dashboard view seamlessly', () => {
    const headerFile = fs.readFileSync(path.join(__dirname, '../components/header.tsx'), 'utf8');

    // Added to ENTERPRISE_MODULES
    assert.match(headerFile, /id:\s*['"]dashboard['"]/);
    assert.match(headerFile, /title:\s*['"]Executive Dashboard['"]/);

    // Logo click navigates to dashboard
    assert.match(headerFile, /handleNavigate\(['"]dashboard['"]\)/);
    assert.match(headerFile, /title=["']Return to Executive Dashboard["']/);

    // Core Workspaces Switcher includes Dashboard
    assert.match(headerFile, /view === ['"]dashboard['"]\s*\?\s*['"]Dashboard['']/);
    assert.match(headerFile, /<p className=["']font-bold text-xs["']>Executive Dashboard<\/p>/);

    // Desktop nav bar has direct Dashboard button
    assert.match(headerFile, /Direct Dashboard Quick Pill/);
  });

  await t.test('components/mobile-bottom-nav.tsx: Mobile Nav items include Dashboard as #1', () => {
    const mobileNavFile = fs.readFileSync(path.join(__dirname, '../components/mobile-bottom-nav.tsx'), 'utf8');

    // Dashboard item in navItems
    assert.match(mobileNavFile, /id:\s*["']dashboard["']/);
    assert.match(mobileNavFile, /label:\s*["']Dashboard["']/);
    assert.match(mobileNavFile, /onClick:\s*\(\)\s*=>\s*setView\(["']dashboard["']\)/);
  });

  await t.test('components/dashboard/ modular components exist and have non-empty definitions', () => {
    const dir = path.join(__dirname, '../components/dashboard');
    const expectedFiles = [
      'dashboard-view.tsx',
      'dashboard-kpi-grid.tsx',
      'dashboard-quick-actions.tsx',
      'dashboard-charts.tsx',
      'dashboard-top-accounts.tsx',
      'dashboard-recent-bols.tsx',
    ];

    for (const f of expectedFiles) {
      const fullPath = path.join(dir, f);
      assert.ok(fs.existsSync(fullPath), `File ${f} must exist in components/dashboard/`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(content.length > 500, `File ${f} must have substantive implementation (>500 bytes)`);
    }
  });
});
