!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Preparando base de datos de Kassio (solo la primera vez)..."
  ; Tauri places mapped resources under $INSTDIR\resources\
  nsExec::ExecToLog '"$INSTDIR\resources\install-setup.cmd"'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Advertencia: setup de base de datos terminó con código $0 (se reintentará al abrir la app)"
  ${Else}
    DetailPrint "Base de datos lista."
  ${EndIf}
!macroend
