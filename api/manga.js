// api/manga.js — Jikan manga & manhwa proxy
const JIKAN = process.env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'top', subtype = 'manga', page = 1, q, genre } = req.query;
  let url = '';

  if (type === 'top') {
    url = subtype === 'manhwa'
      ? `${JIKAN}/manga?genres=43&order_by=score&sort=desc&page=${page}&limit=20`
      : `${JIKAN}/top/manga?type=manga&page=${page}&limit=20`;
  } else if (type === 'search') {
    url = `${JIKAN}/manga?q=${encodeURIComponent(q||'')}&page=${page}&limit=20`;
  } else if (type === 'genre') {
    url = `${JIKAN}/manga?genres=${genre}&page=${page}&limit=20&order_by=score&sort=desc`;
  }

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Jikan ${r.status}`);
    const d = await r.json();
    const items = (d.data || []).map(m => ({
      id:       m.mal_id,
      title:    m.title_english || m.title,
      image:    m.images?.jpg?.large_image_url || m.images?.jpg?.image_url,
      score:    m.score,
      chapters: m.chapters,
      status:   m.status,
      year:     m.published?.prop?.from?.year,
      genres:   m.genres?.map(g => g.name) || [],
      synopsis: m.synopsis,
      type:     m.type
    }));
    return res.status(200).json({ success: true, data: items, pagination: d.pagination || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, data: [] });
  }
}
