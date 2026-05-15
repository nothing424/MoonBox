// public/js/app.js — AniVerse v3 (6 tabs: Anime·Donghua·Dracin·Drakor·Manga·Manhwa)

const API = {
  anime:   '/api/anime',
  donghua: '/api/donghua',
  dracin:  '/api/dracin',
  drakor:  '/api/drakor',
  manga:   '/api/manga',
  search:  '/api/search'
};

const state = {
  section: 'anime',
  theme: localStorage.getItem('av-theme') || 'dark',
  cache: {},
  playing: false,
  progressTimer: null,
  searchTimer: null
};

// ── Boot ─────────────────────────────────────────────────────
window.App = {
  boot(user) {
    setAvatar(user);
    document.getElementById('mainApp').style.display = 'block';
    applyTheme(state.theme);
    switchSection(document.querySelector('.nav-tab[data-section="anime"]'));
    setTimeout(updatePill, 80);
    showToast('\u2728 Selamat datang di MoonBox, ' + (user.username || user.email) + '!');
  }
};

// ── Theme ─────────────────────────────────────────────────────
function applyTheme(t) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('av-theme', t);
  const lbl = document.getElementById('themeLabel');
  if (lbl) lbl.textContent = t === 'dark' ? '\u{1F319}' : '\u2600\uFE0F';
}
function toggleTheme() { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); }

// ── Avatar ────────────────────────────────────────────────────
function setAvatar(user) {
  const av = document.getElementById('userAvatar');
  if (!av) return;
  const init = av.querySelector('.av-initial');
  const img  = av.querySelector('.av-img');
  if (user.avatar && img) {
    img.src = user.avatar; img.style.display = 'block';
    if (init) init.style.display = 'none';
  } else if (init) {
    init.textContent = (user.username || user.email || 'U').charAt(0).toUpperCase();
  }
  const nameEl = document.getElementById('menuUsername');
  if (nameEl) nameEl.textContent = user.username || user.email;
}

async function logout() {
  await Auth.signOut();
  showToast('\u{1F44B} Sampai jumpa!');
  setTimeout(() => location.reload(), 800);
}

// ── Nav Pill ──────────────────────────────────────────────────
function switchSection(btn) {
  if (!btn) return;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const sec = btn.dataset.section;
  state.section = sec;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('sec-' + sec);
  if (el) el.classList.add('active');
  updatePill();
  loadSection(sec);
}

function updatePill() {
  const active   = document.querySelector('.nav-tab.active');
  const switcher = document.getElementById('navSwitcher');
  const pill     = document.getElementById('switcherPill');
  if (!active || !switcher || !pill) return;
  const sr = switcher.getBoundingClientRect();
  const ar = active.getBoundingClientRect();
  pill.style.left  = (ar.left - sr.left) + 'px';
  pill.style.width = ar.width + 'px';
}
window.addEventListener('resize', updatePill);

// ── Section Loaders ───────────────────────────────────────────
function loadSection(sec) {
  ({ anime: loadAnime, donghua: loadDonghua, dracin: loadDracin,
     drakor: loadDrakor, manga: loadManga, manhwa: loadManhwa })[sec]?.();
}

async function fetchAPI(url) {
  if (state.cache[url]) return state.cache[url];
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (d.success && d.data?.length) state.cache[url] = d;
    return d;
  } catch (e) { console.error('fetchAPI:', e); return { success: false, data: [] }; }
}

async function loadAnime() {
  showSkeletons('anime-trending', 7); showSkeletons('anime-season', 6);
  const [top, season] = await Promise.all([
    fetchAPI(API.anime + '?type=top'),
    fetchAPI(API.anime + '?type=season')
  ]);
  renderCards('anime-trending', top.data    || [], 'video');
  renderCards('anime-season',   season.data || [], 'video');
}

async function loadDonghua() {
  showSkeletons('donghua-popular', 7); showSkeletons('donghua-ona', 6);
  const [pop, ona] = await Promise.all([
    fetchAPI(API.donghua + '?type=popular'),
    fetchAPI(API.donghua + '?type=ona')
  ]);
  renderCards('donghua-popular', pop.data || [], 'video');
  renderCards('donghua-ona',     ona.data || [], 'video');
}

async function loadDracin() {
  showSkeletons('dracin-popular', 7); showSkeletons('dracin-top', 6);
  const [pop, top] = await Promise.all([
    fetchAPI(API.dracin + '?type=popular'),
    fetchAPI(API.dracin + '?type=top_rated')
  ]);
  renderCards('dracin-popular', pop.data || [], 'video');
  renderCards('dracin-top',     top.data || [], 'video');
}

async function loadDrakor() {
  showSkeletons('drakor-popular', 7); showSkeletons('drakor-top', 6);
  const [pop, top] = await Promise.all([
    fetchAPI(API.drakor + '?type=popular'),
    fetchAPI(API.drakor + '?type=top_rated')
  ]);
  renderCards('drakor-popular', pop.data || [], 'video');
  renderCards('drakor-top',     top.data || [], 'video');
}

async function loadManga() {
  showSkeletons('manga-top', 7); showSkeletons('manga-action', 6);
  const [top, action] = await Promise.all([
    fetchAPI(API.manga + '?type=top&subtype=manga'),
    fetchAPI(API.manga + '?type=genre&genre=1')
  ]);
  renderCards('manga-top',    top.data    || [], 'read');
  renderCards('manga-action', action.data || [], 'read');
}

async function loadManhwa() {
  showSkeletons('manhwa-top', 7); showSkeletons('manhwa-action', 6);
  const [top, action] = await Promise.all([
    fetchAPI(API.manga + '?type=top&subtype=manhwa'),
    fetchAPI(API.manga + '?type=genre&genre=1&subtype=manhwa')
  ]);
  renderCards('manhwa-top',    top.data    || [], 'read');
  renderCards('manhwa-action', action.data || [], 'read');
}

// ── Genre Filter ──────────────────────────────────────────────
async function filterGenre(el, sec, gid) {
  el.closest('.genre-tags').querySelectorAll('.genre-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (gid === 'all') return loadSection(sec);

  const readSecs  = ['manga','manhwa'];
  const tmdbSecs  = ['drakor','dracin'];
  const isRead    = readSecs.includes(sec);
  const isTmdb    = tmdbSecs.includes(sec);

  let url, containerId;
  if (isRead) {
    url         = `${API.manga}?type=genre&genre=${gid}&subtype=${sec}`;
    containerId = sec + '-top';
  } else if (isTmdb) {
    url         = `${sec === 'dracin' ? API.dracin : API.drakor}?type=${gid}`;
    containerId = sec + '-popular';
  } else if (sec === 'donghua') {
    url         = `${API.donghua}?type=genre&genre=${gid}`;
    containerId = 'donghua-popular';
  } else {
    url         = `${API.anime}?type=genre&genre=${gid}`;
    containerId = 'anime-trending';
  }

  showSkeletons(containerId, 7);
  const res = await fetchAPI(url);
  renderCards(containerId, res.data || [], isRead ? 'read' : 'video');
}

// ── Render Cards ──────────────────────────────────────────────
function renderCards(id, items, mode) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items.length) { el.innerHTML = fallbackCards(mode, id); return; }
  el.innerHTML = items.slice(0, 14).map(item => cardHTML(item, mode)).join('');
}

function cardHTML(item, mode) {
  const title  = esc(item.title || 'Tidak Diketahui');
  const score  = item.score ? (+item.score).toFixed(1) : '\u2014';
  const year   = item.year || '';
  const ep     = item.episodes ? 'Ep ' + item.episodes : item.chapters ? 'Ch ' + item.chapters : '';
  const img    = item.image || '';
  const isBook = mode === 'read';
  const isLive = item.status === 'Currently Airing' || item.status === 'Returning Series';
  const sa     = `openModal('${escA(item.title)}','${mode}')`;

  return `<div class="card${isBook?' book':''}" onclick="${sa}">
  <div class="card-thumb">
    ${img ? `<img src="${img}" alt="${title}" loading="lazy" onerror="this.style.display='none'">` : ''}
    <div class="card-thumb-ph" style="${img?'display:none':''}">
      ${isBook ? '\u{1F4DA}' : '\u{1F39E}\uFE0F'}
    </div>
    <div class="card-overlay">
      <div class="card-play-btn">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    ${isLive ? '<div class="card-badge">LIVE</div>' : ''}
    ${ep ? `<div class="card-ep">${ep}</div>` : ''}
  </div>
  <div class="card-info">
    <div class="card-title">${title}</div>
    <div class="card-meta">
      <span class="card-score">\u2605 ${score}</span>
      ${year ? `<span>${year}</span>` : ''}
    </div>
  </div>
</div>`;
}

function fallbackCards(mode, containerId) {
  const donghuaFallback = [
    ['Battle Through the Heavens','\u{1F525}','8.4'],
    ['The Daily Life of Immortal King','\u{1F409}','8.6'],
    ['Soul Land','\u{1F30C}','8.3'],
    ['Link Click','\u231A','8.9'],
    ['Heaven Official\'s Blessing','\u{1F334}','9.0'],
    ['Fog Hill of Five Elements','\u{1F301}','8.7']
  ];
  const dracinFallback = [
    ['The Story of Ming Lan','\u{1F3EF}','8.5'],
    ['Nirvana in Fire','\u{1F4DC}','9.2'],
    ['The Untamed','\u{1F5E1}','9.0'],
    ['Love Between Fairy and Devil','\u{1F338}','8.3'],
    ['Word of Honor','\u{1F343}','8.8'],
    ['Ancient Love Poetry','\u2728','8.1']
  ];
  const readFallback = [
    ['One Piece','\u{1F4D6}','9.3'],['Jujutsu Kaisen','\u{1F300}','8.8'],
    ['Chainsaw Man','\u26D3\uFE0F','8.7'],['Solo Leveling','\u{1F451}','9.2'],
    ['Tower of God','\u{1F5FC}','9.0'],['Berserk','\u2694\uFE0F','9.5']
  ];
  const videoFallback = [
    ['Demon Slayer','\u2694\uFE0F','9.1'],['Jujutsu Kaisen','\u{1F300}','8.9'],
    ['One Piece','\u{1F3F4}','9.2'],['Frieren','\u2728','9.4'],
    ['Blue Lock','\u26BD','8.5'],['Solo Leveling','\u{1F451}','8.8']
  ];

  let list;
  if (containerId?.includes('donghua')) list = donghuaFallback;
  else if (containerId?.includes('dracin')) list = dracinFallback;
  else if (mode === 'read') list = readFallback;
  else list = videoFallback;

  return list.map(([t, ic, s]) => `
<div class="card${mode==='read'?' book':''}" onclick="openModal('${escA(t)}','${mode}')">
  <div class="card-thumb">
    <div class="card-thumb-ph">${ic}</div>
    <div class="card-overlay"><div class="card-play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
  </div>
  <div class="card-info">
    <div class="card-title">${esc(t)}</div>
    <div class="card-meta"><span class="card-score">\u2605 ${s}</span></div>
  </div>
</div>`).join('');
}

// ── Skeleton ──────────────────────────────────────────────────
function showSkeletons(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array(n).fill(0).map(() => `
<div class="card">
  <div class="card-thumb"><div class="sk-thumb skeleton"></div></div>
  <div class="card-info">
    <div class="skeleton sk-line" style="width:88%"></div>
    <div class="skeleton sk-line short"></div>
  </div>
</div>`).join('');
}

// ── Search ────────────────────────────────────────────────────
function onSearchInput(e) {
  clearTimeout(state.searchTimer);
  const q = e.target.value.trim();
  const drop = document.getElementById('searchDrop');
  if (!q) { drop.classList.remove('open'); return; }
  state.searchTimer = setTimeout(() => doSearch(q), 420);
}

async function doSearch(q) {
  const drop = document.getElementById('searchDrop');
  drop.innerHTML = '<div class="search-no-result">\u{1F50D} Mencari\u2026</div>';
  drop.classList.add('open');
  const res = await fetchAPI(`${API.search}?q=${encodeURIComponent(q)}&limit=4`);
  if (!res.success) { drop.innerHTML = '<div class="search-no-result">Tidak ada hasil</div>'; return; }

  const all = [
    ...(res.data.anime  || []).map(i => ({ ...i, kind: 'Anime'  })),
    ...(res.data.manga  || []).map(i => ({ ...i, kind: 'Manga'  })),
    ...(res.data.drakor || []).map(i => ({ ...i, kind: 'Drakor' }))
  ].slice(0, 9);

  if (!all.length) {
    drop.innerHTML = '<div class="search-no-result">Tidak ada hasil untuk &ldquo;' + esc(q) + '&rdquo;</div>';
    return;
  }

  const byKind = {};
  all.forEach(i => { (byKind[i.kind] = byKind[i.kind] || []).push(i); });

  drop.innerHTML = Object.entries(byKind).map(([kind, items]) => `
<div class="search-drop-label">${kind}</div>
${items.map(item => `
<div class="search-result-item" onclick="openModal('${escA(item.title)}','${item.kind==='Manga'?'read':'video'}')">
  ${item.image
    ? `<img class="search-result-img" src="${item.image}" alt="" loading="lazy">`
    : `<div class="search-result-img">${item.kind==='Manga'?'\u{1F4DA}':'\u{1F3AC}'}</div>`}
  <div>
    <div class="search-result-title">${esc(item.title)}</div>
    <div class="search-result-kind">${item.kind}</div>
    ${item.score ? `<div class="search-result-score">\u2605 ${item.score}</div>` : ''}
  </div>
</div>`).join('')}`).join('');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-search-wrap'))
    document.getElementById('searchDrop')?.classList.remove('open');
});

// ── Modals ────────────────────────────────────────────────────
function openModal(title, mode) {
  mode === 'read' ? openReader(title) : openPlayer(title);
}

function openPlayer(title) {
  document.getElementById('playerTitle').textContent = title;
  document.getElementById('playerEp').textContent    = 'Episode 1';
  document.getElementById('playerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  state.playing = true;
  document.getElementById('playPauseBtn').innerHTML = pauseIcon();
  startProgress();
}
function closePlayer() {
  document.getElementById('playerModal').classList.remove('open');
  document.body.style.overflow = '';
  state.playing = false;
  clearInterval(state.progressTimer);
}
function togglePlay() {
  state.playing = !state.playing;
  document.getElementById('playPauseBtn').innerHTML = state.playing ? pauseIcon() : playIcon();
  state.playing ? startProgress() : clearInterval(state.progressTimer);
}
function startProgress() {
  clearInterval(state.progressTimer);
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;
  let p = parseFloat(fill.style.width) || 33;
  state.progressTimer = setInterval(() => {
    p = Math.min(p + 0.04, 100);
    fill.style.width = p + '%';
    if (p >= 100) clearInterval(state.progressTimer);
  }, 200);
}
function playIcon()  { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M8 5v14l11-7z"/></svg>'; }
function pauseIcon() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'; }

function openReader(title) {
  document.getElementById('readerTitle').textContent = title;
  document.getElementById('readerCh').textContent    = 'Chapter 1';
  document.getElementById('readerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeReader() {
  document.getElementById('readerModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  if (e.target.id === 'playerModal') closePlayer();
});

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escA(s) { return String(s).replace(/'/g,'&#39;').replace(/"/g,'&quot;').slice(0,180); }
