<#
.SYNOPSIS
    Deploy script for Sky Databricks Apps Python Backend.

.DESCRIPTION
    Supports both:
    1. Databricks CLI v1.0+ direct sync & deploy
    2. Declarative Automation Bundles (DABs) multi-target deployment
#>

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("cli", "dab")]
    [string]$Method = "cli",

    [Parameter(Mandatory=$false)]
    [string]$AppName = "sky-databricks-backend",

    [Parameter(Mandatory=$false)]
    [string]$WorkspaceUserFolder = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Sky Databricks Apps Python Backend - Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($Method -eq "cli") {
    Write-Host "[1/4] Ensuring App exists in workspace ($AppName)..." -ForegroundColor Yellow
    try {
        databricks apps get $AppName 2>$null
        Write-Host "      App '$AppName' exists." -ForegroundColor Green
    } catch {
        Write-Host "      Creating app '$AppName'..." -ForegroundColor Gray
        databricks apps create $AppName
    }

    if (-not $WorkspaceUserFolder) {
        $currentUser = (databricks current-user me --json | ConvertFrom-Json).userName
        $WorkspaceUserFolder = "/Workspace/Users/$currentUser/apps/$AppName"
    }

    Write-Host "[2/4] Syncing source code to workspace folder ($WorkspaceUserFolder)..." -ForegroundColor Yellow
    databricks workspace mkdirs $WorkspaceUserFolder
    databricks workspace import-dir . $WorkspaceUserFolder --overwrite

    Write-Host "[3/4] Deploying application from workspace..." -ForegroundColor Yellow
    databricks apps deploy $AppName --source-code-path $WorkspaceUserFolder

    Write-Host "[4/4] Fetching App Status and Live URL..." -ForegroundColor Yellow
    databricks apps get $AppName

} elseif ($Method -eq "dab") {
    Write-Host "[1/3] Validating DABs bundle configuration (dev target)..." -ForegroundColor Yellow
    databricks bundle validate -t dev

    Write-Host "[2/3] Deploying bundle resources & app files..." -ForegroundColor Yellow
    databricks bundle deploy -t dev

    Write-Host "[3/3] Running / starting application..." -ForegroundColor Yellow
    databricks bundle run sky_databricks_backend -t dev
}

Write-Host "`n Deployment workflow complete!" -ForegroundColor Green
