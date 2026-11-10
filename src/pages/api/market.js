import { cachedCoingeckoPrice } from 'utils/common/fetch';

//browsers ask here instead of coingecko, which rate limits them and then sends no CORS headers
export default async function handler(req, res) {
  try {
    const data = await cachedCoingeckoPrice();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Market data not available' });
  }
}
