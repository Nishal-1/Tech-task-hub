const { contextBridge, ipcRenderer } = require('electron')

// ── electronAPI is exposed to the renderer (window.electronAPI) ───────────────
contextBridge.exposeInMainWorld('electronAPI', {

  // Get app version / name / platform from the main process
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  // Trigger a manual update check
  checkForUpdate: () => ipcRenderer.invoke('app:check-update'),

  // Show a native OS dialog (IPC demo)
  showMessage: (title, message) =>
    ipcRenderer.invoke('app:show-message', { title, message }),

  // Listen for updater events pushed from main → renderer
  onUpdateAvailable: (cb) => ipcRenderer.on('updater:update-available', (_e, info) => cb(info)),
  onUpToDate:        (cb) => ipcRenderer.on('updater:up-to-date',        (_e, info) => cb(info)),
  onUpdateError:     (cb) => ipcRenderer.on('updater:error',             (_e, msg)  => cb(msg)),
  onDownloadProgress:(cb) => ipcRenderer.on('updater:progress',          (_e, prog) => cb(prog)),
  onUpdateDownloaded:(cb) => ipcRenderer.on('updater:downloaded',        (_e, info) => cb(info)),

  // Remove all listeners (call this on component unmount)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})
