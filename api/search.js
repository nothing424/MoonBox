// api/search.js — unified search
const JIKAN = process.env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4';
const TMDB  = process.env.TMDB_BASE_URL  || 'https://api.themoviedb.org/3';
const IMG   = process.env.TMDB_IMG_BASE  || 'https://image.tmdb.org/t/p/w500';
const KEY   = process.env.TMDB_API_KEY;

async function safe(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return [];
    const d = await r.json();
    return d.data || d.results || [];
  } catch { return []; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q = '', limit = 4 } = req.query;
  if (!q.trim()) return res.status(400).json({ success: false, error: 'Query wajib diisi.', data: {} });

  const enc = encodeURIComponent(q);
  const [animeRaw, mangaRaw, drakorRaw] = await Promise.all([
    safe(`${JIKAN}/anime?q=${enc}&limit=${limit}`),
    safe(`${JIKAN}/manga?q=${enc}&limit=${limit}`),
    KEY ? safe(`${TMDB}/search/tv?api_key=${KEY}&query=${enc}&with_original_language=ko`) : []
  ]);

  const norm = (items, kind) => items.slice(0, limit).map(i => kind === 'drakor'
    ? { id: i.id, title: i.name, image: i.poster_path ? `${IMG}${i.poster_path}` : null, score: i.vote_average?.toFixed(1), kind }
    : { id: i.mal_id, title: i.title_english || i.title, image: i.images?.jpg?.image_url, score: i.score, kind }
  );

  return res.status(200).json({
    success: true, query: q,
    data: { anime: norm(animeRaw,'anime'), manga: norm(mangaRaw,'manga'), drakor: norm(drakorRaw,'drakor') }
  });
}
