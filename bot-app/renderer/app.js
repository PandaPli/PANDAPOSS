// renderer/app.js — PandaPoss Bot Smart frontend logic

(async function () {
  // ── State ───────────────────────────────────────────────────────────────────
  let session = null;
  let botRunning = false;
  let currentStatus = 'disconnected';

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const viewLogin     = document.getElementById('view-login');
  const viewDashboard = document.getElementById('view-dashboard');

  const loginEmail    = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError    = document.getElementById('login-error');
  const btnLogin      = document.getElementById('btn-login');

  const dashRestaurant = document.getElementById('dash-restaurant');
  const dashPlan       = document.getElementById('dash-plan');

  const statusOrb   = document.getElementById('status-orb');
  const statusLabel = document.getElementById('status-label');
  const btnToggle   = document.getElementById('btn-toggle');

  const qrSection = document.getElementById('qr-section');
  const qrImage   = document.getElementById('qr-image');
  const logOutput = document.getElementById('log-output');

  const btnOpenWeb  = document.getElementById('btn-open-web');
  const btnLogout   = document.getElementById('btn-logout');
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose    = document.getElementById('btn-close');

  // ── View helpers ────────────────────────────────────────────────────────────
  function showView(name) {
    viewLogin.classList.remove('active');
    viewDashboard.classList.remove('active');
    if (name === 'login') viewLogin.classList.add('active');
    else viewDashboard.classList.add('active');
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.add('visible');
  }
  function clearLoginError() {
    loginError.textContent = '';
    loginError.classList.remove('visible');
  }

  // ── Status rendering ────────────────────────────────────────────────────────
  function applyStatus(status) {
    currentStatus = status;

    // Orb
    statusOrb.className = 'status-orb ' + status;

    // Label
    statusLabel.className = 'status-label ' + status;
    const labels = {
      connected:    'CONECTADO',
      waiting_qr:  'ESPERANDO QR',
      disconnected: 'DESCONECTADO',
    };
    statusLabel.textContent = labels[status] || 'DESCONECTADO';

    // QR section visibility
    if (status === 'waiting_qr') {
      qrSection.classList.add('visible');
    } else if (status === 'connected') {
      // Keep QR visible briefly then hide
      setTimeout(() => qrSection.classList.remove('visible'), 3000);
    } else {
      qrSection.classList.remove('visible');
    }
  }

  // ── Toggle button rendering ─────────────────────────────────────────────────
  function applyToggleState(running) {
    botRunning = running;
    if (running) {
      btnToggle.textContent = '⏹ DESACTIVAR BOT';
      btnToggle.className = 'btn-toggle on active-pulse';
    } else {
      btnToggle.textContent = '▶ ACTIVAR BOT';
      btnToggle.className = 'btn-toggle off';
      applyStatus('disconnected');
    }
  }

  // ── Log helper ──────────────────────────────────────────────────────────────
  function appendLog(text) {
    const line = document.createElement('div');
    line.textContent = text.trim();
    logOutput.appendChild(line);
    // Keep last 200 lines
    while (logOutput.childNodes.length > 200) {
      logOutput.removeChild(logOutput.firstChild);
    }
    logOutput.scrollTop = logOutput.scrollHeight;
  }

  // ── Dashboard init ─────────────────────────────────────────────────────────
  function initDashboard(sess) {
    session = sess;
    dashRestaurant.textContent = sess.restaurantName || 'Mi Restaurante';
    dashPlan.textContent       = (sess.plan || 'PRIME').toUpperCase();
    logOutput.innerHTML = '';
    appendLog('Panel listo. Esperando actividad…');
  }

  // ── IPC listeners ───────────────────────────────────────────────────────────
  window.bot.onStatusUpdate((status) => {
    applyStatus(status);
  });

  window.bot.onQrUpdate((base64) => {
    if (!base64) return;
    const src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    qrImage.src = src;
    qrSection.classList.add('visible');
    applyStatus('waiting_qr');
  });

  window.bot.onAgentLog((text) => {
    if (text && text.trim()) appendLog(text);
  });

  // ── Window controls ─────────────────────────────────────────────────────────
  btnMinimize.addEventListener('click', () => window.bot.windowMinimize());
  btnClose.addEventListener('click',    () => window.bot.windowClose());

  // ── Login ────────────────────────────────────────────────────────────────────
  async function handleLogin() {
    clearLoginError();
    const email    = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showLoginError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> Ingresando…';

    const result = await window.bot.login({ email, password });

    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar sesión';

    if (!result.ok) {
      showLoginError(result.error || 'Error al iniciar sesión.');
      return;
    }

    session = result.data;
    initDashboard(session);
    showView('dashboard');

    // Check if bot was already running
    const running = await window.bot.getBotRunning();
    applyToggleState(running);
  }

  btnLogin.addEventListener('click', handleLogin);

  loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginPassword.focus();
  });

  // ── Toggle bot ───────────────────────────────────────────────────────────────
  btnToggle.addEventListener('click', async () => {
    const activating = !botRunning;
    btnToggle.disabled = true;
    btnToggle.innerHTML = '<span class="spinner"></span>';

    await window.bot.toggleBot(activating);
    applyToggleState(activating);

    btnToggle.disabled = false;
    // applyToggleState already set the text
  });

  // ── Open web panel ───────────────────────────────────────────────────────────
  btnOpenWeb.addEventListener('click', () => {
    window.bot.openExternal('https://www.pandaposs.com/agente');
  });

  // ── Logout ───────────────────────────────────────────────────────────────────
  btnLogout.addEventListener('click', async () => {
    if (!confirm('¿Deseas cerrar sesión? El bot se detendrá.')) return;
    await window.bot.logout();
    session = null;
    botRunning = false;
    loginEmail.value = '';
    loginPassword.value = '';
    clearLoginError();
    showView('login');
  });

  // ── Boot ─────────────────────────────────────────────────────────────────────
  const savedSession = await window.bot.getSession();
  if (savedSession) {
    initDashboard(savedSession);
    showView('dashboard');
    const running = await window.bot.getBotRunning();
    applyToggleState(running);
  } else {
    showView('login');
  }
})();
