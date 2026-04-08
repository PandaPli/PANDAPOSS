// main.js
process.on('uncaughtException', (e) => console.error('[CRASH]', e.message, e.stack));
process.on('unhandledRejection', (e) => console.error('[REJECTION]', e));

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

// Iniciar servidor de auth local en background
const { server: authServer, PORT: AUTH_PORT } = require('./auth-server');
const AUTH_URL = `http://127.0.0.1:${AUTH_PORT}`;

const store = new Store();
const isDev = process.argv.includes('--dev');
const BASE_URL = 'https://www.pandaposs.com';

let mainWindow;
let tray;
let agentProcess = null;
let pollInterval = null;

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f0f1a',
    show: false,
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Minimize to tray on close
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  // Use a blank 16x16 image as placeholder — proper icon goes in assets/
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('PandaPoss Bot Smart');
  updateTrayMenu('disconnected');

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function updateTrayMenu(status) {
  const statusLabel =
    status === 'connected'
      ? '🟢 Conectado'
      : status === 'waiting_qr'
      ? '🟡 Esperando QR'
      : '🔴 Desconectado';

  const menu = Menu.buildFromTemplate([
    { label: '🐼 PandaPoss Bot Smart', enabled: false },
    { label: statusLabel, enabled: false },
    { type: 'separator' },
    { label: 'Abrir Panel', click: () => mainWindow.show() },
    { label: 'Abrir Dashboard Web', click: () => shell.openExternal('https://www.pandaposs.com/agente') },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.isQuiting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

// ── Agent Process ─────────────────────────────────────────────────────────────
function getAgentPath() {
  if (isDev) return path.join(__dirname, '..', 'whatsapp-agent', 'index.js');
  return path.join(process.resourcesPath, 'whatsapp-agent', 'index.js');
}

async function startAgent() {
  if (agentProcess) return;
  const session = store.get('session');
  if (!session) return;

  // Mark agent as active in the DB so listarAgentes() finds it
  try {
    await _fetch(`${BASE_URL}/api/agente/${session.agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-agente-key': session.apiKey },
      body: JSON.stringify({ activo: true, estado: 'DESCONECTADO' }),
    });
  } catch (e) {
    console.error('[startAgent] No se pudo marcar agente activo:', e.message);
  }

  const agentPath = getAgentPath();

  // En producción usamos el propio ejecutable de Electron como runtime de Node
  // (ELECTRON_RUN_AS_NODE=1 hace que Electron se comporte como node puro)
  // En dev usamos 'node' del sistema directamente
  const nodeExec = isDev ? 'node' : process.execPath;
  const nodeEnv = {
    ...process.env,
    NODE_ENV: 'production',
    ...(isDev ? {} : { ELECTRON_RUN_AS_NODE: '1' }),
  };

  agentProcess = spawn(nodeExec, [agentPath], {
    env: nodeEnv,
    cwd: path.dirname(agentPath),
  });

  agentProcess.stdout.on('data', (data) => {
    const text = data.toString();
    if (mainWindow) mainWindow.webContents.send('agent-log', text);
    if (text.includes('✅ Conectado') || text.includes('Conectado')) {
      sendStatus('connected');
    }
    if (text.includes('QR') || text.includes('qr')) {
      sendStatus('waiting_qr');
    }
  });

  agentProcess.stderr.on('data', (data) => {
    // Forward stderr as logs too so the UI can show them
    const text = data.toString();
    if (mainWindow) mainWindow.webContents.send('agent-log', text);
  });

  agentProcess.on('exit', (code) => {
    agentProcess = null;
    store.set('botRunning', false);
    sendStatus('disconnected');
  });

  store.set('botRunning', true);
}

function stopAgent() {
  if (agentProcess) {
    agentProcess.kill('SIGTERM');
    agentProcess = null;
  }
  store.set('botRunning', false);

  // Mark agent as inactive in the DB (fire-and-forget)
  const session = store.get('session');
  if (session) {
    _fetch(`${BASE_URL}/api/agente/${session.agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-agente-key': session.apiKey },
      body: JSON.stringify({ activo: false, estado: 'DESCONECTADO' }),
    }).catch((e) => console.error('[stopAgent] No se pudo marcar agente inactivo:', e.message));
  }
}

function sendStatus(status) {
  updateTrayMenu(status);
  if (mainWindow) mainWindow.webContents.send('status-update', status);
}

const _fetch = require('node-fetch');

// ── API Polling ───────────────────────────────────────────────────────────────
async function pollAgentStatus() {
  const session = store.get('session');
  if (!session) return;
  try {
    const res = await _fetch(`${BASE_URL}/api/agente/${session.agentId}`, {
      headers: { 'x-agente-key': session.apiKey },
    });
    if (!res.ok) return;
    const data = await res.json();
    const agente = data.agente || data;
    const status =
      agente.estado === 'CONECTADO'
        ? 'connected'
        : agente.estado === 'ESPERANDO_QR'
        ? 'waiting_qr'
        : 'disconnected';
    sendStatus(status);
    if (agente.qrBase64 && mainWindow) {
      mainWindow.webContents.send('qr-update', agente.qrBase64);
    }
  } catch (_) {
    // ignore network errors
  }
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('login', async (_, { email, password }) => {
  try {
    // Login via servidor local de auth
    const loginRes = await _fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => ({}));
      return { ok: false, error: err.error || 'Credenciales incorrectas' };
    }

    const agente = await loginRes.json();
    console.log('[login] ok:', JSON.stringify(agente));

    const data = {
      agentId: agente.agentId ?? null,
      sucursalId: agente.sucursalId ?? null,
      restaurantName: agente.restaurantName ?? 'Mi Restaurante',
      apiKey: 'e305d5c467b743b8d2e04669c34cc0385265e54d021563af0a0f608d4e55cccc',
    };

    store.set('session', data);
    writeAgentEnv(data);
    return { ok: true, data };
  } catch (e) {
    console.error('[login]', e.message);
    return { ok: false, error: 'No se pudo conectar con el servidor' };
  }
});

ipcMain.handle('get-session', () => store.get('session') || null);

ipcMain.handle('logout', () => {
  store.delete('session');
  store.set('botRunning', false);
  stopAgent();
});

ipcMain.handle('toggle-bot', async (_, activate) => {
  if (activate) await startAgent();
  else stopAgent();
  return activate;
});

ipcMain.handle('get-bot-running', () => !!agentProcess);

ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

ipcMain.on('window-close', () => mainWindow.hide());
ipcMain.on('window-minimize', () => mainWindow.minimize());

function writeAgentEnv(session) {
  const fs = require('fs');
  const agentDir = isDev
    ? path.join(__dirname, '..', 'whatsapp-agent')
    : path.join(process.resourcesPath, 'whatsapp-agent');

  const envContent = [
    `PANDAPOSS_URL=https://www.pandaposs.com`,
    `AGENTE_API_KEY=${session.apiKey || ''}`,
    `ANTHROPIC_API_KEY=${session.anthropicKey || ''}`,
    `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`,
    `TEST_MODE=false`,
    `AGENT_ID=${session.agentId || ''}`,
    `SUCURSAL_ID=${session.sucursalId || ''}`,
  ].join('\n');

  try {
    fs.writeFileSync(path.join(agentDir, '.env'), envContent, 'utf8');
  } catch (err) {
    console.error('Could not write agent .env:', err.message);
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  pollInterval = setInterval(pollAgentStatus, 5000);

  // Auto-start agent if it was running before
  const session = store.get('session');
  const wasRunning = store.get('botRunning', false);
  if (session && wasRunning) startAgent();
});

app.on('window-all-closed', (e) => e.preventDefault());

app.on('before-quit', () => {
  if (pollInterval) clearInterval(pollInterval);
  stopAgent();
});
