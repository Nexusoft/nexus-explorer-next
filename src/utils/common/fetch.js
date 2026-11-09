import axios from 'axios';

export function fetchMetrics(url) {
  return axios.get(
    `${url || process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/system/get/metrics`,
    { headers: { 'Cache-Control': 'max-age=300' } }
  );
}

export function fetchInfo(url) {
  return axios.get(
    `${url || process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/system/get/info`
  );
}

export function fetchMining(url) {
  return axios.get(
    `${url || process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/ledger/get/info`
  );
}

/** Raw CoinGecko simple/price answer for NXS */
export async function fetchCoingeckoPrice() {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_COINGECKO_BASE_URL}/simple/price`,
    {
      params: {
        ids: 'nexus',
        vs_currencies: 'usd,btc',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      },
      timeout: 10000,
    }
  );
  return res.data;
}

//server side only: one coingecko call per interval for all visitors and page builds
const marketCacheSeconds = 120;
let marketCache = { at: 0, data: null };

/** CoinGecko price from the server cache, last good answer while CoinGecko fails */
export async function cachedCoingeckoPrice() {
  const now = Date.now() / 1000;
  if (marketCache.data && now - marketCache.at < marketCacheSeconds) {
    return marketCache.data;
  }
  try {
    const data = await fetchCoingeckoPrice();
    marketCache = { at: now, data };
    return data;
  } catch (e) {
    if (marketCache.data) return marketCache.data;
    throw e;
  }
}

/**
 * NXS market data from CoinGecko simple/price (coins/nexus no longer answers)
 * Resolves to { data: { market_data } } in the old coins/nexus shape
 */
export async function fetchMarket() {
  //browsers go through our own cached api route, the server asks coingecko itself
  const raw =
    typeof window === 'undefined'
      ? await cachedCoingeckoPrice()
      : (await axios.get('/api/market')).data;
  const p = raw?.nexus;
  if (!p || p.usd == null) {
    throw new Error('No NXS price in CoinGecko response');
  }
  return {
    data: {
      market_data: {
        current_price: { usd: p.usd, btc: p.btc },
        price_change_percentage_24h: p.usd_24h_change,
        total_volume: { usd: p.usd_24h_vol },
        market_cap: { usd: p.usd_market_cap },
      },
    },
  };
}

export async function fetchRecentBlocks(MAX_ROWS = 6) {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/ledger/list/blocks?verbose=summary&limit=${MAX_ROWS}`
  );
  return res.data.result;
}

export async function fetchTransaction(txid) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/ledger/get/transaction?hash=${txid}`
  );
  const resp = await res.json();
  return resp.result;
}

export async function fetchBlock(height) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/ledger/get/block?verbose=summary&height=${height}`
  );
  const resp = await res.json();
  return resp.result;
}

export async function fetchRichlist(
  url = process.env.NEXT_PUBLIC_NEXUS_BASE_URL,
  page = 0,
  limit = 111
) {
  // * to consider the users who have moved their balance to trust
  // * query for both trust and normal accounts
  const json = JSON.stringify({
    page: page,
    sort: 'total',
    order: 'desc',
    limit: limit,
    where: 'results.token=0',
  });

  const page0 = await axios.post(
    `${url}/register/list/finance:accounts,finance:trust`,
    json,
    {
      headers: {
        'Cache-Control': 'max-age=300',
        'Content-Type': 'application/json',
      },
    }
  );

  return { data: [...page0.data.result] };
}

//a static page build gives up on a page after 60 s
const buildTimeout = 20000;

/**
 * Rich list for a static page build: the indexer's copy first, the slow node query only
 * without it, and null when both fail (the page then loads it in the browser)
 */
export async function fetchRichlistForBuild(
  url = process.env.NEXT_PUBLIC_NEXUS_BASE_URL
) {
  try {
    const res = await axios.get(`${url}/explorer/cache/richlist`, {
      timeout: buildTimeout,
    });
    if (Array.isArray(res.data?.result)) {
      return { data: res.data.result.slice(0, 111) };
    }
  } catch (e) {
    //no indexer
  }
  try {
    return await Promise.race([
      fetchRichlist(url),
      new Promise((resolve) => setTimeout(() => resolve(null), buildTimeout)),
    ]);
  } catch (e) {
    return null;
  }
}
