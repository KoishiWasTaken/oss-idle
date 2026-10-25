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
