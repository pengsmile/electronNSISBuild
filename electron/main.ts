import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 实现单例模式
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // 当用户尝试运行第二个实例时，专注于主窗口
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

// IPC 监听：窗口控制
ipcMain.on('window-minimize', () => {
  win?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window-close', () => {
  win?.hide()
})

// --- Demo: IPC 通信演示 ---

// 1. 监听 send 发来的消息 (单向)
ipcMain.on('hello-send', (_event, arg) => {
  console.log('Main Process received (send):', arg)
})

// 2. 处理 invoke 发来的请求 (双向，带返回结果)
ipcMain.handle('hello-invoke', async (_event, arg) => {
  console.log('Main Process received (invoke):', arg)
  return `Hello World from Main! (You said: ${arg})`
})

// 4. 获取本机 MAC 地址
ipcMain.handle('get-mac-address', () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // 过滤掉虚拟地址和内部回环地址
      if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac
      }
    }
  }
  return false;
})

// 3. 主进程主动推送消息给渲染进程 (使用 webContents.send)
let timer: NodeJS.Timeout
app.whenReady().then(() => {
  timer = setInterval(() => {
    if (win) {
      win.webContents.send('main-push', `Server Time: ${new Date().toLocaleTimeString()}`)
    }
  }, 1000)
})

ipcMain.on('close-main-push', () => {
  clearInterval(timer);
})

app.on('before-quit', () => {
  clearInterval(timer)
})

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null
let isQuitting = false

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'logo.png')
  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        if (win) {
          win.show()
          win.focus()
        } else {
          createWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('CNP Desktop')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (win) {
      if (win.isVisible()) {
        win.focus()
      } else {
        win.show()
      }
    } else {
      createWindow()
    }
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    frame: false,
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#242424', // 匹配应用背景色，同时确保系统动画正常
  })

  // 阻止窗口真正关闭，而是隐藏到托盘
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createTray()
  createWindow()
})
