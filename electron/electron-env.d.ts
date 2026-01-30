/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: {
    on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void): void
    off(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void): void
    send(channel: string, ...args: unknown[]): void
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>
  }
  // 暴露的窗口控制方法
  electron: {
    minimize(): void
    maximize(): void
    close(): void
  }
}
