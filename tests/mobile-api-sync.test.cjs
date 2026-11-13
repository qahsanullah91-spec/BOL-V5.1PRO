const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Flutter Mobile Companion App file structure integrity', () => {
  const mobileDir = path.resolve(__dirname, '../mobile');
  assert.ok(fs.existsSync(mobileDir), 'mobile/ directory must exist');

  const pubspecPath = path.join(mobileDir, 'pubspec.yaml');
  assert.ok(fs.existsSync(pubspecPath), 'pubspec.yaml must exist');
  const pubspec = fs.readFileSync(pubspecPath, 'utf8');
  assert.match(pubspec, /name:\s*sky_ariana_mobile/, 'App name must be sky_ariana_mobile');
  assert.match(pubspec, /http:\s*\^1\./, 'Must declare http package dependency');

  const modelPath = path.join(mobileDir, 'lib/models/bol_record.dart');
  assert.ok(fs.existsSync(modelPath), 'bol_record.dart model must exist');
  const modelCode = fs.readFileSync(modelPath, 'utf8');
  assert.match(modelCode, /class BolRecord/, 'BolRecord class must exist');
  assert.match(modelCode, /factory BolRecord\.fromJson/, 'Must include fromJson factory');
  assert.match(modelCode, /Map<String, dynamic> toJson/, 'Must include toJson');

  const servicePath = path.join(mobileDir, 'lib/services/bol_api_service.dart');
  assert.ok(fs.existsSync(servicePath), 'bol_api_service.dart must exist');
  const serviceCode = fs.readFileSync(servicePath, 'utf8');
  assert.match(serviceCode, /import 'package:http\/http\.dart' as http;/, 'Must import http');
  assert.match(serviceCode, /compute\(parseBolsPayload/, 'Must use compute for background isolate parsing');
  assert.match(serviceCode, /10\.0\.2\.2:3001/, 'Must support Android emulator 10.0.2.2 localhost bridge');

  const screenPath = path.join(mobileDir, 'lib/screens/bol_list_view.dart');
  assert.ok(fs.existsSync(screenPath), 'bol_list_view.dart must exist');
  const screenCode = fs.readFileSync(screenPath, 'utf8');
  assert.match(screenCode, /FutureBuilder<BolApiResponse>/, 'Must use FutureBuilder');
  assert.match(screenCode, /RefreshIndicator/, 'Must support pull-to-refresh');

  const manifestPath = path.join(mobileDir, 'android/app/src/main/AndroidManifest.xml');
  assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml must exist');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  assert.match(manifest, /android\.permission\.INTERNET/, 'Must configure INTERNET permission');
});

test('Mobile API Sync Route supports pagination and lightweight payloads', async () => {
  const syncRoutePath = path.resolve(__dirname, '../app/api/sync/route.ts');
  assert.ok(fs.existsSync(syncRoutePath), 'sync route must exist');
  const syncCode = fs.readFileSync(syncRoutePath, 'utf8');
  assert.match(syncCode, /mode === "light" \|\| mode === "mobile"/, 'Sync route must handle mobile mode');
  assert.match(syncCode, /mobile-optimized-stream/, 'Sync route must emit mobile-optimized-stream source');
});
