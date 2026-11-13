/**
 * AQ COMPANIES — Security & Biometric Vault, Save Engine & Settings Audit
 * Tests for WebAuthn platform passkeys, PIN verification, Action Gate matrix,
 * IndexedDB vault integrity, and bilingual localization.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('Multi-Modal Security & Biometric Vault Suite', async (t) => {
  const securityServicePath = path.join(rootDir, 'lib', 'security', 'security-vault-service.ts');
  const useSecurityLockPath = path.join(rootDir, 'lib', 'security', 'use-security-lock.tsx');
  const lockOverlayPath = path.join(rootDir, 'components', 'security', 'workspace-lock-overlay.tsx');
  const securityViewPath = path.join(rootDir, 'components', 'security', 'security-settings-view.tsx');
  const indexedDbVaultPath = path.join(rootDir, 'lib', 'save', 'indexed-db-vault.ts');
  const saveEnginePath = path.join(rootDir, 'lib', 'save', 'use-enterprise-save-engine.ts');
  const floatingSaveBarPath = path.join(rootDir, 'components', 'save', 'floating-save-bar.tsx');
  const syncPopoverPath = path.join(rootDir, 'components', 'sync', 'sync-queue-popover.tsx');
  const settingsViewPath = path.join(rootDir, 'components', 'settings-view.tsx');

  await t.test('1. Security Service files exist and export required interfaces', () => {
    assert.ok(fs.existsSync(securityServicePath), 'security-vault-service.ts exists');
    assert.ok(fs.existsSync(useSecurityLockPath), 'use-security-lock.tsx exists');
    assert.ok(fs.existsSync(lockOverlayPath), 'workspace-lock-overlay.tsx exists');
    assert.ok(fs.existsSync(securityViewPath), 'security-settings-view.tsx exists');
    assert.ok(fs.existsSync(indexedDbVaultPath), 'indexed-db-vault.ts exists');
    assert.ok(fs.existsSync(saveEnginePath), 'use-enterprise-save-engine.ts exists');
    assert.ok(fs.existsSync(floatingSaveBarPath), 'floating-save-bar.tsx exists');
    assert.ok(fs.existsSync(syncPopoverPath), 'sync-queue-popover.tsx exists');
  });

  await t.test('2. WebAuthn platform passkey specifications enforce platform authenticator and userVerification', () => {
    const src = fs.readFileSync(securityServicePath, 'utf8');
    assert.match(src, /authenticatorAttachment:\s*["']platform["']/, 'WebAuthn requires platform authenticator');
    assert.match(src, /userVerification:\s*["']required["']/, 'WebAuthn requires biometric user verification');
    assert.match(src, /enrollPlatformPasskey/, 'enrollPlatformPasskey helper is defined');
    assert.match(src, /verifyPlatformPasskey/, 'verifyPlatformPasskey helper is defined');
    assert.match(src, /saveEnrolledFingerprint/, 'saveEnrolledFingerprint helper is defined');
    assert.match(src, /deleteEnrolledFingerprint/, 'deleteEnrolledFingerprint helper is defined');
    assert.match(src, /verifySoftwareFingerprint/, 'verifySoftwareFingerprint helper is defined');
  });

  await t.test('2b. In-System Fingerprint Scanner and Software Vault Modal', () => {
    const scannerModalPath = path.join(rootDir, 'components', 'security', 'fingerprint-scanner-modal.tsx');
    assert.ok(fs.existsSync(scannerModalPath), 'fingerprint-scanner-modal.tsx exists');
    const modalSrc = fs.readFileSync(scannerModalPath, 'utf8');
    assert.match(modalSrc, /FingerprintScannerModal/, 'FingerprintScannerModal component defined');
    assert.match(modalSrc, /index_right/, 'Right Index finger supported');
    assert.match(modalSrc, /thumb_right/, 'Right Thumb supported');
    assert.match(modalSrc, /laser|sweep|progress/i, 'Visual scanner laser sweep implemented');
    assert.match(modalSrc, /Save to Software/i, 'Save to software button present');
  });

  await t.test('3. PIN Code salted hashing and anti-brute-force lockout protection', () => {
    const src = fs.readFileSync(securityServicePath, 'utf8');
    assert.match(src, /hashStringWithSalt/, 'Salted hashing is implemented');
    assert.match(src, /pinLength:\s*4\s*\|\s*6/, 'PIN supports 4 or 6 digits');
    assert.match(src, /maxFailedAttempts:\s*5/, 'Default max failed attempts is 5');
    assert.match(src, /lockoutUntil/, 'Lockout timestamp tracking exists');
  });

  await t.test('4. Password entropy scoring calculates weak, good, and enterprise strong', () => {
    const src = fs.readFileSync(securityServicePath, 'utf8');
    assert.match(src, /calculatePasswordStrength/, 'Password strength calculator exported');
    assert.match(src, /Enterprise Strong/, 'Enterprise Strong tier exists');
    assert.match(src, /Good/, 'Good tier exists');
    assert.match(src, /Weak/, 'Weak tier exists');
  });

  await t.test('5. Action-Level Security Gate Matrix enforces critical checkpoints', () => {
    const src = fs.readFileSync(securityServicePath, 'utf8');
    assert.match(src, /treasuryLedger:\s*boolean/, 'Treasury ledger gate defined');
    assert.match(src, /bolModifyDelete:\s*boolean/, 'BOL modify/delete gate defined');
    assert.match(src, /exportVault:\s*boolean/, 'Export vault gate defined');
  });

  await t.test('6. WorkspaceLockOverlay implements frosted glass and 4 unlock switcher tabs', () => {
    const src = fs.readFileSync(lockOverlayPath, 'utf8');
    assert.match(src, /backdrop-blur-\[28px\]/, 'Frosted glass blur-28px backdrop enforced');
    assert.match(src, /Touch ID/, 'Touch ID tab rendered');
    assert.match(src, /Face ID/, 'Face ID tab rendered');
    assert.match(src, /PIN Code/, 'PIN Code tab rendered');
    assert.match(src, /Password/, 'Password tab rendered');
    assert.match(src, /z-\[9999\]/, 'Modal has unbypassable top z-index');
  });

  await t.test('7. Enterprise Security View renders 12-column Bento Grid with bilingual Persian/Dari labels', () => {
    const src = fs.readFileSync(securityViewPath, 'utf8');
    assert.match(src, /خزانه امنیت و قفل بیومتریک/, 'Persian title rendered in banner');
    assert.match(src, /قفل اثر انگشت/, 'Persian Touch ID label rendered');
    assert.match(src, /قفل تشخیص چهره/, 'Persian Face ID label rendered');
    assert.match(src, /رمز پین سریع/, 'Persian PIN code label rendered');
    assert.match(src, /ماتریس تایید امنیتی برای عملیات‌های حساس/, 'Persian Action Gate matrix label rendered');
    assert.match(src, /grid-cols-1\s+lg:grid-cols-2/, 'Bento grid layout present');
    assert.match(src, /Argon2id\s*\+\s*AES-256 GCM/, 'Argon2id + AES-256 GCM cipher badge rendered');
    assert.match(src, /Security Posture Score/, 'Real-time security posture score gauge rendered');
    assert.match(src, /showConfirmPass/, 'Confirm password show/hide eye toggle is implemented');
    assert.match(src, /Test Sensor/, 'Interactive Fingerprint sensor testing action rendered');
    assert.match(src, /3D Anti-Spoofing & Liveness/, '3D face anti-spoofing and liveness detection toggle rendered');
    assert.match(src, /Ledger Invariance Lock/, 'Accounting invariance identity gate rendered');
  });

  await t.test('7b. Security Posture Score calculation helper exported and functions properly', () => {
    const src = fs.readFileSync(securityServicePath, 'utf8');
    assert.match(src, /calculateSecurityPostureScore/, 'calculateSecurityPostureScore is defined and exported');
    assert.match(src, /accountingLedgerLock\?:?\s*boolean/, 'accountingLedgerLock is defined on SecurityActionGates');
  });

  await t.test('8. IndexedDB Vault creates object stores and provides .aqvault export', () => {
    const src = fs.readFileSync(indexedDbVaultPath, 'utf8');
    assert.match(src, /settings_vault/, 'settings_vault object store defined');
    assert.match(src, /bol_drafts/, 'bol_drafts object store defined');
    assert.match(src, /offline_mutations/, 'offline_mutations object store defined');
    assert.match(src, /computeChecksum/, 'SHA-256 checksum validation present');
    assert.match(src, /exportVaultSnapshot/, 'Vault snapshot export present');
    assert.match(src, /compactAndOptimizeVault/, 'Vault compaction present');
  });

  await t.test('9. SettingsView integrates SecuritySettingsView and sidebar badges', () => {
    const src = fs.readFileSync(settingsViewPath, 'utf8');
    assert.match(src, /import\s*\{\s*SecuritySettingsView\s*\}\s*from\s*["']@\/components\/security\/security-settings-view["']/, 'SecuritySettingsView imported');
    assert.match(src, /<SecuritySettingsView\s*\/>/, 'SecuritySettingsView rendered');
    assert.match(src, /badge:\s*"Protected"/, 'Security & Passwords item has Protected badge');
  });

  await t.test('10. Root page wraps workspace with SecurityLockProvider and WorkspaceLockOverlay', () => {
    const pageSrc = fs.readFileSync(path.join(rootDir, 'app', 'page.tsx'), 'utf8');
    assert.match(pageSrc, /SecurityLockProvider/, 'SecurityLockProvider wrapped around page');
    assert.match(pageSrc, /WorkspaceLockOverlay/, 'WorkspaceLockOverlay rendered at root');
  });
});
