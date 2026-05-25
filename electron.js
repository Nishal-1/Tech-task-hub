const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

// ── Auto-updater (only active in packaged builds) ─────────────────────────────
let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater

  autoUpdater.logger = require('electron-log')
  autoUpdater.logger.transports.file.level = 'info'

  // Disable auto-download — we just notify the user
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
} catch {
  console.log('⚠️  electron-updater not available (dev mode or missing package).')
}

// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow = null
let backendProcess = null

// ── Utility: wait for Express to be ready ────────────────────────────────────
function waitForBackend(url, retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      http.get(url, () => resolve())
        .on('error', () => {
          if (++attempts >= retries) return reject(new Error('Backend did not start in time'))
          setTimeout(check, delay)
        })
    }
    check()
  })
}

// ── Start the embedded Express backend (production only) ──────────────────────
function startBackend() {
  // In dev mode the user starts the backend manually
  if (!app.isPackaged) return Promise.resolve()

  const serverPath = path.join(process.resourcesPath, 'server.js')
  console.log('🚀 Spawning backend from:', serverPath)

  backendProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: '5220' },
    stdio: 'pipe',
  })

  backendProcess.stdout.on('data', d => console.log('[backend]', d.toString()))
  backendProcess.stderr.on('data', d => console.error('[backend-err]', d.toString()))

  return waitForBackend('http://localhost:5220/health')
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'TechTask Hub',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // In production load the built Vite bundle; in dev use the dev server
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

// 1. App-info: renderer can ask for the current app version
ipcMain.handle('app:get-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isPackaged: app.isPackaged,
  }
})

// 2. Update check: renderer triggers a manual update check
ipcMain.handle('app:check-update', async () => {
  if (!autoUpdater) return { available: false, reason: 'electron-updater not loaded' }
  if (!app.isPackaged)  return { available: false, reason: 'Running in dev mode' }

  try {
    const result = await autoUpdater.checkForUpdates()
    const isNewer = result && result.updateInfo &&
      result.updateInfo.version !== app.getVersion()
    return {
      available: isNewer,
      version: result?.updateInfo?.version ?? null,
    }
  } catch (err) {
    return { available: false, reason: err.message }
  }
})

// 3. Show native dialog: a simple IPC demo the renderer can call
ipcMain.handle('app:show-message', async (_event, { title, message }) => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: title || 'TechTask Hub',
    message: message || 'Hello from the main process!',
    buttons: ['OK'],
  })
  return { clicked: response === 0 }
})

// ── Auto-updater event wiring ─────────────────────────────────────────────────
function setupUpdaterEvents() {
  if (!autoUpdater || !app.isPackaged) return

  autoUpdater.on('update-available', info => {
    mainWindow?.webContents.send('updater:update-available', info)
  })

  autoUpdater.on('update-not-available', info => {
    mainWindow?.webContents.send('updater:up-to-date', info)
  })

  autoUpdater.on('error', err => {
    mainWindow?.webContents.send('updater:error', err.message)
  })

  autoUpdater.on('download-progress', progress => {
    mainWindow?.webContents.send('updater:progress', progress)
  })

  autoUpdater.on('update-downloaded', info => {
    mainWindow?.webContents.send('updater:downloaded', info)
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Update Ready',
      message: `Version ${info.version} downloaded. Restart now to apply?`,
      buttons: ['Restart', 'Later'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall()
    })
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startBackend()
  } catch (err) {
    console.error('Backend failed to start:', err.message)
  }

  createWindow()
  setupUpdaterEvents()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    backendProcess?.kill()
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('quit', () => {
  backendProcess?.kill()
})