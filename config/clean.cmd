echo "start cleaning"
RD /S /Q ".\dist"
del ".\NSIS\SetupScripts\nim\skin.zip"
del ".\NSIS\SetupScripts\app.7z"
RD /S /Q ".\NSIS\FilesToInstall"
RD /S /Q ".\build"
mkdir ".\dist"
mkdir ".\dist\resources"
exit
