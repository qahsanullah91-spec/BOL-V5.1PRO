; ==============================================================================
; AQ COMPANIES - Enterprise NSIS Installer Customization Hook
; Enhanced Visual Branding, Modern UI Layout & Process Termination Shield
; ==============================================================================

!macro customHeader
  BrandingText "AQ COMPANIES • Logistics & Financial Management Portal"
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to AQ COMPANIES Setup"
  !define MUI_WELCOMEPAGE_TITLE_3LINES
  !define MUI_WELCOMEPAGE_TEXT "Setup will guide you through the installation of AQ COMPANIES ${VERSION}.\r\n\r\nAQ COMPANIES delivers enterprise-grade Bill of Lading (BOL) management, multi-modal transport dispatching, border station customs documentation, financial ledger audits, and real-time cloud data synchronization.\r\n\r\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Uninstall AQ COMPANIES"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will cleanly remove AQ COMPANIES from your computer.\r\n\r\nApplication executables and background services will be removed. Your business database, account ledgers, and saved BOL archives will remain safely preserved.\r\n\r\nClick Next to continue."
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

!macro customCheckAppRunning
  DetailPrint "Terminating any running instances of ${PRODUCT_NAME}..."
  ; Forcibly terminate all AQ COMPANIES instances and their process trees
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  ; Forcibly terminate standalone Python backend process tree
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  ; Wait 1.2 seconds for Windows to release all file handles and memory locks
  Sleep 1200
!macroend

!macro customInit
  ; Clear any lingering backend worker before installation begins
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
!macroend

!macro customUnInstall
  DetailPrint "Stopping ${PRODUCT_NAME} services before uninstallation..."
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "AQ COMPANIES.exe"`
  Pop $0
  nsExec::Exec `cmd.exe /C taskkill /F /T /IM "aq-backend.exe"`
  Pop $0
  Sleep 1000
!macroend
