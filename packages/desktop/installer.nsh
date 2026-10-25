; An update (and an uninstall) removes the game's files from its folder, never the player's
; maps, skins and add-ons beside them. electron-builder's own removal wipes the whole folder.

!macro customRemoveFiles
  StrCpy $R4 ""
  ${if} ${isUpdated}
    ; moved aside first, like electron-builder does: a busy file stops the update, nothing lost
    CreateDirectory "$PLUGINSDIR\old-install"
    FindFirst $R1 $R2 "$INSTDIR\*.*"
    ${DoWhile} $R2 != ""
      ${If} $R2 == "."
      ${OrIf} $R2 == ".."
      ${OrIf} $R2 == "maps"
      ${OrIf} $R2 == "skins"
      ${OrIf} $R2 == "addons"
      ${OrIf} $R4 != ""
        ; kept
      ${ElseIf} ${FileExists} "$INSTDIR\$R2\*.*"
        CreateDirectory "$PLUGINSDIR\old-install\$R2"
        Push "\$R2"
        Call un.atomicRMDir
        Pop $R3
        ${If} $R3 != 0
          StrCpy $R4 $R3
        ${EndIf}
      ${Else}
        ClearErrors
        Rename "$INSTDIR\$R2" "$PLUGINSDIR\old-install\$R2"
        ${If} ${Errors}
        ${AndIf} $R2 != "${UNINSTALL_FILENAME}"
          StrCpy $R4 "$INSTDIR\$R2"
        ${EndIf}
      ${EndIf}
      FindNext $R1 $R2
    ${Loop}
    FindClose $R1
    ${If} $R4 != ""
      DetailPrint "File is busy, aborting: $R4"
      Push ""
      Call un.restoreFiles
      Pop $R0
      Abort `Can't move "$R4" out of "$INSTDIR".`
    ${EndIf}
  ${endif}

  FindFirst $R1 $R2 "$INSTDIR\*.*"
  ${DoWhile} $R2 != ""
    ${If} $R2 == "."
    ${OrIf} $R2 == ".."
    ${OrIf} $R2 == "maps"
    ${OrIf} $R2 == "skins"
    ${OrIf} $R2 == "addons"
      ; kept
    ${ElseIf} ${FileExists} "$INSTDIR\$R2\*.*"
      RMDir /r "$INSTDIR\$R2"
    ${Else}
      Delete "$INSTDIR\$R2"
    ${EndIf}
    FindNext $R1 $R2
  ${Loop}
  FindClose $R1
  ; gone when nothing of the player's is left in it
  RMDir $INSTDIR
!macroend

; electron-builder's own check gives up with "cannot be closed" whenever a process of the game's
; name outlives taskkill - one started elevated, or one stuck exiting - even with the game closed
; and nothing of it in use. What blocks an install is the installed game being in use, and a running
; exe can't be opened for writing (it can still be renamed), so that is what this checks.
!macro gameInUse _OUT
  StrCpy ${_OUT} 0
  ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ClearErrors
    FileOpen $R2 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" a
    ${If} ${Errors}
      StrCpy ${_OUT} 1
    ${Else}
      FileClose $R2
    ${EndIf}
  ${EndIf}
!macroend

!macro customCheckAppRunning
  !insertmacro gameInUse $R0
  ${If} $R0 == 1
    ${IfNot} ${isUpdated}
      MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$(appRunning)" /SD IDOK IDOK +2
      Quit
    ${EndIf}
    DetailPrint `Closing running "${PRODUCT_NAME}"...`
    StrCpy $R1 0
    ${Do}
      ; no /t: an update's installer is the old game's child and would go down with it
      nsExec::Exec `"$SYSDIR\cmd.exe" /c taskkill /f /im "${APP_EXECUTABLE_FILENAME}" /fi "USERNAME eq %USERNAME%"`
      Pop $R2
      Sleep 1000
      !insertmacro gameInUse $R0
      ${If} $R0 == 1
        IntOp $R1 $R1 + 1
        ${If} $R1 >= 5
          MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY +2
          Quit
          StrCpy $R1 0
        ${EndIf}
      ${EndIf}
    ${LoopWhile} $R0 == 1
  ${EndIf}
!macroend
