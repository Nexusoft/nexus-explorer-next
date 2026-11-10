/**
 * Market orders from the indexer cache, seen from the token side of an NXS/TOKEN pair
 * Each order gives one asset and wants the other; price is always NXS per 1 token
 */

const isNxs = (side) => String(side?.token) === '0';

/** One order as {side: 'buy'|'sell', price, amount, total} in token / NXS terms */
export function orderRow(o) {
  const give = o?.give || {};
  const want = o?.want || {};
  //gives NXS for the token = buying the token
  const buying = isNxs(give);
  const nxs = buying ? give.amount : want.amount;
  const amount = buying ? want.amount : give.amount;
  return {
    txid: o.txid,
    timestamp: o.timestamp,
    owner: o.owner,
    side: buying ? 'buy' : 'sell',
    amount,
    total: nxs,
    price: amount > 0 ? nxs / amount : null,
  };
}

/** Pair summary plus sorted order book and filled orders */
export function marketView(m) {
  const orders = (m?.orders || []).map(orderRow);
  const filled = (m?.executed || [])
    .map(orderRow)
    .sort((a, b) => b.timestamp - a.timestamp);
  const token = [...(m?.orders || []), ...(m?.executed || [])]
    .map((o) => (isNxs(o.give) ? o.want : o.give))
    .find((s) => s?.token);
  const sells = orders
    .filter((o) => o.side === 'sell')
    .sort((a, b) => a.price - b.price);
  const buys = orders
    .filter((o) => o.side === 'buy')
    .sort((a, b) => b.price - a.price);
  return {
    pair: m.market,
    ticker: token?.ticker || m.market.split('/')[1],
    token: token?.token,
    sells,
    buys,
    filled,
    bestSell: sells[0]?.price ?? null,
    bestBuy: buys[0]?.price ?? null,
    last: filled[0] || null,
  };
}
