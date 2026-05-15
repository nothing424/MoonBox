// api/auth.js
// Supabase Auth handler — signup / signin / signout / me
// Vercel Serverless Function

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    // ── Sign Up ───────────────────────────────────────────
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, username } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' });
      if (password.length < 6)  return res.status(400).json({ error: 'Password minimal 6 karakter.' });

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: username || email.split('@')[0] }
      });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, message: 'Akun berhasil dibuat! Silakan masuk.' });
    }

    // ── Sign In (email + password) ────────────────────────
    if (action === 'signin' && req.method === 'POST') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' });

      // We use the anon key client for sign-in (user-facing)
      const anonClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY
      );

      const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Email atau password salah.' });

      const user = data.user;
      return res.status(200).json({
        success: true,
        user: {
          id:       user.id,
          email:    user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          initial:  (user.user_metadata?.username || user.email).charAt(0).toUpperCase(),
          avatar:   user.user_metadata?.avatar_url || null
        },
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at:    data.session.expires_at
      });
    }

    // ── Sign Out ──────────────────────────────────────────
    if (action === 'signout' && req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await supabase.auth.admin.signOut(token);
      }
      return res.status(200).json({ success: true });
    }

    // ── Get current user (verify token) ───────────────────
    if (action === 'me' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Token tidak ditemukan.' });

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: 'Sesi tidak valid.' });

      const user = data.user;
      return res.status(200).json({
        success: true,
        user: {
          id:       user.id,
          email:    user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          initial:  (user.user_metadata?.username || user.email).charAt(0).toUpperCase(),
          avatar:   user.user_metadata?.avatar_url || null
        }
      });
    }

    return res.status(404).json({ error: 'Action tidak dikenal.' });

  } catch (err) {
    console.error('[api/auth] Error:', err.message);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
