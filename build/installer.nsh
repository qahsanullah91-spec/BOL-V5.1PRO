; ==============================================================================
; AQ COMPANIES - Enterprise NSIS Installer Customization Hook
; Modern Windows 11 Fluent UI, Visual Branding & Process Termination Shield
; ==============================================================================

!define /ifndef PRODUCT_NAME "AQ COMPANIES"
!define MUI_BGCOLOR "FFFFFF"
!define MUI_TEXTCOLOR "0F172A"
!define MUI_INSTFILESPAGE_PROGRESSBAR "smooth"
!define MUI_CUSTOMFUNCTION_GUIINIT customGuiInit

!macro customHeader
  ManifestDPIAware true
  BrandingText "AQ COMPANIES • Logistics & Financial Management Portal"
!macroend

; Hook right before MUI_PAGE_INSTFILES to bind the custom show callback
!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW customInstFilesShow

Function customInstFilesShow
  FindWindow $0 "#32770" "" $HWNDPARENT
  GetDlgItem $1 $0 1004 ; Progress bar
  GetDlgItem $2 $0 1006 ; Status text

  CreateFont $R8 "Segoe UI" 9 700
  CreateFont $R9 "Segoe UI" 9 400
  CreateFont $R7 "Segoe UI" 8 400

  ; Modernize Status Text (1006)
  SendMessage $2 0x0030 $R8 1
  SetCtlColors $2 0x000F172A 0x00FFFFFF

  ; Detach classical Windows XP/Vista theme bitmap for smooth custom flat color
  System::Call "uxtheme::SetWindowTheme(i $1, w '', w '')"
  ; Set modern Royal Blue progress bar (#2563EB = 0x00EB6325) and Slate-100 track (#F1F5F9 = 0x00F9F5F1)
  SendMessage $1 1033 0 0x00EB6325 ; PBM_SETBARCOLOR -> #2563EB
  SendMessage $1 8193 0 0x00F9F5F1 ; PBM_SETBKCOLOR -> #F1F5F9

  ; Set modern progress bar dimensions (height 18px and width 414px)
  System::Call "user32::SetWindowPos(i $1, i 0, i 18, i 36, i 414, i 18, i 0x0014)"

  ; -------------------------------------------------------------
  ; Modern Enterprise Architecture Showcase Card (Fills empty void)
  ; -------------------------------------------------------------
  ; Outer Card Container (BS_GROUPBOX = 0x07, WS_CHILD|WS_VISIBLE = 0x50000000)
  System::Call "user32::CreateWindowEx(i 0, t 'BUTTON', t '  AQ COMPANIES Enterprise Core Architecture  ', i 0x50000007, i 18, i 66, i 414, i 174, i $0, i 2000, i 0, i 0) i .r3"
  SendMessage $3 0x0030 $R8 1
  SetCtlColors $3 0x001E3A8A 0x00FFFFFF

  ; Feature Item 1: Multi-Modal BOL Engine
  System::Call "user32::CreateWindowEx(i 0, t '🚚  Multi-Modal BOL Engine (Road, Sea & Rail transit)', i 0x50000000, i 32, i 88, i 385, i 18, i $0, i 2001, i 0, i 0) i .r4"
  SendMessage $4 0x0030 $R8 1
  SetCtlColors $4 0x000F172A 0x00FFFFFF

  System::Call "user32::CreateWindowEx(i 0, t '    Automated transit routes, border customs stations, and carrier dispatching', i 0x50000000, i 32, i 104, i 385, i 15, i $0, i 2002, i 0, i 0) i .r5"
  SendMessage $5 0x0030 $R7 1
  SetCtlColors $5 0x0064748B 0x00FFFFFF

  ; Feature Item 2: Double-Entry Accounting
  System::Call "user32::CreateWindowEx(i 0, t '⚖️  Dual-Currency Ledgers & Accounting Invariance Identity', i 0x50000000, i 32, i 122, i 385, i 18, i $0, i 2003, i 0, i 0) i .r6"
  SendMessage $6 0x0030 $R8 1
  SetCtlColors $6 0x000F172A 0x00FFFFFF

  System::Call "user32::CreateWindowEx(i 0, t '    Mathematical balance identity: Net Balance = Total Debit - Total Credit (USD/AFN)', i 0x50000000, i 32, i 138, i 385, i 15, i $0, i 2004, i 0, i 0) i .r7"
  SendMessage $7 0x0030 $R7 1
  SetCtlColors $7 0x0064748B 0x00FFFFFF

  ; Feature Item 3: Biometric Security Vault
  System::Call "user32::CreateWindowEx(i 0, t '🔐  Windows Hello Biometric Authentication & Security Vault', i 0x50000000, i 32, i 156, i 385, i 18, i $0, i 2005, i 0, i 0) i .r8"
  SendMessage $8 0x0030 $R8 1
  SetCtlColors $8 0x000F172A 0x00FFFFFF

  System::Call "user32::CreateWindowEx(i 0, t '    Hardware fingerprint validation, workspace lock, and encrypted credentials', i 0x50000000, i 32, i 172, i 385, i 15, i $0, i 2006, i 0, i 0) i .r9"
  SendMessage $9 0x0030 $R7 1
  SetCtlColors $9 0x0064748B 0x00FFFFFF

  ; Feature Item 4: Cloud Sync & Vector Print
  System::Call "user32::CreateWindowEx(i 0, t '☁️  Cross-Device Peer Sync & Offline-First SQLite Architecture', i 0x50000000, i 32, i 190, i 385, i 18, i $0, i 2007, i 0, i 0) i .r4"
  SendMessage $4 0x0030 $R8 1
  SetCtlColors $4 0x000F172A 0x00FFFFFF

  System::Call "user32::CreateWindowEx(i 0, t '    Multi-device synchronization, 3-in-1 shipping docs & precision A4 vector PDFs', i 0x50000000, i 32, i 206, i 385, i 15, i $0, i 2008, i 0, i 0) i .r5"
  SendMessage $5 0x0030 $R7 1
  SetCtlColors $5 0x0064748B 0x00FFFFFF
FunctionEnd
!macroend



Function customGuiInit
  ; Initialize modern Segoe UI typography across parent dialog
  CreateFont $R8 "Segoe UI" 9 400
  CreateFont $R9 "Segoe UI" 9 700

  ; Modernize wizard buttons (1: Next/Install, 2: Cancel, 3: Back)
  GetDlgItem $0 $HWNDPARENT 1
  SendMessage $0 0x0030 $R9 1
  GetDlgItem $0 $HWNDPARENT 2
  SendMessage $0 0x0030 $R8 1
  GetDlgItem $0 $HWNDPARENT 3
  SendMessage $0 0x0030 $R8 1

  ; Modernize Branding Text in footer
  GetDlgItem $0 $HWNDPARENT 1256
  SendMessage $0 0x0030 $R8 1
  SetCtlColors $0 0x0064748B 0x00FFFFFF
FunctionEnd

; ==============================================================================
; Process Termination Shield & Pre-Initialization Hooks
; ==============================================================================

!macro preInit
  ; Terminate running instances at the earliest possible lifecycle event
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
  Pop $0
!macroend

!macro customInit
  ; Terminate processes again after multiUser init (runs in both inner & outer instances)
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
  Pop $0
!macroend

!macro customCheckAppRunning
  DetailPrint "Terminating any running instances of ${PRODUCT_NAME}..."
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
  Pop $0
  Sleep 1200
!macroend

; ==============================================================================
; Uninstallation Result Shield & Upgrade Failure Bypass
; Overrides electron-builder's default fatal error:
; "Failed to uninstall old application files. Please try running the installer again.: 2"
; ==============================================================================

!macro customUnInstallCheck
  ${if} $R0 != 0
    DetailPrint "Old uninstaller returned code $R0 - suppressing failure dialog to allow upgrade."
    ; Force kill any stubborn processes that may have held file locks
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
    Pop $0
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
    Pop $0
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
    Pop $0
    Sleep 1200
    ClearErrors
  ${else}
    DetailPrint "Previous application version uninstalled cleanly."
  ${endif}
!macroend

!macro customUnInstallCheckCurrentUser
  ${if} $R0 != 0
    DetailPrint "Old uninstaller (CurrentUser) returned code $R0 - suppressing failure dialog to allow upgrade."
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
    Pop $0
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
    Pop $0
    nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
    Pop $0
    Sleep 1200
    ClearErrors
  ${else}
    DetailPrint "Previous application version (CurrentUser) uninstalled cleanly."
  ${endif}
!macroend

; ==============================================================================
; Uninstaller Hooks (for current & future installations)
; ==============================================================================

!macro customUnInstall
  DetailPrint "Stopping ${PRODUCT_NAME} services before uninstallation..."
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
  Pop $0
  Sleep 1200
!macroend

!macro customRemoveFiles
  DetailPrint "Purging existing application binaries..."
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "electron.exe"`
  Pop $0
  Sleep 800
  SetOutPath $TEMP
  RMDir /r $INSTDIR
!macroend
