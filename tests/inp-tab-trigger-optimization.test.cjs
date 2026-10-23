const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('INP Optimization Suite — Preview Tab Trigger & Layout Calibration', async (t) => {
  const bolEditorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
  const previewScalePath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'use-a4-preview-scale.ts');

  const bolEditorCode = fs.readFileSync(bolEditorPath, 'utf-8');
  const previewScaleCode = fs.readFileSync(previewScalePath, 'utf-8');

  await t.test('1. yieldToPaint utility is present and leverages scheduler.yield or rAF', () => {
    assert.match(
      bolEditorCode,
      /function\s+yieldToPaint\(\):\s*Promise<void>/,
      'yieldToPaint must be defined as a Promise<void> utility'
    );
    assert.match(
      bolEditorCode,
      /scheduler\.yield/,
      'yieldToPaint must leverage modern scheduler.yield() when available'
    );
    assert.match(
      bolEditorCode,
      /requestAnimationFrame/,
      'yieldToPaint must fallback to requestAnimationFrame before paint'
    );
  });

  await t.test('2. handleTabChange yields to the browser paint pipeline before startTransition', () => {
    assert.match(
      bolEditorCode,
      /yieldToPaint\(\)\.then\(\(\)\s*=>\s*\{[\s\S]*startTransition\(\(\)\s*=>\s*\{[\s\S]*setActiveTab\(newTab\)/,
      'handleTabChange must await yieldToPaint() before dispatching startTransition'
    );
  });

  await t.test('3. TabsTrigger buttons provide instant visual feedback on pointer down', () => {
    assert.match(
      bolEditorCode,
      /data-tab="preview"[\s\S]*data-state=\{\(pendingTab\s*\|\|\s*activeTab\)\s*===\s*"preview"\s*\?\s*"active"\s*:\s*"inactive"\}/,
      'Preview TabsTrigger must reflect pendingTab immediately for instant CSS styling'
    );
    assert.match(
      bolEditorCode,
      /onPointerDown=\{\(e\)\s*=>\s*\{[\s\S]*setPendingTab\("preview"\)/,
      'Preview TabsTrigger must set pendingTab on pointer down'
    );
  });

  await t.test('4. useA4PreviewScale does NOT force synchronous layout flushes when diagnostics are disabled', () => {
    assert.match(
      previewScaleCode,
      /if\s*\(showDiagnostics\)\s*\{[\s\S]*viewer\.getBoundingClientRect\(\)[\s\S]*setDebugMetrics/,
      'getBoundingClientRect for debugMetrics must be conditioned on showDiagnostics'
    );
  });

  await t.test('5. Redundant interval bursts in useA4PreviewScale have been eliminated', () => {
    assert.doesNotMatch(
      previewScaleCode,
      /setInterval\(\(\)\s*=>\s*\{[\s\S]*calculateScalesRef\.current\(\)[\s\S]*140\)/,
      'No aggressive 140ms setInterval bursts should thrash the main thread during tab activation'
    );
  });

  await t.test('6. resetAllParentScrolls avoids unnecessary DOM mutations when scroll is already 0', () => {
    assert.match(
      previewScaleCode,
      /window\.scrollX\s*!==\s*0\s*\|\|\s*window\.scrollY\s*!==\s*0/,
      'Window scroll reset should guard against unnecessary writes'
    );
    assert.match(
      previewScaleCode,
      /document\.documentElement\.scrollTop\s*!==\s*0/,
      'Document scroll reset should check current scroll position before writing'
    );
  });
});
