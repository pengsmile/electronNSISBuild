import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { execFile, spawn } from 'node:child_process'

/** 主进程文件所在目录，用于构建资源与相对路径 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 实现单例模式
/** 单实例锁，用于避免多开窗口 */
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
/** 开发模式下的 Vite dev server 地址 */
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
/** 构建后主进程产物目录 */
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
/** 构建后渲染进程产物目录 */
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

/** 主窗口引用 */
let win: BrowserWindow | null
/** 托盘引用 */
let tray: Tray | null
/** 标记是否由程序主动退出，避免被 close 事件拦截 */
let isQuitting = false
/** 更新流程缓存：远端版本信息与下载文件路径 */
const updateCache: { latest: UpdateInfo | null; downloadedFilePath: string | null } = {
  latest: null,
  downloadedFilePath: null
}

/** 远端更新描述结构 */
type UpdateInfo = {
  version: string
  url: string
  sha256?: string
  notes?: string
}

/** 更新检查结果返回结构 */
type UpdateCheckResult = {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  url?: string
  notes?: string
}

/**
 * 读取 JSON 文件并解析为指定类型
 * @param filePath JSON 文件路径
 * @returns 解析后的对象，失败返回 null
 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fsp.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

/**
 * 读取应用配置 appInfo.json
 * 优先使用打包后的 app.getAppPath()，其次回退到 cwd
 */
async function getAppInfo() {
  const appInfoPath = path.join(app.getAppPath(), 'appInfo.json')
  const appInfo = await readJsonFile<Record<string, string>>(appInfoPath)
  if (appInfo) return appInfo
  const fallbackPath = path.join(process.cwd(), 'appInfo.json')
  return await readJsonFile<Record<string, string>>(fallbackPath)
}

/**
 * 比较语义化版本号大小
 * @param a 版本号 A
 * @param b 版本号 B
 * @returns a > b 返回正数，a < b 返回负数，相等返回 0
 */
function compareVersions(a: string, b: string) {
  const normalize = (value: string) => value.split('.').map((part) => Number(part) || 0)
  const aParts = normalize(a)
  const bParts = normalize(b)
  const maxLength = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < maxLength; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * 获取更新元信息（latest.json）
 * 支持 3xx 重定向
 * @param url 更新描述地址
 */
async function fetchUpdateInfo(url: string): Promise<UpdateInfo> {
  return await new Promise((resolve, reject) => {
    const requester = url.startsWith('https') ? httpsRequest : httpRequest
    const req = requester(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString()
        res.resume()
        fetchUpdateInfo(redirectUrl).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Update request failed: ${res.statusCode}`))
        return
      }
      let data = ''
      res.setEncoding('utf-8')
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as UpdateInfo)
        } catch (error) {
          reject(error)
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

/**
 * 下载文件到指定路径并报告进度
 * 支持 3xx 重定向
 * @param url 下载链接
 * @param filePath 本地保存路径
 * @param onProgress 进度回调（已接收字节、总字节）
 */
async function downloadFile(url: string, filePath: string, onProgress: (received: number, total: number) => void) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const requester = url.startsWith('https') ? httpsRequest : httpRequest
    const req = requester(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString()
        res.resume()
        downloadFile(redirectUrl, filePath, onProgress).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`))
        return
      }
      const total = Number(res.headers['content-length'] || 0)
      let received = 0
      const fileStream = fs.createWriteStream(filePath)
      res.on('data', (chunk) => {
        received += chunk.length
        onProgress(received, total)
      })
      res.pipe(fileStream)
      fileStream.on('finish', () => {
        fileStream.close()
        resolve()
      })
      fileStream.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

/**
 * 计算文件 sha256，用于校验下载结果
 * @param filePath 文件路径
 */
async function computeSha256(filePath: string) {
  return await new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

/**
 * 获取应用安装目录（从注册表读取 InstPath）
 * 用于静默升级时保持覆盖原安装目录
 */
async function getInstallDir() {
  const appInfo = await getAppInfo()
  const productPathName = appInfo?.PRODUCT_PATHNAME
  if (!productPathName) return null
  const key = `HKLM\\Software\\${productPathName}`
  return await new Promise<string | null>((resolve) => {
    execFile('reg', ['query', key, '/v', 'InstPath'], (error, stdout) => {
      if (error || !stdout) {
        resolve(null)
        return
      }
      const lines = stdout.split(/\r?\n/)
      const target = lines.find((line) => line.includes('InstPath'))
      if (!target) {
        resolve(null)
        return
      }
      const parts = target.trim().split(/\s+/)
      resolve(parts[parts.length - 1] || null)
    })
  })
}

/**
 * 通过 cmd.exe 启动安装器的兜底方式
 * 避免直接 spawn 安装器时出现权限问题
 * @param installerPath 安装器路径
 * @param args 安装器参数
 */
function startInstallerWithCmd(installerPath: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const commandArgs = ['/c', 'start', '""', installerPath, ...args]
    const child = spawn('cmd.exe', commandArgs, { detached: true, stdio: 'ignore', windowsHide: true })
    child.on('error', reject)
    child.unref()
    resolve()
  })
}

/**
 * 启动安装器并在失败时尝试 cmd 兜底
 * @param installerPath 安装器路径
 * @param args 安装器参数
 */
async function launchInstaller(installerPath: string, args: string[]) {
  await fsp.access(installerPath, fs.constants.F_OK)
  return await new Promise<void>((resolve, reject) => {
    const child = spawn(installerPath, args, { detached: true, stdio: 'ignore', windowsHide: true })
    let settled = false
    child.on('error', async (error) => {
      if (settled) return
      settled = true
      try {
        await startInstallerWithCmd(installerPath, args)
        resolve()
      } catch (err) {
        reject(error ?? err)
      }
    })
    child.unref()
    if (!settled) {
      settled = true
      resolve()
    }
  })
}

/**
 * 检查远端更新信息
 * 返回当前版本、最新版本和是否有更新
 */
ipcMain.handle('update-check', async () => {
  const appInfo = await getAppInfo()
  const updateUrl = appInfo?.UPDATE_URL
  if (!updateUrl) {
    return { currentVersion: app.getVersion(), latestVersion: app.getVersion(), hasUpdate: false }
  }
  const latestInfo = await fetchUpdateInfo(updateUrl)
  updateCache.latest = latestInfo
  updateCache.downloadedFilePath = null
  const currentVersion = app.getVersion()
  const hasUpdate = compareVersions(latestInfo.version, currentVersion) > 0
  const result: UpdateCheckResult = {
    currentVersion,
    latestVersion: latestInfo.version,
    hasUpdate,
    url: latestInfo.url,
    notes: latestInfo.notes
  }
  return result
})

/**
 * 下载更新包并校验 sha256
 * 完成后向渲染进程发送进度与完成事件
 */
ipcMain.handle('update-download', async () => {
  if (!updateCache.latest) {
    throw new Error('No update info cached')
  }
  const targetUrl = updateCache.latest.url
  const fileName = path.basename(new URL(targetUrl).pathname)
  const filePath = path.join(app.getPath('temp'), fileName)
  await downloadFile(targetUrl, filePath, (received, total) => {
    win?.webContents.send('update-download-progress', {
      receivedBytes: received,
      totalBytes: total
    })
  })
  if (updateCache.latest.sha256) {
    const digest = await computeSha256(filePath)
    if (digest.toLowerCase() !== updateCache.latest.sha256.toLowerCase()) {
      throw new Error('sha256 mismatch')
    }
  }
  updateCache.downloadedFilePath = filePath
  win?.webContents.send('update-download-complete', { filePath })
  return { filePath }
})

/**
 * 静默安装更新包并退出当前进程
 * @param _event IPC 事件对象
 * @param filePath 可选，指定安装器路径
 */
ipcMain.handle('update-install', async (_event, filePath?: string) => {
  const installerPath = filePath || updateCache.downloadedFilePath
  if (!installerPath) {
    throw new Error('No installer available')
  }
  const installDir = await getInstallDir()
  const args = ['/S', ...(installDir ? [`/D=${installDir}`] : [])]
  await launchInstaller(installerPath, args)
  isQuitting = true
  app.quit()
  return true
})

/**
 * 创建系统托盘与菜单
 * 托盘支持双击显示主界面
 */
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

/**
 * 创建主窗口并加载渲染进程页面
 * 关闭时隐藏到托盘，避免直接退出
 */
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
