; ==============================================================================
; AQ COMPANIES - Enterprise NSIS Installer Customization Hook
; Automatically terminates any remaining application and backend process trees
; to prevent "AQ COMPANIES cannot be closed" error during upgrades.
; ==============================================================================

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
