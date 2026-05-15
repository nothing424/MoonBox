# AniVerse v2 &#x1F3AC; — dengan Supabase Auth

Platform streaming & baca anime, donghua, drakor, manga, manhwa — **login sungguhan** via Supabase.

---

## &#x1F4C1; Struktur File

```
aniverse-v2/
&#x251C;&#x2500;&#x2500; api/
&#x2502;   &#x251C;&#x2500;&#x2500; auth.js        &#x2192; Supabase Auth (signup/signin/signout/me)
&#x2502;   &#x251C;&#x2500;&#x2500; anime.js       &#x2192; Jikan API — GRATIS, no key
&#x2502;   &#x251C;&#x2500;&#x2500; manga.js       &#x2192; Jikan API — manga & manhwa
&#x2502;   &#x251C;&#x2500;&#x2500; drakor.js      &#x2192; TMDB API — Korean drama
&#x2502;   &#x2514;&#x2500;&#x2500; search.js      &#x2192; Unified search
&#x251C;&#x2500;&#x2500; public/
&#x2502;   &#x251C;&#x2500;&#x2500; index.html     &#x2192; SPA utama (login + register + app)
&#x2502;   &#x251C;&#x2500;&#x2500; callback.html  &#x2192; OAuth redirect handler (Google login)
&#x2502;   &#x251C;&#x2500;&#x2500; css/main.css   &#x2192; Semua style (liquid glass, dark/light)
&#x2502;   &#x2514;&#x2500;&#x2500; js/
&#x2502;       &#x251C;&#x2500;&#x2500; auth.js    &#x2192; Auth logic (Supabase client wrapper)
&#x2502;       &#x2514;&#x2500;&#x2500; app.js     &#x2192; App logic, fetch API, render cards
&#x251C;&#x2500;&#x2500; vercel.json        &#x2192; Vercel config + env vars
&#x251C;&#x2500;&#x2500; package.json
&#x251C;&#x2500;&#x2500; .env.example       &#x2192; Template env variables
&#x2514;&#x2500;&#x2500; .gitignore
```

---

## &#x1F680; Deploy ke Vercel — Step by Step

### 1. Buat Akun Supabase (Gratis)

1. Buka [supabase.com](https://supabase.com) &#x2192; **Start your project**
2. Buat project baru (pilih region terdekat, misal Singapore)
3. Tunggu project selesai di-provision (~1 menit)
4. Buka **Project Settings &#x2192; API**
5. Catat:
   - **Project URL** (contoh: `https://abcdefgh.supabase.co`)
   - **anon/public key** (panjang, dimulai `eyJ...`)
   - **service_role key** (RAHASIA, jangan expose ke frontend!)

### 2. Aktifkan Google OAuth di Supabase

1. Di Supabase Dashboard &#x2192; **Authentication &#x2192; Providers**
2. Aktifkan **Google**
3. Kamu perlu **Google Client ID** & **Client Secret**:
   - Buka [console.cloud.google.com](https://console.cloud.google.com)
   - Buat project baru &#x2192; **APIs & Services &#x2192; Credentials**
   - **Create Credentials &#x2192; OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://[PROJECT_ID].supabase.co/auth/v1/callback`
4. Paste Client ID & Secret ke Supabase
5. Di Supabase &#x2192; **Authentication &#x2192; URL Configuration**:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: tambah `https://your-vercel-domain.vercel.app/callback.html`

### 3. Update index.html

Ganti 2 baris meta tag di `public/index.html`:

```html
<meta name="supabase-url"  content="https://XXXXXXXX.supabase.co">
<meta name="supabase-anon" content="eyJhbGciOiJIUzI1NiIs...your_anon_key">
```

> **Aman:** anon key boleh di-expose ke frontend. Service key JANGAN.

### 4. Set Environment Variables di Vercel

Buka **Vercel Dashboard &#x2192; Project &#x2192; Settings &#x2192; Environment Variables**:

| Variable | Nilai |
|---|---|
| `SUPABASE_URL` | `https://XXXXXXXX.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJ...anon_key` |
| `SUPABASE_SERVICE_KEY` | `eyJ...service_role_key` &#x26A0;&#xFE0F; RAHASIA |
| `TMDB_API_KEY` | key dari themoviedb.org (untuk Drakor) |

### 5. Deploy

```bash
# Install dependencies
npm install

# Deploy ke Vercel
npx vercel --prod
```

Atau push ke GitHub dan connect repo ke Vercel untuk auto-deploy.

---

## &#x1F511; Cara Kerja Auth

```
Login Email/Pass:
  Frontend &#x2192; POST /api/auth?action=signin &#x2192; Supabase &#x2192; JWT token
  Token disimpan di localStorage &#x2192; dipakai untuk request berikutnya

Login Google:
  Frontend &#x2192; redirect ke Supabase OAuth URL
  Google &#x2192; callback ke /callback.html dengan token di URL hash
  callback.html verifikasi token via /api/auth?action=me &#x2192; simpan ke localStorage

Daftar:
  Frontend &#x2192; POST /api/auth?action=signup &#x2192; Supabase buat user
  Email konfirmasi dikirim otomatis (bisa dimatikan di Supabase settings)
```

---

## &#x1F527; Tips

**Matikan email konfirmasi** (untuk development):
- Supabase Dashboard &#x2192; Authentication &#x2192; Settings
- Matikan "Enable email confirmations"

**Custom domain Vercel**:
- Jangan lupa update Site URL & Redirect URLs di Supabase setelah ganti domain

**Rate limit Jikan API**:
- Jikan punya rate limit ~3 req/detik
- Data sudah di-cache di server (300 detik via `Cache-Control`)

---

## &#x1F4DD; Lisensi

MIT License &#x2014; bebas digunakan dan dimodifikasi.
