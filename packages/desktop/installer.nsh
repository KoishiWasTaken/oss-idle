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

; ---- Our screens ----------------------------------------------------------------------------
; electron-builder's assisted installer in a borderless 720x420 window: welcome (install folder),
; installing (its progress bar, restyled), ready (play, desktop shortcut). An update shows only its
; progress, in a 460x150 window, then starts the game. Each page is a bitmap from
; build/installer/art.html (render.mjs prints the hotspots used below). The uninstaller keeps the
; one-click confirm.

; builds up to 1.2.7.3 ask for silent updates; one applied on quit (no --force-run) stays silent
!macro customInit
  ${If} ${isUpdated}
  ${AndIf} ${isForceRun}
    SetSilent normal
  ${EndIf}
!macroend

!macro customUnInit
  ${IfNot} ${Silent}
    MessageBox MB_OKCANCEL "$(areYouSureToUninstall)" IDOK +2
    Quit
    Call un.checkAppRunning
    SetSilent silent
  ${EndIf}
!macroend

; always per-user, like the one-click installer: no "for whom" page
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customWelcomePage
  !define MUI_CUSTOMFUNCTION_GUIINIT ossGuiInit
!macroend

!macro ossHotspot X Y W H HANDLER
  ${NSD_CreateLabel} ${X} ${Y} ${W} ${H} ""
  Pop $0
  SetCtlColors $0 000000 transparent
  ${NSD_OnClick} $0 ${HANDLER}
!macroend

; created last, so it sits under the page's controls
!macro ossBackground IMAGE
  ${NSD_CreateBitmap} 0 0 720 420 ""
  Pop $ossBg
  ${NSD_SetImage} $ossBg "$PLUGINSDIR\${IMAGE}" $ossBgImage
  ${NSD_OnClick} $ossBg ossDrag
!macroend

!macro customPageAfterChangeDir
  Var ossBg
  Var ossBgImage
  Var ossFont
  Var ossLinkFont
  Var ossPathLabel
  Var ossChangeLabel

  Function ossGuiInit
    InitPluginsDir
    File "/oname=$PLUGINSDIR\welcome.bmp" "${BUILD_RESOURCES_DIR}/installer/welcome.bmp"
    File "/oname=$PLUGINSDIR\installing.bmp" "${BUILD_RESOURCES_DIR}/installer/installing.bmp"
    File "/oname=$PLUGINSDIR\ready-on.bmp" "${BUILD_RESOURCES_DIR}/installer/ready-on.bmp"
    File "/oname=$PLUGINSDIR\ready-off.bmp" "${BUILD_RESOURCES_DIR}/installer/ready-off.bmp"
    File "/oname=$PLUGINSDIR\updating.bmp" "${BUILD_RESOURCES_DIR}/installer/updating.bmp"
    File "/oname=$PLUGINSDIR\Exo2-Regular.otf" "${PROJECT_DIR}/../client/public/fonts/Exo2-Regular.otf"
    StrCpy $0 "$PLUGINSDIR\Exo2-Regular.otf"
    System::Call 'gdi32::AddFontResourceExW(w r0, i 0x10, p 0)'
    ; the font's GDI family name
    CreateFont $ossFont "Exo 2.0" 10 400
    CreateFont $ossLinkFont "Exo 2.0" 10 400 /UNDERLINE

    StrCpy $6 720
    StrCpy $7 420
    ${If} ${isUpdated}
      StrCpy $6 460
      StrCpy $7 150
    ${EndIf}

    ; no caption or frame (WS_CAPTION|WS_THICKFRAME, WS_EX_DLGMODALFRAME|WS_EX_WINDOWEDGE), minimizable
    System::Call 'user32::GetWindowLongW(p $HWNDPARENT, i -16) i .r0'
    IntOp $0 $0 & 0xFF3BFFFF
    IntOp $0 $0 | 0x20000
    System::Call 'user32::SetWindowLongW(p $HWNDPARENT, i -16, i r0)'
    System::Call 'user32::GetWindowLongW(p $HWNDPARENT, i -20) i .r0'
    IntOp $0 $0 & 0xFFFFFEFE
    System::Call 'user32::SetWindowLongW(p $HWNDPARENT, i -20, i r0)'
    System::Call '*(i, i, i, i) p .r1'
    System::Call 'user32::GetWindowRect(p $HWNDPARENT, p r1)'
    System::Call '*$1(i .r2, i .r3, i .r4, i .r5)'
    System::Free $1
    IntOp $2 $2 + $4
    IntOp $2 $2 - $6
    IntOp $2 $2 / 2
    IntOp $3 $3 + $5
    IntOp $3 $3 - $7
    IntOp $3 $3 / 2
    System::Call 'user32::SetWindowPos(p $HWNDPARENT, p 0, i r2, i r3, i r6, i r7, i 0x24)'
    ; Windows 11 rounds it like any window (DWMWA_WINDOW_CORNER_PREFERENCE = round)
    System::Call 'dwmapi::DwmSetWindowAttribute(p $HWNDPARENT, i 33, *i 2, i 4)'

    ; pages (laid out on control 1018) fill the window; header, buttons and branding move out of it
    System::Call 'user32::GetWindow(p $HWNDPARENT, i 5) p .r0'
    ${DoWhile} $0 <> 0
      System::Call 'user32::GetDlgCtrlID(p r0) i .r1'
      ${If} $1 = 1018
        System::Call 'user32::SetWindowPos(p r0, p 0, i 0, i 0, i r6, i r7, i 0x14)'
      ${Else}
        System::Call 'user32::SetWindowPos(p r0, p 0, i -4000, i 0, i 0, i 0, i 0x15)'
      ${EndIf}
      System::Call 'user32::GetWindow(p r0, i 2) p .r0'
    ${Loop}
  FunctionEnd

  Function ossDrag
    Pop $0
    System::Call 'user32::ReleaseCapture()'
    SendMessage $HWNDPARENT 0xA1 2 0 ; WM_NCLBUTTONDOWN on the caption
  FunctionEnd

  Function ossMinimize
    Pop $0
    ShowWindow $HWNDPARENT ${SW_MINIMIZE}
  FunctionEnd

  Function ossClose
    Pop $0
    SendMessage $HWNDPARENT ${WM_COMMAND} 2 0
  FunctionEnd

  Function ossNext
    Pop $0
    SendMessage $HWNDPARENT ${WM_COMMAND} 1 0
  FunctionEnd

  ; "<folder>  change", centred, the folder path-ellipsed past 480px
  Function ossLayoutPath
    System::Call 'user32::GetDC(p 0) p .r5'
    System::Call 'gdi32::SelectObject(p r5, p $ossFont) p .r6'
    System::Call '*(i, i) p .r7'
    StrCpy $9 $INSTDIR
    StrLen $8 $9
    System::Call 'gdi32::GetTextExtentPoint32W(p r5, w r9, i r8, p r7)'
    System::Call '*$7(i .r1)'
    System::Call 'gdi32::SelectObject(p r5, p $ossLinkFont)'
    System::Call 'gdi32::GetTextExtentPoint32W(p r5, w "change", i 6, p r7)'
    System::Call '*$7(i .r2)'
    System::Call 'gdi32::SelectObject(p r5, p r6)'
    System::Call 'user32::ReleaseDC(p 0, p r5)'
    System::Free $7
    IntOp $1 $1 + 2
    ${If} $1 > 480
      StrCpy $1 480
    ${EndIf}
    IntOp $2 $2 + 2
    IntOp $3 $1 + $2
    IntOp $3 $3 + 8
    IntOp $4 720 - $3
    IntOp $4 $4 / 2
    System::Call 'user32::SetWindowPos(p $ossPathLabel, p 0, i r4, i 300, i r1, i 18, i 0x14)'
    IntOp $4 $4 + $1
    IntOp $4 $4 + 8
    System::Call 'user32::SetWindowPos(p $ossChangeLabel, p 0, i r4, i 300, i r2, i 18, i 0x14)'
  FunctionEnd

  Function ossChangeDir
    Pop $0
    nsDialogs::SelectFolderDialog "" $INSTDIR
    Pop $0
    ${If} $0 != error
      ; always a folder of its own, like electron-builder's directory page
      StrCpy $1 $0 1 -1
      ${If} $1 == "\"
        StrCpy $0 $0 -1
      ${EndIf}
      ${GetFileName} $0 $1
      ${If} $1 != "${APP_FILENAME}"
        StrCpy $0 "$0\${APP_FILENAME}"
      ${EndIf}
      StrCpy $INSTDIR $0
      ; hidden while it changes, so the art repaints under the transparent text
      ShowWindow $ossPathLabel ${SW_HIDE}
      ShowWindow $ossChangeLabel ${SW_HIDE}
      SendMessage $ossPathLabel ${WM_SETTEXT} 0 "STR:$INSTDIR"
      Call ossLayoutPath
      ShowWindow $ossPathLabel ${SW_SHOW}
      ShowWindow $ossChangeLabel ${SW_SHOW}
    ${EndIf}
  FunctionEnd

  Function ossWelcome
    ${If} ${isUpdated}
      Abort
    ${EndIf}
    nsDialogs::Create 1018
    Pop $0
    !insertmacro ossHotspot 656 8 28 26 ossMinimize
    !insertmacro ossHotspot 686 8 26 26 ossClose
    !insertmacro ossHotspot 275 235 169 47 ossNext
    ${NSD_CreateLabel} 0 300 0 18 $INSTDIR
    Pop $ossPathLabel
    System::Call 'user32::GetWindowLongW(p $ossPathLabel, i -16) i .r0'
    IntOp $0 $0 | 0x8000 ; SS_PATHELLIPSIS
    System::Call 'user32::SetWindowLongW(p $ossPathLabel, i -16, i r0)'
    SendMessage $ossPathLabel ${WM_SETFONT} $ossFont 0
    SetCtlColors $ossPathLabel 938D92 transparent
    ${NSD_CreateLabel} 0 300 0 18 "change"
    Pop $ossChangeLabel
    SendMessage $ossChangeLabel ${WM_SETFONT} $ossLinkFont 0
    SetCtlColors $ossChangeLabel D5CFD4 transparent
    ${NSD_OnClick} $ossChangeLabel ossChangeDir
    Call ossLayoutPath
    !insertmacro ossBackground welcome.bmp
    nsDialogs::Show
    ${NSD_FreeImage} $ossBgImage
  FunctionEnd

  Function ossWelcomeLeave
  FunctionEnd

  Page custom ossWelcome ossWelcomeLeave

  ; the stock page with its texts hidden and the bar laid flat on the art's track
  Function ossInstShow
    FindWindow $0 "#32770" "" $HWNDPARENT
    ; bitmap, its size, the bar's rect and the track's colour (BGR) under it
    ${If} ${isUpdated}
      StrCpy $4 "$PLUGINSDIR\updating.bmp"
      StrCpy $R0 460
      StrCpy $R1 150
      StrCpy $6 100
      StrCpy $7 82
      StrCpy $8 334
      StrCpy $9 0x332E35
    ${Else}
      StrCpy $4 "$PLUGINSDIR\installing.bmp"
      StrCpy $R0 720
      StrCpy $R1 420
      StrCpy $6 170
      StrCpy $7 239
      StrCpy $8 380
      StrCpy $9 0x2D282D
    ${EndIf}
    System::Call 'user32::SetWindowPos(p r0, p 0, i 0, i 0, i R0, i R1, i 0x14)'
    GetDlgItem $1 $0 1006
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1016
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1027
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1004
    System::Call 'uxtheme::SetWindowTheme(p r1, w " ", w " ")'
    System::Call 'user32::GetWindowLongW(p r1, i -16) i .r2'
    IntOp $2 $2 & 0xFF7FFFFF ; no WS_BORDER
    IntOp $2 $2 | 1 ; PBS_SMOOTH
    System::Call 'user32::SetWindowLongW(p r1, i -16, i r2)'
    System::Call 'user32::SetWindowLongW(p r1, i -20, i 0)'
    System::Call 'user32::SetWindowPos(p r1, p 0, i r6, i r7, i r8, i 4, i 0x34)'
    SendMessage $1 0x409 0 0xAA66FF ; PBM_SETBARCOLOR, BGR
    SendMessage $1 0x2001 0 $9 ; PBM_SETBKCOLOR: the track in the bitmap
    System::Call 'user32::LoadImageW(p 0, w r4, i 0, i 0, i 0, i 0x10) p .r2'
    System::Call 'user32::CreateWindowExW(i 0, w "STATIC", p 0, i 0x5000000E, i 0, i 0, i R0, i R1, p r0, p 0, p 0, p 0) p .r3'
    SendMessage $3 0x172 0 $2 ; STM_SETIMAGE
    System::Call 'user32::SetWindowPos(p r3, p 1, i 0, i 0, i 0, i 0, i 0x13)' ; to the bottom
  FunctionEnd
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW ossInstShow
!macroend

!macro customFinishPage
  Var ossShortcut
  Var ossPlay

  ; straight on to "ready" once installed
  AutoCloseWindow true

  Function ossReady
    ${If} ${isUpdated}
      HideWindow
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "--updated"
      Abort
    ${EndIf}
    StrCpy $ossPlay 1
    StrCpy $ossShortcut 0
    ${If} ${FileExists} $newDesktopLink
      StrCpy $ossShortcut 1
    ${EndIf}
    nsDialogs::Create 1018
    Pop $0
    !insertmacro ossHotspot 656 8 28 26 ossMinimize
    !insertmacro ossHotspot 686 8 26 26 ossReadyClose
    !insertmacro ossHotspot 285 235 149 47 ossNext
    !insertmacro ossHotspot 292 296 136 24 ossShortcutToggle
    ${If} $ossShortcut == 1
      !insertmacro ossBackground ready-on.bmp
    ${Else}
      !insertmacro ossBackground ready-off.bmp
    ${EndIf}
    nsDialogs::Show
    ${NSD_FreeImage} $ossBgImage
  FunctionEnd

  ; Play, Enter or the close button: the installer is done either way
  Function ossReadyLeave
    ${If} $ossPlay == 1
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
    ${EndIf}
  FunctionEnd

  Function ossReadyClose
    Pop $0
    StrCpy $ossPlay 0
    SendMessage $HWNDPARENT ${WM_COMMAND} 1 0
  FunctionEnd

  Function ossShortcutToggle
    Pop $0
    ${If} $ossShortcut == 1
      StrCpy $ossShortcut 0
      Delete $newDesktopLink
      StrCpy $1 "$PLUGINSDIR\ready-off.bmp"
    ${Else}
      StrCpy $ossShortcut 1
      CreateShortCut $newDesktopLink $appExe "" $appExe 0 "" "" "${APP_DESCRIPTION}"
      WinShell::SetLnkAUMI $newDesktopLink "${APP_ID}"
      StrCpy $1 "$PLUGINSDIR\ready-on.bmp"
    ${EndIf}
    StrCpy $2 $ossBgImage
    ${NSD_SetImage} $ossBg $1 $ossBgImage
    ${NSD_FreeImage} $2
  FunctionEnd

  Page custom ossReady ossReadyLeave
!macroend
