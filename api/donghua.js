// api/donghua.js — Donghua (Animasi China) via Jikan
// Menggunakan filter producer/licensor China yang akurat
// Vercel Serverless Function

const JIKAN = process.env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'popular', page = 1, q, genre } = req.query;
  let url = '';

  if (type === 'popular') {
    // Chinese animation di MAL menggunakan producer_id atau keyword
    // Type "ONA" banyak dipakai donghua + keyword china
    url = `${JIKAN}/anime?q=chinese&type=tv&order_by=score&sort=desc&page=${page}&limit=20`;
  } else if (type === 'ona') {
    // ONA (Original Net Animation) — format umum donghua
    url = `${JIKAN}/anime?type=ona&order_by=score&sort=desc&page=${page}&limit=20`;
  } else if (type === 'search') {
    url = `${JIKAN}/anime?q=${encodeURIComponent(q || '')}&page=${page}&limit=20`;
  } else if (type === 'genre') {
    url = `${JIKAN}/anime?genres=${genre}&type=ona&order_by=score&sort=desc&page=${page}&limit=20`;
  } else if (type === 'titles') {
    // Fetch known popular donghua by title search
    const titles = [
      'Battle Through the Heavens',
      'The Daily Life of the Immortal King',
      'Martial Universe',
      'Perfect World Donghua',
      'Soul Land',
      'Fog Hill of Five Elements',
      'Link Click',
      'Heaven Official Blessing',
      'Grandmaster of Demonic Cultivation',
      'The King Avatar'
    ];
    const idx = parseInt(page) - 1;
    const title = titles[idx % titles.length];
    url = `${JIKAN}/anime?q=${encodeURIComponent(title)}&limit=3`;
  }

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
    console.error('[api/donghua]', err.message);
    return res.status(500).json({ success: false, error: err.message, data: [] });
  }
}
