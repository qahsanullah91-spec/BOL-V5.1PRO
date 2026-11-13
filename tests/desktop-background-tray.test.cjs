const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const rootDir = path.resolve(__dirname, "..")

test("Desktop Background & Tray Service Test Suite", async (t) => {
  await t.test("1. Background service module exists and exports core lifecycle functions", () => {
    const servicePath = path.join(rootDir, "electron", "services", "background-service.ts")
    assert.ok(fs.existsSync(servicePath), "background-service.ts must exist")
    const code = fs.readFileSync(servicePath, "utf8")

    assert.match(code, /export interface BackgroundSettings/, "must export BackgroundSettings interface")
    assert.match(code, /export function loadBackgroundSettings/, "must export loadBackgroundSettings")
    assert.match(code, /export async function saveBackgroundSettings/, "must export saveBackgroundSettings")
    assert.match(code, /export function applyAutoStartSettings/, "must export applyAutoStartSettings")
    assert.match(code, /export function showAndFocusWindow/, "must export showAndFocusWindow")
    assert.match(code, /export function notifyBackgroundActive/, "must export notifyBackgroundActive")
    assert.match(code, /export function initBackgroundService/, "must export initBackgroundService")
    assert.match(code, /export function quitCompletely/, "must export quitCompletely")
    assert.match(code, /export function isQuitting/, "must export isQuitting")
  })

  await t.test("2. Background default settings strictly preserve enterprise 24/7 background mode", () => {
    const servicePath = path.join(rootDir, "electron", "services", "background-service.ts")
    const code = fs.readFileSync(servicePath, "utf8")

    assert.match(code, /runInBackground:\s*true/, "runInBackground must default to true")
    assert.match(code, /minimizeToTray:\s*true/, "minimizeToTray must default to true")
    assert.match(code, /notifyOnBackground:\s*true/, "notifyOnBackground must default to true")
    assert.match(code, /startWithWindows:\s*false/, "startWithWindows must default to false")
  })

  await t.test("3. Main Electron process wires background tray, silent boot, and close interceptor", () => {
    const mainPath = path.join(rootDir, "electron", "main.ts")
    const code = fs.readFileSync(mainPath, "utf8")

    assert.match(code, /initBackgroundService\(/, "main.ts must call initBackgroundService")
    assert.match(code, /startHidden\s*=\s*process\.argv\.includes\("--hidden"\)/, "main.ts must support silent startup via --hidden")
    assert.match(code, /mainWindow\.on\("close",\s*\(event\)\s*=>/, "main.ts must intercept window close event")
    assert.match(code, /!isQuitting\(\)\s*&&\s*bgSettings\.runInBackground/, "close interceptor must honor isQuitting() and runInBackground")
    assert.match(code, /mainWindow\.on\("minimize"/, "main.ts must handle window minimize event")
    assert.match(code, /app\.on\("second-instance"/, "main.ts must handle second-instance restoration")
    assert.match(code, /showAndFocusWindow\(mainWindow\)/, "second-instance must restore and focus hidden main window")
  })

  await t.test("4. IPC registry implements background:get-settings, save-settings, minimize-to-tray, quit-completely, test-notification, get-diagnostics", () => {
    const ipcPath = path.join(rootDir, "electron", "ipc", "register-ipc.ts")
    const code = fs.readFileSync(ipcPath, "utf8")

    assert.match(code, /ipcMain\.handle\("background:get-settings"/, "must handle background:get-settings")
    assert.match(code, /ipcMain\.handle\("background:save-settings"/, "must handle background:save-settings")
    assert.match(code, /ipcMain\.handle\("background:minimize-to-tray"/, "must handle background:minimize-to-tray")
    assert.match(code, /ipcMain\.handle\("background:quit-completely"/, "must handle background:quit-completely")
    assert.match(code, /ipcMain\.handle\("background:test-notification"/, "must handle background:test-notification")
    assert.match(code, /ipcMain\.handle\("background:get-diagnostics"/, "must handle background:get-diagnostics")
  })

  await t.test("5. Preload script & TypeScript declarations expose desktop background bridge & diagnostics", () => {
    const preloadPath = path.join(rootDir, "electron", "preload.ts")
    const preloadCode = fs.readFileSync(preloadPath, "utf8")
    assert.match(preloadCode, /getBackgroundSettings:\s*\(\)\s*=>/, "preload must expose getBackgroundSettings")
    assert.match(preloadCode, /saveBackgroundSettings:\s*\(settings/, "preload must expose saveBackgroundSettings")
    assert.match(preloadCode, /minimizeToTray:\s*\(\)\s*=>/, "preload must expose minimizeToTray")
    assert.match(preloadCode, /quitApp:\s*\(\)\s*=>/, "preload must expose quitApp")
    assert.match(preloadCode, /testTrayNotification:\s*\(\)\s*=>/, "preload must expose testTrayNotification")
    assert.match(preloadCode, /getBackgroundDiagnostics:\s*\(\)\s*=>/, "preload must expose getBackgroundDiagnostics")
    assert.match(preloadCode, /onBackgroundSettingsChanged:\s*\(callback/, "preload must expose onBackgroundSettingsChanged")

    const dtsPath = path.join(rootDir, "electron", "desktop-api.d.ts")
    const dtsCode = fs.readFileSync(dtsPath, "utf8")
    assert.match(dtsCode, /interface BackgroundSettings/, "desktop-api.d.ts must declare BackgroundSettings interface")
    assert.match(dtsCode, /interface BackgroundDiagnostics/, "desktop-api.d.ts must declare BackgroundDiagnostics interface")
    assert.match(dtsCode, /getBackgroundSettings\(\):/, "desktop-api.d.ts must declare getBackgroundSettings")
    assert.match(dtsCode, /saveBackgroundSettings\(settings:/, "desktop-api.d.ts must declare saveBackgroundSettings")
    assert.match(dtsCode, /minimizeToTray\(\):/, "desktop-api.d.ts must declare minimizeToTray")
    assert.match(dtsCode, /testTrayNotification\(\):/, "desktop-api.d.ts must declare testTrayNotification")
    assert.match(dtsCode, /getBackgroundDiagnostics\(\):/, "desktop-api.d.ts must declare getBackgroundDiagnostics")
    assert.match(dtsCode, /quitApp\(\):/, "desktop-api.d.ts must declare quitApp")
  })

  await t.test("6. Desktop background settings UI component renders bilingual controls, telemetry, and actions", () => {
    const componentPath = path.join(rootDir, "components", "settings", "desktop-background-settings.tsx")
    assert.ok(fs.existsSync(componentPath), "desktop-background-settings.tsx must exist")
    const code = fs.readFileSync(componentPath, "utf8")

    assert.match(code, /"use client"/, "must be a client component")
    assert.match(code, /export function DesktopBackgroundSettingsCard/, "must export DesktopBackgroundSettingsCard")
    assert.match(code, /Run in Background on Close/, "must have Run in Background on Close label")
    assert.match(code, /ادامه اجرای نرم‌افزار در پس‌زمینه/, "must have Persian/Dari description")
    assert.match(code, /Launch on Windows Startup/, "must have Launch on Windows Startup label")
    assert.match(code, /Minimize to Notification Tray/, "must have Minimize to Notification Tray label")
    assert.match(code, /Minimize to Tray Now/, "must have manual minimize button")
    assert.match(code, /Test Tray Balloon/, "must have test notification balloon button")
    assert.match(code, /Quit Application Completely/, "must have complete quit button")
    assert.match(code, /System Tray Telemetry/, "must include system telemetry drawer")
  })

  await t.test("7. Settings view mounts DesktopBackgroundSettingsCard under System infrastructure", () => {
    const settingsPath = path.join(rootDir, "components", "settings-view.tsx")
    const code = fs.readFileSync(settingsPath, "utf8")

    assert.match(code, /import\s*\{\s*DesktopBackgroundSettingsCard\s*\}\s*from/, "must import DesktopBackgroundSettingsCard")
    assert.match(code, /"desktop_background"/, "must include desktop_background tab in SettingsTab")
    assert.match(code, /<DesktopBackgroundSettingsCard\s*\/>/, "must render DesktopBackgroundSettingsCard")
    assert.match(code, /id="section-desktop-background"/, "must have section-desktop-background anchor")
  })

  await t.test("8. Desktop package builder copies app-icon.ico and icon-light-32x32.png for crisp tray rendering", () => {
    const builderPath = path.join(rootDir, "scripts", "prepare-desktop-package.cjs")
    const code = fs.readFileSync(builderPath, "utf8")

    assert.match(code, /app-icon\.ico/, "prepare-desktop-package must bundle app-icon.ico")
    assert.match(code, /icon-light-32x32\.png/, "prepare-desktop-package must bundle icon-light-32x32.png")
  })
})
