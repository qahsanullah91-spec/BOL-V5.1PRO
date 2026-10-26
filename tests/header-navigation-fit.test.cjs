const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Header Navigation Fit, Icons & Responsive Layout ---');

const headerPath = path.join(__dirname, '../components/header.tsx');
const headerCode = fs.readFileSync(headerPath, 'utf8');

const statusPillPath = path.join(__dirname, '../components/server/server-status-pill.tsx');
const statusPillCode = fs.readFileSync(statusPillPath, 'utf8');

// 1. Dashboard quick pill is calibrated to prevent overflow on 1536px (laptop) viewports
assert.ok(
  headerCode.includes('hidden min-[1680px]:flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg text-[11.5px] font-bold'),
  'Dashboard direct quick pill must be hidden on screens < 1680px to prevent horizontal menu overflow'
);

// 2. Operations button uses isOpsSuiteActive for active styling
assert.ok(
  headerCode.includes('isOpsSuiteActive\n                        ? \'bg-blue-600 text-white shadow-xs shadow-blue-500/30\'') ||
  headerCode.includes('isOpsSuiteActive\r\n                        ? \'bg-blue-600 text-white shadow-xs shadow-blue-500/30\''),
  'Operations suite button must use isOpsSuiteActive for background styling'
);

// 3. Suite buttons dynamically render the active module icon
assert.ok(
  headerCode.includes('const OpsIcon = (isOpsSuiteActive && currentModule?.category === \'ops\' && currentModule.icon)') &&
  headerCode.includes('const FinanceIcon = (isFinanceActive && currentModule?.category === \'finance\' && currentModule.icon)') &&
  headerCode.includes('const CrmIcon = (isCommercialActive && currentModule?.category === \'commercial\' && currentModule.icon)') &&
  headerCode.includes('const SystemIcon = (isSystemActive && currentModule?.category === \'system\' && currentModule.icon)'),
  'All 4 enterprise suite buttons must dynamically render the active module icon'
);

// 4. HeaderProtectionPill container is calibrated to min-[1680px]:block
assert.ok(
  headerCode.includes('hidden min-[1680px]:block shrink-0') &&
  headerCode.includes('<HeaderProtectionPill onOpenBackupCenter='),
  'HeaderProtectionPill container must be hidden on screens < 1680px to prevent squeezing the navigation menu'
);

// 5. ServerStatusPill displays text on 1500px+ screens (including 1536px 2xl laptops)
assert.ok(
  statusPillCode.includes('hidden min-[1500px]:inline">LOCAL</span>') &&
  statusPillCode.includes('hidden min-[1500px]:inline">\n          SERVER') ||
  statusPillCode.includes('hidden min-[1500px]:inline">\r\n          SERVER'),
  'ServerStatusPill must show text labels on screens >= 1500px so it does not render as an empty mystery icon'
);

console.log('✓ All Header Navigation Fit, Icons & Responsive Layout checks passed successfully!');
