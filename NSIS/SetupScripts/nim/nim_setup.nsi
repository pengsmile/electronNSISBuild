!include "..\config.nsh"
#SetCompressor lzma

!include "ui_nim_setup.nsh"

# ==================== NSIS属性 ================================

# 针对Vista和win7 的UAC进行权限请求.
# RequestExecutionLevel none|user|highest|admin
RequestExecutionLevel admin

Function .onInit
    BringToFront
FunctionEnd


; 安装包名字.
Name "${LANG_APP_NAME}"

# 安装程序文件名.

OutFile "..\..\..\dist\${INSTALL_OUTPUT_NAME}"

;$PROGRAMFILES32\Netease\NIM\

InstallDir "1"

# 安装和卸载程序图标
Icon              "${INSTALL_ICO}"
UninstallIcon     "${UNINSTALL_ICO}"
