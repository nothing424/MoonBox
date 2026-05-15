// api/drakor.js — TMDB Korean drama proxy
const TMDB  = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG   = process.env.TMDB_IMG_BASE || 'https://image.tmdb.org/t/p/w500';
const KEY   = process.env.TMDB_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!KEY) return res.status(500).json({
    success: false,
    error: 'TMDB_API_KEY belum diset di Vercel Environment Variables.',
    data: []
  });

  const { type = 'popular', page = 1, q } = req.query;
  const lang = 'language=id-ID&with_original_language=ko';
  let url = '';

  if (type === 'popular')   url = `${TMDB}/discover/tv?api_key=${KEY}&${lang}&sort_by=popularity.desc&page=${page}`;
  else if (type === 'top_rated') url = `${TMDB}/discover/tv?api_key=${KEY}&${lang}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`;
  else if (type === 'search')    url = `${TMDB}/search/tv?api_key=${KEY}&query=${encodeURIComponent(q||'')}&page=${page}`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`TMDB ${r.status}`);
    const d = await r.json();
    const items = (d.results || []).map(t => ({
      id:      t.id,
      title:   t.name,
      image:   t.poster_path   ? `${IMG}${t.poster_path}` : null,
      backdrop:t.backdrop_path ? `https://image.tmdb.org/t/p/w1280${t.backdrop_path}` : null,
      score:   t.vote_average?.toFixed(1),
      year:    t.first_air_date?.split('-')[0],
      synopsis:t.overview,
      source:  'tmdb'
    }));
    return res.status(200).json({ success: true, data: items, total_pages: d.total_pages });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, data: [] });
  }
}
