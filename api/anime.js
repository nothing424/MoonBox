// api/anime.js — Jikan (MyAnimeList) proxy, no key needed
const JIKAN = process.env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'top', page = 1, genre, q } = req.query;
  let url = '';

  if (type === 'top')    url = `${JIKAN}/top/anime?page=${page}&limit=20`;
  else if (type === 'season') url = `${JIKAN}/seasons/now?page=${page}&limit=20`;
  else if (type === 'search') url = `${JIKAN}/anime?q=${encodeURIComponent(q||'')}&page=${page}&limit=20`;
  else if (type === 'genre')  url = `${JIKAN}/anime?genres=${genre}&page=${page}&limit=20&order_by=score&sort=desc`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Jikan ${r.status}`);
    const d = await r.json();
    const items = (d.data || []).map(a => ({
      id:       a.mal_id,
      title:    a.title_english || a.title,
      image:    a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
      score:    a.score,
      episodes: a.episodes,
      status:   a.status,
      year:     a.year || a.aired?.prop?.from?.year,
      genres:   a.genres?.map(g => g.name) || [],
      synopsis: a.synopsis,
      type:     a.type
    }));
    return res.status(200).json({ success: true, data: items, pagination: d.pagination || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, data: [] });
  }
}
