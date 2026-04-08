const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bot', {
  login: (creds) => ipcRenderer.invoke('login', creds),
  logout: () => ipcRenderer.invoke('logout'),
  getSession: () => ipcRenderer.invoke('get-session'),
  toggleBot: (on) => ipcRenderer.invoke('toggle-bot', on),
  getBotRunning: () => ipcRenderer.invoke('get-bot-running'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  windowClose: () => ipcRenderer.send('window-close'),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  onStatusUpdate: (cb) => ipcRenderer.on('status-update', (_, v) => cb(v)),
  onQrUpdate: (cb) => ipcRenderer.on('qr-update', (_, v) => cb(v)),
  onAgentLog: (cb) => ipcRenderer.on('agent-log', (_, v) => cb(v)),
});
