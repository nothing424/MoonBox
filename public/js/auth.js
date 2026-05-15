// public/js/auth.js
// AniVerse — Frontend Supabase Auth
// Semua komunikasi auth lewat /api/auth (bukan Supabase langsung)
// sehingga SUPABASE_SERVICE_KEY aman di server

const Auth = (() => {
  const SESSION_KEY = 'av_session';

  // ── Session helpers ──────────────────────────────────────
  function saveSession(user, token, refreshToken, expiresAt) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, refreshToken, expiresAt }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isExpired(session) {
    if (!session?.expiresAt) return true;
    return Date.now() / 1000 > session.expiresAt - 60; // 60s buffer
  }

  // ── API call wrapper ─────────────────────────────────────
  async function callAPI(action, method = 'GET', body = null, token = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body)  opts.body = JSON.stringify(body);

    const res = await fetch(`/api/auth?action=${action}`, opts);
    return res.json();
  }

  // ── Sign Up ──────────────────────────────────────────────
  async function signUp(email, password, username) {
    return callAPI('signup', 'POST', { email, password, username });
  }

  // ── Sign In (email + password) ───────────────────────────
  async function signIn(email, password) {
    const data = await callAPI('signin', 'POST', { email, password });
    if (data.success) {
      saveSession(data.user, data.access_token, data.refresh_token, data.expires_at);
    }
    return data;
  }

  // ── Sign In with Google (Supabase OAuth redirect) ────────
  function signInWithGoogle() {
    // Get Supabase URL from meta tag set in index.html
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const anonKey     = document.querySelector('meta[name="supabase-anon"]')?.content;

    if (!supabaseUrl || !anonKey || supabaseUrl.includes('YOUR_')) {
      showToast('\u26A0\uFE0F Supabase belum dikonfigurasi. Lihat README.');
      return;
    }

    // Redirect to Supabase Google OAuth
    const redirectTo = encodeURIComponent(window.location.origin + '/callback.html');
    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
    window.location.href = oauthUrl;
  }

  // ── Sign Out ─────────────────────────────────────────────
  async function signOut() {
    const session = getSession();
    if (session?.token) {
      await callAPI('signout', 'POST', null, session.token).catch(() => {});
    }
    clearSession();
  }

  // ── Get current user (from localStorage, verified) ───────
  function getUser() {
    const session = getSession();
    if (!session) return null;
    if (isExpired(session)) { clearSession(); return null; }
    return session.user;
  }

  // ── Verify token against server ───────────────────────────
  async function verifySession() {
    const session = getSession();
    if (!session?.token) return null;
    if (isExpired(session)) { clearSession(); return null; }
    try {
      const data = await callAPI('me', 'GET', null, session.token);
      if (data.success) return data.user;
      clearSession(); return null;
    } catch { return null; }
  }

  return { signUp, signIn, signInWithGoogle, signOut, getUser, verifySession, getSession };
})();

// ── Login UI Controller ──────────────────────────────────────
const LoginUI = (() => {
  let activePanel = 'login';

  function switchTab(tab) {
    activePanel = tab;
    document.querySelectorAll('.login-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.login-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + tab);
    });
    clearMsg();
  }

  function showMsg(panelId, msg, type = 'error') {
    const el = document.getElementById(panelId + '-msg');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-msg ' + type;
  }

  function clearMsg() {
    document.querySelectorAll('.auth-msg').forEach(el => {
      el.className = 'auth-msg';
      el.textContent = '';
    });
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Memproses\u2026' : btn.dataset.label;
  }

  async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    clearMsg();

    if (!email || !pass) { showMsg('panel-login', 'Email dan password wajib diisi.'); return; }

    setLoading('btn-login', true);
    const res = await Auth.signIn(email, pass);
    setLoading('btn-login', false);

    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      showMsg('panel-login', res.error || 'Login gagal. Coba lagi.');
    }
  }

  async function handleRegister() {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-pass').value;
    const pass2 = document.getElementById('reg-pass2').value;
    clearMsg();

    if (!name || !email || !pass) { showMsg('panel-register', 'Semua kolom wajib diisi.'); return; }
    if (pass.length < 6)          { showMsg('panel-register', 'Password minimal 6 karakter.'); return; }
    if (pass !== pass2)           { showMsg('panel-register', 'Password tidak cocok.'); return; }

    setLoading('btn-register', true);
    const res = await Auth.signUp(email, pass, name);
    setLoading('btn-register', false);

    if (res.success) {
      showMsg('panel-register', '\u2705 Akun berhasil dibuat! Silakan masuk.', 'success');
      setTimeout(() => switchTab('login'), 1500);
    } else {
      showMsg('panel-register', res.error || 'Pendaftaran gagal.');
    }
  }

  function handleGoogle() {
    Auth.signInWithGoogle();
  }

  // Called after successful login
  function onLoginSuccess(user) {
    const ls = document.getElementById('loginScreen');
    ls.classList.add('fade-out');
    setTimeout(() => {
      ls.style.display = 'none';
      window.App.boot(user);
    }, 500);
  }

  function init() {
    // Tab switching
    document.querySelectorAll('.login-tab').forEach(t => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });

    // Login form
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.dataset.label = 'Masuk Sekarang \u2192';
      btnLogin.addEventListener('click', handleLogin);
    }
    document.getElementById('login-pass')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });

    // Register form
    const btnReg = document.getElementById('btn-register');
    if (btnReg) {
      btnReg.dataset.label = 'Buat Akun \u2192';
      btnReg.addEventListener('click', handleRegister);
    }
    document.getElementById('reg-pass2')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleRegister();
    });

    // Google buttons
    document.querySelectorAll('.btn-google').forEach(b => {
      b.addEventListener('click', handleGoogle);
    });
  }

  return { init, onLoginSuccess, switchTab };
})();
