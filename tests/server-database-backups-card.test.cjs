const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

test('Server Database Backups & Migration Card Redesign', async (t) => {
  const cardPath = path.join(__dirname, '../components/server/server-mode-card.tsx');
  const cardCode = fs.readFileSync(cardPath, 'utf8');

  const routePath = path.join(__dirname, '../app/api/server/backups/route.ts');
  const routeCode = fs.readFileSync(routePath, 'utf8');

  await t.test('1. Card header features modern sans typography, icon container, and bilingual subtitle', () => {
    assert.ok(
      cardCode.includes('Server Database Backups & Migration'),
      'Card must contain Server Database Backups & Migration title'
    );
    assert.ok(
      cardCode.includes('font-sans') && cardCode.includes('font-black text-slate-900'),
      'Card title must enforce bold sans typography'
    );
    assert.ok(
      cardCode.includes('نسخه‌های پشتیبان سرور، بازیابی و مهاجرت اطلاعات محلی'),
      'Card must contain Dari/Pashto bilingual label'
    );
  });

  await t.test('2. Storage vault path pill provides copyable path and Open Folder shortcut', () => {
    assert.ok(
      cardCode.includes('Storage Vault Path'),
      'Must contain dedicated Storage Vault Path badge'
    );
    assert.ok(
      cardCode.includes('Copy Path'),
      'Must contain Copy Path button'
    );
    assert.ok(
      cardCode.includes('Open Folder'),
      'Must contain Open Folder button'
    );
    assert.ok(
      cardCode.includes('handleOpenFolder'),
      'Must implement handleOpenFolder action for native desktop integration'
    );
  });

  await t.test('3. Card actions include Refresh, Migrate, and Backup Now with loading states', () => {
    assert.ok(
      cardCode.includes('handleRefreshBackups') && cardCode.includes('isRefreshingBackups'),
      'Must provide live refresh action with spinning indicator'
    );
    assert.ok(
      cardCode.includes('isCreatingBackup') && cardCode.includes('Backing up...'),
      'Backup Now must render dynamic loading state when creating archive'
    );
    assert.ok(
      cardCode.includes('isMigrating') && cardCode.includes('Migrating...'),
      'Migrate button must render dynamic loading state'
    );
  });

  await t.test('4. Executive empty state provides guidance, icon, and 1-click CTA', () => {
    assert.ok(
      cardCode.includes('No Server Backups Created Yet'),
      'Empty state must feature prominent headline'
    );
    assert.ok(
      cardCode.includes('Create First Backup'),
      'Empty state must feature direct Create First Backup CTA button'
    );
    assert.ok(
      cardCode.includes('هنوز هیچ نسخه پشتیبانی از پایگاه داده مرکزی در این پوشه ذخیره نشده است'),
      'Empty state must include bilingual explanation'
    );
  });

  await t.test('5. Backups list renders archive badges, size formatting, restore, and download actions', () => {
    assert.ok(
      cardCode.includes('formatSize'),
      'Must implement formatSize helper for readable KB / MB displays'
    );
    assert.ok(
      cardCode.includes('handleDownloadBackup'),
      'Must implement direct file download helper'
    );
    assert.ok(
      cardCode.includes('handleRevealBackup'),
      'Must support revealing archive file in Windows Explorer'
    );
    assert.ok(
      cardCode.includes('handleDeleteBackup'),
      'Must support deleting specific backup archives'
    );
    assert.ok(
      cardCode.includes('RotateCcw'),
      'Restore button must use RotateCcw icon'
    );
  });

  await t.test('6. /api/server/backups route returns backupDir and supports download and delete', () => {
    assert.ok(
      routeCode.includes('backupDir: paths.backups'),
      'API route must include backupDir in GET payload'
    );
    assert.ok(
      routeCode.includes('downloadParam') && routeCode.includes('Content-Disposition'),
      'API route must support direct file download via stream response'
    );
    assert.ok(
      routeCode.includes('targetFile') && routeCode.includes('fs.unlink(targetPath)'),
      'API route DELETE handler must support deleting individual backup by filename'
    );
  });
});
