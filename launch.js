const { spawn } = require('child_process')
const http = require('http')

function waitForServer(url, callback) {
  http.get(url, () => {
    callback()
  }).on('error', () => {
    setTimeout(() => waitForServer(url, callback), 500)
  })
}

waitForServer('http://localhost:3000', () => {
  console.log('Server ready, launching Electron...')
  const electron = spawn('cmd', ['/c', 'node_modules\\.bin\\electron.cmd', '.'], { 
    stdio: 'inherit'
  })
  
  electron.on('close', (code) => {
    process.exit(code)
  })
})