echo "start packing"
rem del dist file
rem RD /S /Q "../dist"
rem md "../dist"

rem compress skinPach to skin.zip
del ".\SetupScripts\nim\skin.zip"
7z.exe a ".\SetupScripts\nim\skin.zip" ".\SetupScripts\nim\skin\*"

rem compress appliction to app.7z
del ".\SetupScripts\app.7z"
7z.exe a ".\SetupScripts\app.7z" ".\FilesToInstall\win-unpacked\*"

rem build install appliction
".\NSIS\makensis.exe" ".\SetupScripts\nim\nim_setup.nsi"

rem RD /S /Q "./FilesToInstall"
RD /S /Q "../build"
7z.exe a "../dist/resources/lib.zip" "../dist/resources/lib"
RD /S /Q "../dist/resources/lib"
7z.exe a "../dist/resources.zip" "../dist/resources"
RD /S /Q "../dist/resources"
exit
